/**
 * Extraction API Routes
 * Handles extracted data from incident descriptions
 */

import express from 'express';
import { db } from '../db/database.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// ==================== EXTRACTED SUPPLIES ====================

// Get all extracted supplies (with optional filters)
router.get('/supplies', async (req, res) => {
  try {
    const { category, priority, incidentId, verified } = req.query;
    let supplies = db.data.extractedSupplies || [];
    
    // Apply filters
    if (category) {
      supplies = supplies.filter(s => s.category === category);
    }
    if (priority) {
      supplies = supplies.filter(s => s.priority === priority);
    }
    if (incidentId) {
      supplies = supplies.filter(s => s.incidentId === incidentId);
    }
    if (verified !== undefined) {
      supplies = supplies.filter(s => s.verified === (verified === 'true'));
    }
    
    res.json(supplies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get aggregated supply needs
router.get('/supplies/aggregated', async (req, res) => {
  try {
    const supplies = db.data.extractedSupplies || [];
    
    // Aggregate by item/category
    const aggregated = {};
    supplies.forEach(supply => {
      const key = `${supply.category}-${supply.item}`.toLowerCase();
      
      if (!aggregated[key]) {
        aggregated[key] = {
          item: supply.item,
          category: supply.category,
          totalQuantity: 0,
          unit: supply.unit,
          incidentCount: 0,
          priority: supply.priority,
          icon: supply.icon,
          incidents: []
        };
      }
      
      aggregated[key].totalQuantity += supply.quantity || 1;
      aggregated[key].incidentCount++;
      aggregated[key].incidents.push(supply.incidentId);
      
      // Keep highest priority
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      if (priorityOrder[supply.priority] < priorityOrder[aggregated[key].priority]) {
        aggregated[key].priority = supply.priority;
      }
    });
    
    // Sort by priority
    const sorted = Object.values(aggregated).sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
    
    res.json(sorted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Save extracted supplies for an incident
router.post('/supplies', async (req, res) => {
  try {
    const { incidentId, supplies } = req.body;
    
    if (!incidentId || !supplies || !Array.isArray(supplies)) {
      return res.status(400).json({ error: 'incidentId and supplies array required' });
    }
    
    const savedSupplies = supplies.map(supply => ({
      id: uuidv4(),
      incidentId,
      item: supply.item,
      category: supply.category,
      quantity: supply.quantity,
      unit: supply.unit || 'units',
      priority: supply.priority || 'medium',
      targetGroup: supply.targetGroup,
      icon: supply.icon,
      confidence: supply.confidence,
      verified: false,
      source: supply.source || 'keyword',
      createdAt: new Date().toISOString()
    }));
    
    db.data.extractedSupplies.push(...savedSupplies);
    await db.write();
    
    res.status(201).json(savedSupplies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verify/Update a supply item
router.patch('/supplies/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const index = db.data.extractedSupplies.findIndex(s => s.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Supply not found' });
    }
    
    db.data.extractedSupplies[index] = {
      ...db.data.extractedSupplies[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    await db.write();
    res.json(db.data.extractedSupplies[index]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== VULNERABLE GROUPS ====================

// Get all vulnerable groups
router.get('/vulnerable-groups', async (req, res) => {
  try {
    const { incidentId, group, priority } = req.query;
    let groups = db.data.vulnerableGroups || [];
    
    if (incidentId) {
      groups = groups.filter(g => g.incidentId === incidentId);
    }
    if (group) {
      groups = groups.filter(g => g.group === group);
    }
    if (priority) {
      groups = groups.filter(g => g.priority === priority);
    }
    
    res.json(groups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get aggregated vulnerable groups
router.get('/vulnerable-groups/aggregated', async (req, res) => {
  try {
    const groups = db.data.vulnerableGroups || [];
    
    const aggregated = {};
    groups.forEach(group => {
      const key = group.group;
      
      if (!aggregated[key]) {
        aggregated[key] = {
          group: key,
          totalCount: 0,
          incidentCount: 0,
          priority: group.priority,
          icon: group.icon,
          specialNeeds: []
        };
      }
      
      aggregated[key].totalCount += group.count || 0;
      aggregated[key].incidentCount++;
      if (group.specialNeeds) {
        aggregated[key].specialNeeds.push(group.specialNeeds);
      }
    });
    
    res.json(Object.values(aggregated));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Save vulnerable groups for an incident
router.post('/vulnerable-groups', async (req, res) => {
  try {
    const { incidentId, groups } = req.body;
    
    if (!incidentId || !groups || !Array.isArray(groups)) {
      return res.status(400).json({ error: 'incidentId and groups array required' });
    }
    
    const savedGroups = groups.map(group => ({
      id: uuidv4(),
      incidentId,
      group: group.group,
      keyword: group.keyword,
      count: group.count || 0,
      priority: group.priority || 'medium',
      specialNeeds: group.specialNeeds,
      icon: group.icon,
      confidence: group.confidence,
      createdAt: new Date().toISOString()
    }));
    
    db.data.vulnerableGroups.push(...savedGroups);
    await db.write();
    
    res.status(201).json(savedGroups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== LOCATION CATEGORIES ====================

// Get all extracted locations
router.get('/locations', async (req, res) => {
  try {
    const { type, incidentId } = req.query;
    let locations = db.data.extractedLocations || [];
    
    if (type) {
      locations = locations.filter(l => l.type === type);
    }
    if (incidentId) {
      locations = locations.filter(l => l.incidentId === incidentId);
    }
    
    res.json(locations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get locations grouped by type
router.get('/locations/by-type', async (req, res) => {
  try {
    const locations = db.data.extractedLocations || [];
    
    const grouped = {};
    locations.forEach(loc => {
      if (!grouped[loc.type]) {
        grouped[loc.type] = {
          type: loc.type,
          icon: loc.icon,
          count: 0,
          locations: []
        };
      }
      
      grouped[loc.type].count++;
      if (loc.name && !grouped[loc.type].locations.find(l => l.name === loc.name)) {
        grouped[loc.type].locations.push({
          name: loc.name,
          incidentId: loc.incidentId
        });
      }
    });
    
    res.json(grouped);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Save extracted locations
router.post('/locations', async (req, res) => {
  try {
    const { incidentId, locations } = req.body;
    
    if (!incidentId || !locations || !Array.isArray(locations)) {
      return res.status(400).json({ error: 'incidentId and locations array required' });
    }
    
    const savedLocations = locations.map(loc => ({
      id: uuidv4(),
      incidentId,
      type: loc.type,
      name: loc.name,
      area: loc.area,
      keyword: loc.keyword,
      icon: loc.icon,
      confidence: loc.confidence,
      createdAt: new Date().toISOString()
    }));
    
    db.data.extractedLocations.push(...savedLocations);
    await db.write();
    
    res.status(201).json(savedLocations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== ADMIN REVIEW QUEUE ====================

// Get all items pending review
router.get('/review-queue', async (req, res) => {
  try {
    const { status } = req.query;
    let queue = db.data.adminReviewQueue || [];
    
    if (status) {
      queue = queue.filter(item => item.status === status);
    }
    
    // Sort by creation date (newest first)
    queue.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json(queue);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add item to review queue
router.post('/review-queue', async (req, res) => {
  try {
    const { incidentId, originalText, extractedData, confidence, reason } = req.body;
    
    const reviewItem = {
      id: uuidv4(),
      incidentId,
      originalText,
      extractedData,
      confidence,
      reason: reason || 'Low confidence extraction',
      status: 'pending', // pending, approved, corrected, rejected
      adminNotes: null,
      reviewedBy: null,
      reviewedAt: null,
      createdAt: new Date().toISOString()
    };
    
    db.data.adminReviewQueue.push(reviewItem);
    await db.write();
    
    res.status(201).json(reviewItem);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Process review item (approve/correct/reject)
router.patch('/review-queue/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes, correctedData, reviewedBy } = req.body;
    
    const index = db.data.adminReviewQueue.findIndex(item => item.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Review item not found' });
    }
    
    const item = db.data.adminReviewQueue[index];
    
    // Update review item
    db.data.adminReviewQueue[index] = {
      ...item,
      status,
      adminNotes,
      correctedData: correctedData || null,
      reviewedBy,
      reviewedAt: new Date().toISOString()
    };
    
    // If corrected, save to keyword learning
    if (status === 'corrected' && correctedData) {
      db.data.keywordLearning.push({
        id: uuidv4(),
        originalText: item.originalText,
        originalExtraction: item.extractedData,
        correctedData,
        incidentId: item.incidentId,
        createdAt: new Date().toISOString()
      });
    }
    
    await db.write();
    
    res.json(db.data.adminReviewQueue[index]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== FULL EXTRACTION SAVE ====================

// Save complete extraction for an incident
router.post('/save-extraction', async (req, res) => {
  try {
    const { 
      incidentId, 
      supplies, 
      locations, 
      vulnerableGroups, 
      confidence, 
      needsReview,
      originalText 
    } = req.body;
    
    if (!incidentId) {
      return res.status(400).json({ error: 'incidentId required' });
    }
    
    const results = {
      supplies: [],
      locations: [],
      vulnerableGroups: [],
      reviewItem: null
    };
    
    // Save supplies
    if (supplies && supplies.length > 0) {
      const savedSupplies = supplies.map(supply => ({
        id: uuidv4(),
        incidentId,
        ...supply,
        verified: !needsReview,
        createdAt: new Date().toISOString()
      }));
      db.data.extractedSupplies.push(...savedSupplies);
      results.supplies = savedSupplies;
    }
    
    // Save locations
    if (locations && locations.length > 0) {
      const savedLocations = locations.map(loc => ({
        id: uuidv4(),
        incidentId,
        ...loc,
        createdAt: new Date().toISOString()
      }));
      db.data.extractedLocations.push(...savedLocations);
      results.locations = savedLocations;
    }
    
    // Save vulnerable groups
    if (vulnerableGroups && vulnerableGroups.length > 0) {
      const savedGroups = vulnerableGroups.map(group => ({
        id: uuidv4(),
        incidentId,
        ...group,
        createdAt: new Date().toISOString()
      }));
      db.data.vulnerableGroups.push(...savedGroups);
      results.vulnerableGroups = savedGroups;
    }
    
    // Add to review queue if needed
    if (needsReview) {
      const reviewItem = {
        id: uuidv4(),
        incidentId,
        originalText,
        extractedData: { supplies, locations, vulnerableGroups },
        confidence,
        reason: confidence < 0.6 ? 'Low confidence extraction' : 'Contains uncertain items',
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      db.data.adminReviewQueue.push(reviewItem);
      results.reviewItem = reviewItem;
    }
    
    await db.write();
    
    res.status(201).json({
      success: true,
      ...results
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== STATISTICS ====================

// Get extraction statistics
router.get('/stats', async (req, res) => {
  try {
    const supplies = db.data.extractedSupplies || [];
    const locations = db.data.extractedLocations || [];
    const groups = db.data.vulnerableGroups || [];
    const queue = db.data.adminReviewQueue || [];
    
    res.json({
      totalSupplies: supplies.length,
      verifiedSupplies: supplies.filter(s => s.verified).length,
      totalLocations: locations.length,
      totalVulnerableGroups: groups.length,
      totalVulnerableCount: groups.reduce((sum, g) => sum + (g.count || 0), 0),
      pendingReviews: queue.filter(q => q.status === 'pending').length,
      approvedReviews: queue.filter(q => q.status === 'approved').length,
      correctedReviews: queue.filter(q => q.status === 'corrected').length,
      suppliesByCategory: supplies.reduce((acc, s) => {
        acc[s.category] = (acc[s.category] || 0) + 1;
        return acc;
      }, {}),
      suppliesByPriority: supplies.reduce((acc, s) => {
        acc[s.priority] = (acc[s.priority] || 0) + 1;
        return acc;
      }, {})
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

