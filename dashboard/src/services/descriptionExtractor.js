/**
 * Intelligent Description Extractor Service
 * Extracts structured data from incident descriptions using:
 * 1. Keyword matching
 * 2. Regex patterns
 * 3. LLM fallback for low confidence
 */

import { keywordDatabase, findCategoryByKeyword } from '../data/keywordDatabase';
import { llmConfig } from '../config/llmConfig';

// ==================== MAIN EXTRACTION FUNCTION ====================
export async function extractFromDescription(description, options = {}) {
  const {
    useLLM = llmConfig.extraction.useLLM,
    llmThreshold = llmConfig.extraction.llmThreshold,
    autoApproveThreshold = llmConfig.extraction.autoApproveThreshold,
    forceReview = false
  } = options;

  // Step 1: Pre-process text
  const cleanedText = preprocessText(description);
  
  // Step 2: Extract using keywords and regex
  const keywordExtraction = extractWithKeywords(cleanedText);
  
  // Step 3: Calculate confidence score
  const confidence = calculateConfidence(keywordExtraction, cleanedText);
  
  // Step 4: If low confidence and LLM enabled, use LLM
  let llmExtraction = null;
  if (useLLM && confidence < llmThreshold) {
    try {
      llmExtraction = await extractWithLLM(description);
    } catch (error) {
      console.error('LLM extraction failed:', error);
    }
  }
  
  // Step 5: Merge results
  const finalResult = mergeExtractions(keywordExtraction, llmExtraction);
  
  // Step 6: Determine if admin review needed
  const needsReview = forceReview || 
    confidence < 0.5 ||
    (finalResult.uncertainItems?.length || 0) > 0;

  // Step 7: Determine auto-approval status
  const autoApproved = !needsReview && confidence >= autoApproveThreshold;

  return {
    ...finalResult,
    confidence,
    needsReview,
    autoApproved,
    extractionMethod: llmExtraction ? 'hybrid' : 'keyword',
    originalText: description,
    timestamp: new Date().toISOString()
  };
}

// ==================== TEXT PREPROCESSING ====================
function preprocessText(text) {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .replace(/[^\w\s.,!?-]/g, ' ') // Remove special chars except basic punctuation
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

// ==================== KEYWORD EXTRACTION ====================
function extractWithKeywords(text) {
  const result = {
    supplies: [],
    locations: [],
    vulnerableGroups: [],
    quantities: [],
    urgency: 'medium',
    uncertainItems: []
  };

  // Extract supplies
  Object.entries(keywordDatabase.supplies).forEach(([category, data]) => {
    data.keywords.forEach(keyword => {
      if (text.includes(keyword.toLowerCase())) {
        // Try to extract quantity for this item
        const quantity = extractQuantityForItem(text, keyword);
        
        result.supplies.push({
          item: keyword,
          category: category,
          quantity: quantity.value,
          unit: quantity.unit,
          priority: data.priority,
          icon: data.icon,
          confidence: quantity.value ? 0.9 : 0.7
        });
      }
    });
  });

  // Extract locations
  Object.entries(keywordDatabase.locations).forEach(([category, data]) => {
    data.keywords.forEach(keyword => {
      if (text.includes(keyword.toLowerCase())) {
        // Try to find the location name
        const locationName = extractLocationName(text, keyword);
        
        result.locations.push({
          type: category,
          keyword: keyword,
          name: locationName,
          icon: data.icon,
          confidence: locationName ? 0.85 : 0.6
        });
      }
    });
  });

  // Extract vulnerable groups
  Object.entries(keywordDatabase.vulnerableGroups).forEach(([category, data]) => {
    data.keywords.forEach(keyword => {
      if (text.includes(keyword.toLowerCase())) {
        const count = extractCountForGroup(text, keyword);
        
        result.vulnerableGroups.push({
          group: category,
          keyword: keyword,
          count: count,
          priority: data.priority,
          icon: data.icon,
          confidence: count > 0 ? 0.9 : 0.65
        });
      }
    });
  });

  // Extract general quantities
  keywordDatabase.quantityPatterns.patterns.forEach(pattern => {
    const matches = text.matchAll(pattern.regex);
    for (const match of matches) {
      result.quantities.push({
        value: parseInt(match[1]),
        type: pattern.type,
        context: match[0],
        confidence: 0.85
      });
    }
  });

  // Determine urgency
  result.urgency = determineUrgency(text);

  // Remove duplicates
  result.supplies = deduplicateItems(result.supplies);
  result.vulnerableGroups = deduplicateGroups(result.vulnerableGroups);

  return result;
}

// ==================== QUANTITY EXTRACTION HELPERS ====================
function extractQuantityForItem(text, item) {
  // Patterns like "5 packets of rice", "need 10 blankets", "3 kg rice"
  const patterns = [
    new RegExp(`(\\d+)\\s*(packs?|packets?|boxes?|kg|liters?|bottles?|units?)?\\s*(?:of\\s+)?${escapeRegex(item)}`, 'gi'),
    new RegExp(`${escapeRegex(item)}\\s*[-:]?\\s*(\\d+)\\s*(packs?|packets?|boxes?|kg|liters?|units?)?`, 'gi'),
    new RegExp(`need[s]?\\s+(\\d+)\\s*(packs?|packets?)?\\s*(?:of\\s+)?${escapeRegex(item)}`, 'gi')
  ];

  for (const pattern of patterns) {
    const match = pattern.exec(text);
    if (match) {
      return {
        value: parseInt(match[1]),
        unit: match[2] || 'units'
      };
    }
  }

  return { value: null, unit: null };
}

function extractCountForGroup(text, groupKeyword) {
  // Pattern like "5 elders", "10 pregnant women"
  const pattern = new RegExp(`(\\d+)\\s*${escapeRegex(groupKeyword)}`, 'gi');
  const match = pattern.exec(text);
  
  if (match) {
    return parseInt(match[1]);
  }
  
  // Alternative: keyword before number "elders: 5"
  const altPattern = new RegExp(`${escapeRegex(groupKeyword)}[:\\s]+(\\d+)`, 'gi');
  const altMatch = altPattern.exec(text);
  
  return altMatch ? parseInt(altMatch[1]) : 0;
}

function extractLocationName(text, locationKeyword) {
  // Try to find proper nouns before/after location keyword
  // Pattern: "Ratnapura Central School", "St. Mary's Hospital"
  const patterns = [
    new RegExp(`([A-Z][\\w\\s'.-]+)\\s+${escapeRegex(locationKeyword)}`, 'g'),
    new RegExp(`${escapeRegex(locationKeyword)}\\s+([A-Z][\\w\\s'.-]+)`, 'g'),
    new RegExp(`at\\s+([\\w\\s'.-]+)\\s+${escapeRegex(locationKeyword)}`, 'gi')
  ];

  // Need to search in original case text
  const originalText = text; // Assuming we might want to preserve this
  
  for (const pattern of patterns) {
    const match = pattern.exec(text);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return null;
}

// ==================== URGENCY DETERMINATION ====================
function determineUrgency(text) {
  const { urgencyIndicators } = keywordDatabase;
  
  // Check critical indicators
  for (const indicator of urgencyIndicators.critical) {
    if (text.includes(indicator.toLowerCase())) {
      return 'critical';
    }
  }
  
  // Check high indicators
  for (const indicator of urgencyIndicators.high) {
    if (text.includes(indicator.toLowerCase())) {
      return 'high';
    }
  }
  
  // Check medium indicators
  for (const indicator of urgencyIndicators.medium) {
    if (text.includes(indicator.toLowerCase())) {
      return 'medium';
    }
  }
  
  return 'low';
}

// ==================== CONFIDENCE CALCULATION ====================
function calculateConfidence(extraction, text) {
  let score = 0;
  let factors = 0;

  // Factor 1: Number of supplies found
  if (extraction.supplies.length > 0) {
    score += 0.3;
    // Bonus for quantities
    const withQuantity = extraction.supplies.filter(s => s.quantity).length;
    score += (withQuantity / extraction.supplies.length) * 0.2;
  }
  factors++;

  // Factor 2: Vulnerable groups identified
  if (extraction.vulnerableGroups.length > 0) {
    score += 0.2;
    const withCount = extraction.vulnerableGroups.filter(g => g.count > 0).length;
    score += (withCount / extraction.vulnerableGroups.length) * 0.1;
  }
  factors++;

  // Factor 3: Location identified
  if (extraction.locations.length > 0) {
    score += 0.15;
    const withName = extraction.locations.filter(l => l.name).length;
    score += (withName / extraction.locations.length) * 0.1;
  }
  factors++;

  // Factor 4: Quantities extracted
  if (extraction.quantities.length > 0) {
    score += 0.15;
  }
  factors++;

  // Normalize
  const confidence = Math.min(score, 1);
  
  return Math.round(confidence * 100) / 100;
}

// ==================== LLM EXTRACTION ====================
export async function extractWithLLM(description) {
  // Check if LLM is configured
  if (!llmConfig.isConfigured()) {
    console.warn('No LLM API key found. Skipping LLM extraction.');
    console.info('To enable LLM: Add VITE_OPENAI_API_KEY to your .env file');
    return null;
  }

  const provider = llmConfig.getActiveProvider();
  
  if (provider === 'openai') {
    return await extractWithOpenAI(description);
  } else if (provider === 'anthropic') {
    return await extractWithAnthropic(description);
  }
  
  return null;
}

// OpenAI Extraction
async function extractWithOpenAI(description) {
  const { apiKey, model, temperature, maxTokens, endpoint } = llmConfig.openai;

  const prompt = `Extract structured information from this disaster incident description. Return ONLY valid JSON.

Description: "${description}"

Extract:
1. supplies_needed: Array of {item, quantity, unit, priority (critical/high/medium/low), target_group}
2. location: {type (school/hospital/temple/residential/government), name, area}
3. vulnerable_groups: Array of {type (elderly/infant/children/pregnant/disabled/medical_condition), count, special_needs}
4. people_affected: {total, trapped, injured, missing}
5. urgency: critical/high/medium/low

JSON Response:`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), llmConfig.extraction.timeout);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'system',
            content: 'You are a disaster response data extractor. Extract structured data from incident descriptions. Always respond with valid JSON only, no explanations.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: temperature,
        max_tokens: maxTokens
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return null;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('LLM request timed out');
    } else {
      console.error('OpenAI extraction error:', error);
    }
    return null;
  }
}

// Anthropic/Claude Extraction (alternative)
async function extractWithAnthropic(description) {
  const { apiKey, model, endpoint } = llmConfig.anthropic;

  const prompt = `Extract structured information from this disaster incident description. Return ONLY valid JSON.

Description: "${description}"

Extract and return as JSON:
{
  "supplies_needed": [{"item": "", "quantity": 0, "unit": "", "priority": "high", "target_group": ""}],
  "location": {"type": "", "name": "", "area": ""},
  "vulnerable_groups": [{"type": "", "count": 0, "special_needs": ""}],
  "people_affected": {"total": 0, "trapped": 0, "injured": 0, "missing": 0},
  "urgency": "high"
}`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: model,
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.content[0]?.text;
    
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return null;
  } catch (error) {
    console.error('Anthropic extraction error:', error);
    return null;
  }
}

// ==================== MERGE EXTRACTIONS ====================
function mergeExtractions(keywordResult, llmResult) {
  if (!llmResult) {
    return keywordResult;
  }

  const merged = { ...keywordResult };

  // Merge supplies from LLM
  if (llmResult.supplies_needed) {
    llmResult.supplies_needed.forEach(llmSupply => {
      const existing = merged.supplies.find(s => 
        s.item.toLowerCase().includes(llmSupply.item?.toLowerCase()) ||
        llmSupply.item?.toLowerCase().includes(s.item.toLowerCase())
      );
      
      if (existing) {
        // Update with LLM data if more complete
        if (!existing.quantity && llmSupply.quantity) {
          existing.quantity = llmSupply.quantity;
        }
        if (llmSupply.target_group) {
          existing.targetGroup = llmSupply.target_group;
        }
        existing.confidence = Math.max(existing.confidence, 0.85);
      } else {
        // Add new supply from LLM
        merged.supplies.push({
          item: llmSupply.item,
          quantity: llmSupply.quantity,
          unit: llmSupply.unit || 'units',
          priority: llmSupply.priority || 'medium',
          targetGroup: llmSupply.target_group,
          confidence: 0.8,
          source: 'llm'
        });
      }
    });
  }

  // Merge vulnerable groups from LLM
  if (llmResult.vulnerable_groups) {
    llmResult.vulnerable_groups.forEach(llmGroup => {
      const existing = merged.vulnerableGroups.find(g => 
        g.group.toLowerCase() === llmGroup.type?.toLowerCase()
      );
      
      if (existing) {
        if (!existing.count && llmGroup.count) {
          existing.count = llmGroup.count;
        }
        if (llmGroup.special_needs) {
          existing.specialNeeds = llmGroup.special_needs;
        }
      } else {
        merged.vulnerableGroups.push({
          group: llmGroup.type,
          count: llmGroup.count || 0,
          specialNeeds: llmGroup.special_needs,
          confidence: 0.8,
          source: 'llm'
        });
      }
    });
  }

  // Merge location from LLM
  if (llmResult.location && llmResult.location.name) {
    const existingLocation = merged.locations.find(l => l.type === llmResult.location.type);
    if (existingLocation) {
      if (!existingLocation.name) {
        existingLocation.name = llmResult.location.name;
      }
    } else {
      merged.locations.push({
        type: llmResult.location.type,
        name: llmResult.location.name,
        area: llmResult.location.area,
        confidence: 0.8,
        source: 'llm'
      });
    }
  }

  // Merge people affected from LLM
  if (llmResult.people_affected) {
    merged.peopleAffected = {
      ...merged.peopleAffected,
      ...llmResult.people_affected
    };
  }

  // Use LLM urgency if higher
  if (llmResult.urgency) {
    const urgencyOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    if (urgencyOrder[llmResult.urgency] > urgencyOrder[merged.urgency]) {
      merged.urgency = llmResult.urgency;
    }
  }

  // Increase overall confidence for hybrid extraction
  merged.confidence = Math.min((merged.confidence || 0.5) + 0.15, 0.95);

  return merged;
}

// ==================== HELPER FUNCTIONS ====================
function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function deduplicateItems(items) {
  const seen = new Map();
  
  items.forEach(item => {
    const key = item.item.toLowerCase();
    if (!seen.has(key) || (item.quantity && !seen.get(key).quantity)) {
      seen.set(key, item);
    }
  });
  
  return Array.from(seen.values());
}

function deduplicateGroups(groups) {
  const seen = new Map();
  
  groups.forEach(group => {
    const key = group.group;
    const existing = seen.get(key);
    
    if (!existing || group.count > (existing.count || 0)) {
      seen.set(key, group);
    }
  });
  
  return Array.from(seen.values());
}

// ==================== BATCH PROCESSING ====================
export async function batchExtract(incidents, options = {}) {
  const results = [];
  
  for (const incident of incidents) {
    const extraction = await extractFromDescription(
      incident.description,
      options
    );
    
    results.push({
      incidentId: incident.id,
      extraction,
      incident
    });
  }
  
  return results;
}

// ==================== AGGREGATION FUNCTIONS ====================
export function aggregateSupplyNeeds(extractions) {
  const supplyMap = new Map();
  
  extractions.forEach(({ extraction }) => {
    extraction.supplies.forEach(supply => {
      const key = `${supply.category}-${supply.item}`.toLowerCase();
      
      if (supplyMap.has(key)) {
        const existing = supplyMap.get(key);
        existing.totalQuantity += supply.quantity || 1;
        existing.incidentCount++;
        existing.priority = getHigherPriority(existing.priority, supply.priority);
      } else {
        supplyMap.set(key, {
          item: supply.item,
          category: supply.category,
          totalQuantity: supply.quantity || 1,
          unit: supply.unit,
          incidentCount: 1,
          priority: supply.priority,
          icon: supply.icon
        });
      }
    });
  });
  
  return Array.from(supplyMap.values())
    .sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
}

export function aggregateByLocation(extractions) {
  const locationMap = new Map();
  
  extractions.forEach(({ extraction, incident }) => {
    extraction.locations.forEach(location => {
      const key = location.type;
      
      if (!locationMap.has(key)) {
        locationMap.set(key, {
          type: location.type,
          icon: location.icon,
          locations: [],
          totalIncidents: 0
        });
      }
      
      const category = locationMap.get(key);
      category.totalIncidents++;
      
      if (location.name) {
        const existingLoc = category.locations.find(l => l.name === location.name);
        if (existingLoc) {
          existingLoc.incidentCount++;
          existingLoc.incidents.push(incident);
        } else {
          category.locations.push({
            name: location.name,
            incidentCount: 1,
            incidents: [incident]
          });
        }
      }
    });
  });
  
  return Object.fromEntries(locationMap);
}

export function aggregateVulnerableGroups(extractions) {
  const groupMap = new Map();
  
  extractions.forEach(({ extraction }) => {
    extraction.vulnerableGroups.forEach(group => {
      const key = group.group;
      
      if (groupMap.has(key)) {
        const existing = groupMap.get(key);
        existing.totalCount += group.count || 0;
        existing.incidentCount++;
      } else {
        groupMap.set(key, {
          group: key,
          icon: group.icon,
          totalCount: group.count || 0,
          incidentCount: 1,
          priority: group.priority
        });
      }
    });
  });
  
  return Array.from(groupMap.values())
    .sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
}

function getHigherPriority(p1, p2) {
  const order = { critical: 0, high: 1, medium: 2, low: 3 };
  return order[p1] <= order[p2] ? p1 : p2;
}

export default {
  extractFromDescription,
  extractWithLLM,
  batchExtract,
  aggregateSupplyNeeds,
  aggregateByLocation,
  aggregateVulnerableGroups
};

