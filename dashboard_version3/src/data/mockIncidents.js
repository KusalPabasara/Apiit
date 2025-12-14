// Mock incident data for demonstration
// Updated with rich descriptions for intelligent extraction system

export const mockIncidents = [
  // ==================== CRITICAL INCIDENTS ====================
  {
    id: '1',
    incident_type: 'flood',
    severity: 1,
    latitude: 6.6828,
    longitude: 80.3992,
    description: 'URGENT: Severe flooding at Ratnapura Central School. 120 students and 15 teachers trapped on second floor. Water level 4 feet and rising. Need immediate rescue boats. 8 elders among staff need adult diapers (L size). 2 pregnant teachers require medical attention. School kitchen flooded - urgently need 150 food packets, 200 water bottles, and dry rations for 3 days.',
    responder_name: 'Team Alpha',
    responder_id: 'resp_001',
    created_at: new Date(Date.now() - 30 * 60000).toISOString(),
    resolved_at: null,
    photo: null
  },
  {
    id: '2',
    incident_type: 'landslide',
    severity: 1,
    latitude: 6.7123,
    longitude: 80.4156,
    description: 'Critical landslide in Kiriella village near Buddhist Temple (Maha Vihara). 45 people trapped including 12 elderly persons and 6 children under 5 years. 3 month old baby needs Lactogen milk powder urgently. 2 diabetic patients need insulin injections. Require stretchers, first aid kits, and oxygen cylinders. 8 families need emergency shelter and blankets.',
    responder_name: 'Team Bravo',
    responder_id: 'resp_002',
    created_at: new Date(Date.now() - 45 * 60000).toISOString(),
    resolved_at: null,
    photo: null
  },
  {
    id: '3',
    incident_type: 'flood',
    severity: 1,
    latitude: 6.6456,
    longitude: 80.3678,
    description: 'Emergency at Ratnapura General Hospital - ground floor flooded. 25 patients being relocated to upper floors. Critical need: 10 wheelchairs, 5 oxygen concentrators, IV drips and saline. 3 pregnant women in labor ward need immediate evacuation. 15 bedridden elderly patients require adult diapers and bed pans. Hospital kitchen destroyed - need 100 cooked meal packets.',
    responder_name: 'Team Charlie',
    responder_id: 'resp_003',
    created_at: new Date(Date.now() - 60 * 60000).toISOString(),
    resolved_at: null,
    photo: null
  },

  // ==================== HIGH PRIORITY INCIDENTS ====================
  {
    id: '4',
    incident_type: 'flood',
    severity: 2,
    latitude: 6.6234,
    longitude: 80.4567,
    description: 'Flood at Eheliyagoda Divisional Secretariat area. 35 families (approximately 150 people) evacuated to community hall. Among them: 20 elders, 8 infants (3 newborns), 5 pregnant women, and 3 disabled persons in wheelchairs. Urgent needs: baby milk powder (Anchor, Lactogen), baby diapers (small and medium), sanitary pads, mosquito nets, and 50 sleeping mats.',
    responder_name: 'Team Delta',
    responder_id: 'resp_004',
    created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
    resolved_at: null,
    photo: null
  },
  {
    id: '5',
    incident_type: 'landslide',
    severity: 2,
    latitude: 6.7456,
    longitude: 80.3234,
    description: 'Landslide blocked road to Palmadulla village. 60 people stranded including students from local primary school. 4 heart patients need medication urgently. 7 elders over 70 years old need walking sticks and blood pressure medicine. School children need biscuits, water bottles, and notebooks (school exams next week). Need tarpaulins for temporary shelter.',
    responder_name: 'Team Echo',
    responder_id: 'resp_005',
    created_at: new Date(Date.now() - 3 * 3600000).toISOString(),
    resolved_at: null,
    photo: null
  },
  {
    id: '6',
    incident_type: 'road_block',
    severity: 2,
    latitude: 6.6789,
    longitude: 80.4890,
    description: 'Major road block near Ayagama junction due to fallen trees. Medical supply truck stuck - contains insulin, antibiotics, and vaccines for Ratnapura hospital. 3 ambulances unable to pass. Reported 2 pregnant women in nearby houses showing labor signs. Village has 15 elderly with chronic conditions waiting for medicine delivery. Need chain saws and heavy equipment.',
    responder_name: 'Team Alpha',
    responder_id: 'resp_001',
    created_at: new Date(Date.now() - 4 * 3600000).toISOString(),
    resolved_at: null,
    photo: null
  },

  // ==================== MEDIUM PRIORITY INCIDENTS ====================
  {
    id: '7',
    incident_type: 'flood',
    severity: 3,
    latitude: 6.7234,
    longitude: 80.3567,
    description: 'Flooding near Kahawatta Hindu Kovil. Temple premises sheltering 80 displaced persons. Among refugees: 10 elders, 12 children under 10, 2 disabled persons. Temple kitchen operational but running low on rice (need 50 kg), dhal (20 kg), and cooking oil (10 liters). Also need: 30 blankets, hygiene kits with soap and toothpaste, and torch lights with batteries.',
    responder_name: 'Team Bravo',
    responder_id: 'resp_002',
    created_at: new Date(Date.now() - 5 * 3600000).toISOString(),
    resolved_at: null,
    photo: null
  },
  {
    id: '8',
    incident_type: 'power_line_down',
    severity: 3,
    latitude: 6.6567,
    longitude: 80.4123,
    description: 'Power lines down at Nivithigala area affecting 500+ households. Local medical clinic operating on generator but fuel running out. Clinic has 5 dialysis patients who need power for machines. 3 homes with infants need candles and safe lighting. Request: generator fuel (50 liters diesel), power banks for medical equipment, and emergency lighting for elderly homes.',
    responder_name: 'Team Charlie',
    responder_id: 'resp_003',
    created_at: new Date(Date.now() - 6 * 3600000).toISOString(),
    resolved_at: null,
    photo: null
  },
  {
    id: '9',
    incident_type: 'landslide',
    severity: 3,
    latitude: 6.7012,
    longitude: 80.3890,
    description: 'Partial landslide near St. Mary\'s Church, Balangoda. Church hall being used as relief camp for 40 people from 12 families. Special needs: 6 month old twins need Cerelac baby food and formula milk. 4 elderly diabetics need sugar-free biscuits and glucose monitoring strips. 2 asthmatic children need inhalers. Pastor requesting 20 mattresses and children\'s clothing.',
    responder_name: 'Team Delta',
    responder_id: 'resp_004',
    created_at: new Date(Date.now() - 7 * 3600000).toISOString(),
    resolved_at: null,
    photo: null
  },
  {
    id: '10',
    incident_type: 'flood',
    severity: 3,
    latitude: 6.6890,
    longitude: 80.4234,
    description: 'Flash flood at Pelmadulla Grama Niladhari division. GN office coordinating relief for 25 families. Immediate needs: 100 liters clean drinking water (water purification tablets if available), 25 kg rice, canned fish, instant noodles. 8 pregnant women registered - need prenatal vitamins and sanitary supplies. School children need dry uniforms and school bags.',
    responder_name: 'Team Echo',
    responder_id: 'resp_005',
    created_at: new Date(Date.now() - 8 * 3600000).toISOString(),
    resolved_at: null,
    photo: null
  },

  // ==================== RESOLVED BUT RICH DATA ====================
  {
    id: '11',
    incident_type: 'flood',
    severity: 2,
    latitude: 7345,
    longitude: 80.3678,
    description: 'Resolved: Flood at Ratnapura Municipal Council area. Evacuated 200 people to Town Hall. Distributed: 200 food packets, 50 kg rice, baby supplies for 10 infants, adult diapers for 15 elders, medicines for 8 diabetics and 5 hypertension patients. 3 pregnant women transported to hospital safely. All families returned home after water receded.',
    responder_name: 'Team Alpha',
    responder_id: 'resp_001',
    created_at: new Date(Date.now() - 10 * 3600000).toISOString(),
    resolved_at: new Date(Date.now() - 3 * 3600000).toISOString(),
    photo: null
  },
  {
    id: '12',
    incident_type: 'landslide',
    severity: 3,
    latitude: 6.7567,
    longitude: 80.3456,
    description: 'Resolved: Landslide near Kalawana tea estate. Workers\' quarters damaged - 30 estate workers and families relocated. Provided: 30 blankets, dry rations for 50 people, milk powder for 5 children, medicines for 4 elderly. Estate dispensary restocked with first aid supplies, bandages, and paracetamol tablets.',
    responder_name: 'Team Bravo',
    responder_id: 'resp_002',
    created_at: new Date(Date.now() - 12 * 3600000).toISOString(),
    resolved_at: new Date(Date.now() - 5 * 3600000).toISOString(),
    photo: null
  },

  // ==================== LOW PRIORITY BUT DETAILED ====================
  {
    id: '13',
    incident_type: 'road_block',
    severity: 4,
    latitude: 6.6345,
    longitude: 80.4678,
    description: 'Minor road block on Ratnapura-Colombo road. Traffic diverted. Stranded bus with 45 passengers including 5 elders and 3 children. Bus company arranging alternative transport. Passengers need water bottles and snacks. One elderly passenger is diabetic - given glucose tablets from emergency kit.',
    responder_name: 'Team Charlie',
    responder_id: 'resp_003',
    created_at: new Date(Date.now() - 14 * 3600000).toISOString(),
    resolved_at: new Date(Date.now() - 12 * 3600000).toISOString(),
    photo: null
  },
  {
    id: '14',
    incident_type: 'power_line_down',
    severity: 4,
    latitude: 6.7678,
    longitude: 80.3234,
    description: 'Power line repair ongoing at Godakawela. 100 households affected. Elderly care home in area has 20 residents - provided emergency generator. Care home needs: adult diapers (medium and large), vitamin supplements, and blood pressure monitors. Power restoration expected within 6 hours.',
    responder_name: 'Team Delta',
    responder_id: 'resp_004',
    created_at: new Date(Date.now() - 16 * 3600000).toISOString(),
    resolved_at: new Date(Date.now() - 8 * 3600000).toISOString(),
    photo: null
  },

  // ==================== RECENT INCIDENTS (Last Hour) ====================
  {
    id: '15',
    incident_type: 'landslide',
    severity: 2,
    latitude: 6.6678,
    longitude: 80.3789,
    description: 'my dog is dead',
    responder_name: 'Team Echo',
    responder_id: 'resp_005',
    created_at: new Date(Date.now() - 15 * 60000).toISOString(),
    resolved_at: null,
    photo: null
  },
  {
    id: '16',
    incident_type: 'flood',
    severity: 2,
    latitude: 6.7234,
    longitude: 80.4012,
    description: 'Rising water levels at Weligepola. Local mosque opened for 50 displaced people. Community needs: 50 prayer mats (for use as sleeping mats), halal food packets, clean water containers. Special cases: 6 elders with mobility issues, 8 month pregnant woman, 4 month old baby needs Nan milk powder and pampers small size, elderly man needs kidney medicine.',
    responder_name: 'Team Alpha',
    responder_id: 'resp_001',
    created_at: new Date(Date.now() - 20 * 60000).toISOString(),
    resolved_at: null,
    photo: null
  },
  {
    id: '17',
    incident_type: 'road_block',
    severity: 3,
    latitude: 6.6912,
    longitude: 80.3567,
    description: 'Debris blocking access to Embilipitiya road. Medical team cannot reach rural health center. Health center has: 3 patients needing insulin injections, 2 women in late pregnancy for checkup, 5 children due for vaccinations. Need to clear road for ambulance access. Health center low on: bandages, antiseptic, and children\'s paracetamol syrup.',
    responder_name: 'Team Bravo',
    responder_id: 'resp_002',
    created_at: new Date(Date.now() - 25 * 60000).toISOString(),
    resolved_at: null,
    photo: null
  },
  {
    id: '18',
    incident_type: 'landslide',
    severity: 3,
    latitude: 6.7123,
    longitude: 80.3890,
    description: 'Soil erosion threat near Rakwana estate bungalows. 15 families (60 people) moved to estate community hall. Manager requesting: 60 sleeping bags, mosquito coils, drinking water (100 liters), dry rations. Among displaced: 8 elders, 6 children (2 infants needing milk powder and diapers), 1 pregnant woman (7 months). Estate clinic needs fever medicine and oral rehydration salts.',
    responder_name: 'Team Charlie',
    responder_id: 'resp_003',
    created_at: new Date(Date.now() - 35 * 60000).toISOString(),
    resolved_at: null,
    photo: null
  },
  {
    id: '19',
    incident_type: 'flood',
    severity: 3,
    latitude: 6.6456,
    longitude: 80.4234,
    description: 'Waterlogging at Kuruwita agricultural area. Farmers shelter at Kuruwita Pradeshiya Sabha building. 30 people including 4 elders with arthritis needing pain relief medicine, 5 children needing school supplies (books got wet). Community kitchen set up - needs: rice 30 kg, vegetables, spices, cooking utensils. Also requesting: gumboots for farmers, tarpaulins for crop protection.',
    responder_name: 'Team Delta',
    responder_id: 'resp_004',
    created_at: new Date(Date.now() - 40 * 60000).toISOString(),
    resolved_at: null,
    photo: null
  },
  {
    id: '20',
    incident_type: 'power_line_down',
    severity: 3,
    latitude: 6.7456,
    longitude: 80.3678,
    description: 'Power outage at Opanayaka affecting rural clinic and 3 villages. Clinic has refrigerated vaccines and insulin that need cold storage - urgent need for ice boxes. Village has: 2 homes with patients on oxygen concentrators (need manual ventilation support), 5 newborns in area need warm clothing (no heaters working), 10 elderly living alone need candles and flashlights. Request: solar lanterns, ice packs, warm blankets for infants.',
    responder_name: 'Team Echo',
    responder_id: 'resp_005',
    created_at: new Date(Date.now() - 50 * 60000).toISOString(),
    resolved_at: null,
    photo: null
  }
];

// ==================== SUMMARY ====================
// Total: 20 incidents with RICH descriptions for extraction
//
// SUPPLIES MENTIONED:
// - Medical: insulin, medicines, antibiotics, first aid, oxygen, bandages, paracetamol, inhalers
// - Baby: milk powder (Lactogen, Nan, Anchor), Cerelac, baby diapers, formula, pampers
// - Elderly: adult diapers, wheelchairs, walking sticks, BP medicine, glucose strips
// - Food: rice, dhal, oil, food packets, biscuits, canned fish, noodles, vegetables
// - Water: drinking water, water bottles, purification tablets
// - Shelter: blankets, sleeping mats, tarpaulins, mattresses, mosquito nets
// - Hygiene: sanitary pads, soap, toothpaste, hygiene kits
// - Equipment: generators, flashlights, candles, solar lanterns, batteries
//
// VULNERABLE GROUPS MENTIONED:
// - Elderly: 100+ people across incidents
// - Infants/Babies: 30+ with specific age mentions (3 month, 6 month, newborns)
// - Pregnant Women: 20+ (with trimester details)
// - Disabled: 10+ persons
// - Medical Conditions: diabetics, heart patients, asthmatic, dialysis, hypertension
//
// LOCATIONS MENTIONED:
// - Schools: Ratnapura Central School, Kolonna Maha Vidyalaya, primary school
// - Hospitals: Ratnapura General Hospital, rural health center, clinic
// - Religious: Buddhist Temple (Maha Vihara), Hindu Kovil, St. Mary's Church, Mosque
// - Government: Divisional Secretariat, GN Office, Municipal Council, Pradeshiya Sabha
// - Other: tea estates, community halls, town halls
//
// This data will showcase the extraction system's capabilities!
