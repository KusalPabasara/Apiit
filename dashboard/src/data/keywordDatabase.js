/**
 * Keyword Database for Intelligent Description Extraction
 * Categories: Supplies, Locations, Vulnerable Groups, Quantities
 */

export const keywordDatabase = {
  // ==================== SUPPLY CATEGORIES ====================
  supplies: {
    medical: {
      keywords: [
        'medicine', 'medicines', 'medication', 'medications', 'drugs',
        'insulin', 'tablets', 'pills', 'syrup', 'injection', 'injections',
        'bandage', 'bandages', 'first aid', 'antiseptic', 'paracetamol',
        'antibiotics', 'painkillers', 'ointment', 'cream', 'drops',
        'inhaler', 'nebulizer', 'oxygen', 'oxygen cylinder', 'saline',
        'glucose', 'iv drip', 'syringe', 'syringes', 'gloves', 'masks',
        'thermometer', 'bp monitor', 'blood pressure', 'wheelchair',
        'crutches', 'walking stick', 'stretcher', 'medical supplies'
      ],
      priority: 'critical',
      icon: '💊'
    },
    baby: {
      keywords: [
        'milk powder', 'baby milk', 'formula', 'infant formula',
        'baby food', 'cerelac', 'nestum', 'grow pro', 'lactogen',
        'similac', 'nan', 'enfamil', 'baby diapers', 'diapers',
        'nappies', 'pampers', 'baby wipes', 'wet wipes', 'baby bottle',
        'feeding bottle', 'pacifier', 'baby clothes', 'baby blanket',
        'baby soap', 'baby oil', 'baby powder', 'diaper rash cream',
        'gripe water', 'teething gel', 'baby carrier'
      ],
      priority: 'critical',
      icon: '👶'
    },
    elderly: {
      keywords: [
        'adult diapers', 'adult nappies', 'depends', 'tena',
        'walking frame', 'walker', 'hearing aid', 'dentures',
        'reading glasses', 'spectacles', 'blood sugar monitor',
        'diabetes kit', 'bp machine', 'oxygen concentrator',
        'bed pan', 'urinal', 'commode chair', 'hospital bed',
        'mattress', 'pressure mattress', 'elder care'
      ],
      priority: 'high',
      icon: '👴'
    },
    food: {
      keywords: [
        'rice', 'dry rations', 'rations', 'food packets', 'food',
        'biscuits', 'bread', 'water', 'drinking water', 'water bottles',
        'bottled water', 'canned food', 'tinned food', 'dhal', 'lentils',
        'sugar', 'salt', 'oil', 'cooking oil', 'coconut', 'tea', 'coffee',
        'milk packets', 'dry fish', 'spices', 'flour', 'noodles',
        'instant noodles', 'ready to eat', 'cooked food', 'meals',
        'breakfast', 'lunch', 'dinner', 'snacks', 'fruits', 'vegetables'
      ],
      priority: 'high',
      icon: '🍚'
    },
    water: {
      keywords: [
        'clean water', 'safe water', 'purified water', 'mineral water',
        'water purification', 'water tablets', 'aquatabs', 'water filter',
        'water tank', 'water bowser', 'drinking water supply'
      ],
      priority: 'critical',
      icon: '💧'
    },
    clothing: {
      keywords: [
        'clothes', 'clothing', 'garments', 'dress', 'dresses',
        'shirts', 'pants', 'trousers', 'sarees', 'sarongs',
        'underwear', 'undergarments', 'socks', 'shoes', 'slippers',
        'sandals', 'blankets', 'bedsheets', 'towels', 'raincoats',
        'jackets', 'sweaters', 'warm clothes', 'winter clothes'
      ],
      priority: 'medium',
      icon: '👕'
    },
    shelter: {
      keywords: [
        'tents', 'tarpaulin', 'tarps', 'plastic sheets', 'roofing',
        'shelter materials', 'temporary shelter', 'sleeping bags',
        'mattresses', 'mats', 'sleeping mats', 'pillows', 'mosquito nets',
        'rope', 'nails', 'tools', 'hammer', 'building materials'
      ],
      priority: 'high',
      icon: '🏕️'
    },
    hygiene: {
      keywords: [
        'soap', 'detergent', 'washing powder', 'shampoo', 'toothpaste',
        'toothbrush', 'sanitary pads', 'sanitary napkins', 'tampons',
        'toilet paper', 'tissue', 'disinfectant', 'hand sanitizer',
        'bleach', 'cleaning supplies', 'garbage bags', 'dustbin'
      ],
      priority: 'medium',
      icon: '🧼'
    },
    equipment: {
      keywords: [
        'torch', 'flashlight', 'batteries', 'candles', 'matches',
        'lighter', 'radio', 'mobile charger', 'power bank', 'generator',
        'fuel', 'petrol', 'diesel', 'kerosene', 'gas cylinder', 'stove',
        'cooking utensils', 'pots', 'pans', 'plates', 'cups', 'spoons'
      ],
      priority: 'medium',
      icon: '🔦'
    }
  },

  // ==================== LOCATION CATEGORIES ====================
  locations: {
    school: {
      keywords: [
        'school', 'schools', 'vidyalaya', 'maha vidyalaya', 'college',
        'primary school', 'secondary school', 'national school',
        'international school', 'montessori', 'preschool', 'nursery',
        'university', 'campus', 'educational', 'students', 'classroom'
      ],
      icon: '🏫'
    },
    hospital: {
      keywords: [
        'hospital', 'hospitals', 'medical center', 'medical centre',
        'clinic', 'dispensary', 'health center', 'health centre',
        'maternity', 'icu', 'emergency room', 'ward', 'opd',
        'general hospital', 'teaching hospital', 'private hospital',
        'government hospital', 'base hospital', 'district hospital'
      ],
      icon: '🏥'
    },
    religious: {
      keywords: [
        'temple', 'kovil', 'church', 'mosque', 'vihara', 'devalaya',
        'buddhist temple', 'hindu temple', 'catholic church',
        'christian church', 'muslim mosque', 'prayer hall',
        'meditation center', 'religious place', 'shrine'
      ],
      icon: '🛕'
    },
    government: {
      keywords: [
        'divisional secretariat', 'ds office', 'grama niladhari',
        'gn office', 'pradeshiya sabha', 'municipal council',
        'urban council', 'police station', 'post office',
        'government office', 'district secretariat', 'kachcheri'
      ],
      icon: '🏛️'
    },
    shelter: {
      keywords: [
        'relief camp', 'evacuation center', 'evacuation centre',
        'temporary shelter', 'refugee camp', 'community hall',
        'town hall', 'community center', 'welfare center',
        'safe zone', 'assembly point', 'gathering point'
      ],
      icon: '🏠'
    },
    residential: {
      keywords: [
        'house', 'houses', 'home', 'homes', 'residence', 'flat',
        'apartment', 'building', 'village', 'area', 'lane', 'road',
        'street', 'housing scheme', 'estate', 'colony'
      ],
      icon: '🏘️'
    }
  },

  // ==================== VULNERABLE GROUPS ====================
  vulnerableGroups: {
    elderly: {
      keywords: [
        'elder', 'elders', 'elderly', 'old', 'aged', 'senior',
        'seniors', 'senior citizen', 'senior citizens', 'old age',
        'grandparent', 'grandmother', 'grandfather', 'pensioner',
        '60+', '70+', '80+', 'bedridden elderly'
      ],
      priority: 'high',
      icon: '👴'
    },
    infant: {
      keywords: [
        'baby', 'babies', 'infant', 'infants', 'newborn', 'newborns',
        'toddler', 'toddlers', 'month old', 'months old', 'year old',
        'days old', 'weeks old', 'nursing', 'breastfeeding'
      ],
      priority: 'critical',
      icon: '👶'
    },
    children: {
      keywords: [
        'child', 'children', 'kids', 'kid', 'minor', 'minors',
        'school children', 'students', 'orphan', 'orphans'
      ],
      priority: 'high',
      icon: '🧒'
    },
    pregnant: {
      keywords: [
        'pregnant', 'pregnancy', 'expecting', 'expectant mother',
        'pregnant woman', 'pregnant women', 'maternity', 'prenatal',
        'antenatal', 'delivery', 'labor', 'labour', 'due date'
      ],
      priority: 'critical',
      icon: '🤰'
    },
    disabled: {
      keywords: [
        'disabled', 'disability', 'handicapped', 'physically challenged',
        'wheelchair bound', 'paralyzed', 'blind', 'visually impaired',
        'deaf', 'hearing impaired', 'mute', 'speech impaired',
        'mentally challenged', 'special needs', 'bedridden'
      ],
      priority: 'high',
      icon: '♿'
    },
    medical_conditions: {
      keywords: [
        'diabetic', 'diabetes', 'heart patient', 'cardiac', 'asthma',
        'asthmatic', 'cancer', 'kidney', 'dialysis', 'transplant',
        'hypertension', 'blood pressure', 'epilepsy', 'seizures',
        'chronic', 'terminally ill', 'patient', 'patients', 'sick',
        'illness', 'disease', 'condition', 'treatment'
      ],
      priority: 'critical',
      icon: '🏥'
    }
  },

  // ==================== QUANTITY PATTERNS ====================
  quantityPatterns: {
    // Regex patterns for extracting quantities
    patterns: [
      { regex: /(\d+)\s*(people|persons|individuals)/gi, type: 'people' },
      { regex: /(\d+)\s*(families|family|households)/gi, type: 'families' },
      { regex: /(\d+)\s*(elders?|elderly|seniors?)/gi, type: 'elderly' },
      { regex: /(\d+)\s*(babies?|infants?|newborns?)/gi, type: 'infants' },
      { regex: /(\d+)\s*(children|kids|minors?)/gi, type: 'children' },
      { regex: /(\d+)\s*(pregnant)/gi, type: 'pregnant' },
      { regex: /(\d+)\s*(disabled|handicapped)/gi, type: 'disabled' },
      { regex: /(\d+)\s*(patients?|sick)/gi, type: 'patients' },
      { regex: /(\d+)\s*(trapped|stranded|stuck|marooned)/gi, type: 'trapped' },
      { regex: /(\d+)\s*(missing)/gi, type: 'missing' },
      { regex: /(\d+)\s*(injured|wounded|hurt)/gi, type: 'injured' },
      { regex: /(\d+)\s*(dead|deceased|deaths?|casualties)/gi, type: 'deceased' },
      { regex: /(\d+)\s*(rescued|saved|evacuated)/gi, type: 'rescued' },
      { regex: /(\d+)\s*(packs?|packets?|boxes?|cartons?)/gi, type: 'packs' },
      { regex: /(\d+)\s*(kg|kilos?|kilograms?)/gi, type: 'kg' },
      { regex: /(\d+)\s*(liters?|litres?|l\b)/gi, type: 'liters' },
      { regex: /(\d+)\s*(bottles?)/gi, type: 'bottles' },
      { regex: /(\d+)\s*(units?|pieces?|items?)/gi, type: 'units' }
    ]
  },

  // ==================== URGENCY INDICATORS ====================
  urgencyIndicators: {
    critical: [
      'urgent', 'urgently', 'emergency', 'critical', 'immediately',
      'asap', 'life threatening', 'dying', 'severe', 'serious',
      'desperate', 'dire', 'crucial', 'vital', 'sos', 'help',
      'rescue needed', 'trapped', 'stranded', 'no food', 'no water',
      'starving', 'dehydrated', 'bleeding', 'unconscious'
    ],
    high: [
      'soon', 'quickly', 'fast', 'important', 'needed', 'required',
      'running out', 'running low', 'shortage', 'scarce', 'limited',
      'insufficient', 'not enough', 'more needed'
    ],
    medium: [
      'need', 'needs', 'require', 'requires', 'want', 'request',
      'asking for', 'looking for', 'seeking'
    ]
  },

  // ==================== SINHALA/TAMIL KEYWORDS ====================
  // Common romanized Sinhala/Tamil words
  localLanguage: {
    supplies: [
      'sahal', 'hal', 'bath', 'kema', 'watura', 'beheth',
      'kiri', 'piti', 'sudu', 'redda', 'andum', 'pohosat'
    ],
    locations: [
      'pansala', 'palliya', 'kovila', 'iskole', 'rohala',
      'gama', 'nagare', 'palath', 'pradeshiya'
    ],
    people: [
      'minissu', 'pavul', 'lamai', 'amma', 'thaththa',
      'aiyya', 'akka', 'nangi', 'malli', 'seeya', 'achchi'
    ]
  }
};

// Helper function to get all keywords for a category
export function getAllKeywords(category) {
  const result = [];
  const categoryData = keywordDatabase[category];
  
  if (categoryData) {
    Object.values(categoryData).forEach(subCategory => {
      if (subCategory.keywords) {
        result.push(...subCategory.keywords);
      }
    });
  }
  
  return result;
}

// Helper function to find category by keyword
export function findCategoryByKeyword(keyword, mainCategory) {
  const lowerKeyword = keyword.toLowerCase();
  const categoryData = keywordDatabase[mainCategory];
  
  if (categoryData) {
    for (const [subCatName, subCat] of Object.entries(categoryData)) {
      if (subCat.keywords && subCat.keywords.some(k => 
        lowerKeyword.includes(k.toLowerCase()) || k.toLowerCase().includes(lowerKeyword)
      )) {
        return {
          category: mainCategory,
          subCategory: subCatName,
          ...subCat
        };
      }
    }
  }
  
  return null;
}

export default keywordDatabase;

