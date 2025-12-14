// Mock incident data for demonstration
export const mockIncidents = [
  // Critical Landslides (Recent)
  {
    id: '1',
    incident_type: 'landslide',
    severity: 1,
    latitude: 6.6828,
    longitude: 80.3992,
    description: 'Major landslide blocking main highway A4. Multiple vehicles trapped.',
    responder_name: 'Team Alpha',
    responder_id: 'resp_001',
    created_at: new Date(Date.now() - 30 * 60000).toISOString(), // 30 minutes ago
    resolved_at: null,
    photo: null
  },
  {
    id: '2',
    incident_type: 'landslide',
    severity: 1,
    latitude: 6.7123,
    longitude: 80.4156,
    description: 'Critical landslide in residential area. 15 families evacuated.',
    responder_name: 'Team Bravo',
    responder_id: 'resp_002',
    created_at: new Date(Date.now() - 45 * 60000).toISOString(), // 45 min ago
    resolved_at: null,
    photo: null
  },
  {
    id: '3',
    incident_type: 'landslide',
    severity: 2,
    latitude: 6.6456,
    longitude: 80.3678,
    description: 'Landslide near tea plantation. Road partially blocked.',
    responder_name: 'Team Charlie',
    responder_id: 'resp_003',
    created_at: new Date(Date.now() - 90 * 60000).toISOString(), // 1.5 hours ago
    resolved_at: null,
    photo: null
  },

  // Floods (High Priority)
  {
    id: '4',
    incident_type: 'flood',
    severity: 1,
    latitude: 6.6234,
    longitude: 80.4567,
    description: 'Severe flooding in low-lying areas. Water level rising rapidly.',
    responder_name: 'Team Delta',
    responder_id: 'resp_004',
    created_at: new Date(Date.now() - 2 * 3600000).toISOString(), // 2 hours ago
    resolved_at: null,
    photo: null
  },
  {
    id: '5',
    incident_type: 'flood',
    severity: 2,
    latitude: 6.7456,
    longitude: 80.3234,
    description: 'River overflowing near residential area. 20 families at risk.',
    responder_name: 'Team Echo',
    responder_id: 'resp_005',
    created_at: new Date(Date.now() - 3 * 3600000).toISOString(), // 3 hours ago
    resolved_at: null,
    photo: null
  },
  {
    id: '6',
    incident_type: 'flood',
    severity: 2,
    latitude: 6.6789,
    longitude: 80.4890,
    description: 'Flash flood reported near school. Students evacuated safely.',
    responder_name: 'Team Alpha',
    responder_id: 'resp_001',
    created_at: new Date(Date.now() - 4 * 3600000).toISOString(), // 4 hours ago
    resolved_at: new Date(Date.now() - 1 * 3600000).toISOString(), // Resolved 1 hour ago
    photo: null
  },

  // Road Blocks (Medium Priority)
  {
    id: '7',
    incident_type: 'road_block',
    severity: 2,
    latitude: 6.7234,
    longitude: 80.3567,
    description: 'Fallen tree blocking main access road to village.',
    responder_name: 'Team Bravo',
    responder_id: 'resp_002',
    created_at: new Date(Date.now() - 5 * 3600000).toISOString(), // 5 hours ago
    resolved_at: null,
    photo: null
  },
  {
    id: '8',
    incident_type: 'road_block',
    severity: 3,
    latitude: 6.6567,
    longitude: 80.4123,
    description: 'Debris on road causing traffic congestion.',
    responder_name: 'Team Charlie',
    responder_id: 'resp_003',
    created_at: new Date(Date.now() - 6 * 3600000).toISOString(), // 6 hours ago
    resolved_at: new Date(Date.now() - 2 * 3600000).toISOString(), // Resolved 2 hours ago
    photo: null
  },
  {
    id: '9',
    incident_type: 'road_block',
    severity: 3,
    latitude: 6.7012,
    longitude: 80.3890,
    description: 'Rock fall on mountain road. Single lane open.',
    responder_name: 'Team Delta',
    responder_id: 'resp_004',
    created_at: new Date(Date.now() - 7 * 3600000).toISOString(), // 7 hours ago
    resolved_at: null,
    photo: null
  },

  // Power Lines (Various)
  {
    id: '10',
    incident_type: 'power_line_down',
    severity: 2,
    latitude: 6.6890,
    longitude: 80.4234,
    description: 'Power lines down affecting 500+ households.',
    responder_name: 'Team Echo',
    responder_id: 'resp_005',
    created_at: new Date(Date.now() - 8 * 3600000).toISOString(), // 8 hours ago
    resolved_at: null,
    photo: null
  },
  {
    id: '11',
    incident_type: 'power_line_down',
    severity: 3,
    latitude: 6.7345,
    longitude: 80.3678,
    description: 'Damaged power pole due to strong winds.',
    responder_name: 'Team Alpha',
    responder_id: 'resp_001',
    created_at: new Date(Date.now() - 10 * 3600000).toISOString(), // 10 hours ago
    resolved_at: new Date(Date.now() - 3 * 3600000).toISOString(), // Resolved 3 hours ago
    photo: null
  },

  // Additional incidents for better visualization
  {
    id: '12',
    incident_type: 'landslide',
    severity: 3,
    latitude: 6.7567,
    longitude: 80.3456,
    description: 'Minor landslide on hiking trail. Trail closed.',
    responder_name: 'Team Bravo',
    responder_id: 'resp_002',
    created_at: new Date(Date.now() - 12 * 3600000).toISOString(), // 12 hours ago
    resolved_at: new Date(Date.now() - 5 * 3600000).toISOString(),
    photo: null
  },
  {
    id: '13',
    incident_type: 'flood',
    severity: 3,
    latitude: 6.6345,
    longitude: 80.4678,
    description: 'Water logging in agricultural area.',
    responder_name: 'Team Charlie',
    responder_id: 'resp_003',
    created_at: new Date(Date.now() - 14 * 3600000).toISOString(), // 14 hours ago
    resolved_at: null,
    photo: null
  },
  {
    id: '14',
    incident_type: 'landslide',
    severity: 4,
    latitude: 6.7678,
    longitude: 80.3234,
    description: 'Small soil erosion reported. Under monitoring.',
    responder_name: 'Team Delta',
    responder_id: 'resp_004',
    created_at: new Date(Date.now() - 16 * 3600000).toISOString(), // 16 hours ago
    resolved_at: new Date(Date.now() - 8 * 3600000).toISOString(),
    photo: null
  },
  {
    id: '15',
    incident_type: 'road_block',
    severity: 4,
    latitude: 6.6678,
    longitude: 80.3789,
    description: 'Minor roadwork causing slight delay.',
    responder_name: 'Team Echo',
    responder_id: 'resp_005',
    created_at: new Date(Date.now() - 18 * 3600000).toISOString(), // 18 hours ago
    resolved_at: new Date(Date.now() - 10 * 3600000).toISOString(),
    photo: null
  },
  {
    id: '16',
    incident_type: 'flood',
    severity: 4,
    latitude: 6.7234,
    longitude: 80.4012,
    description: 'Minor water accumulation in parking area.',
    responder_name: 'Team Alpha',
    responder_id: 'resp_001',
    created_at: new Date(Date.now() - 20 * 3600000).toISOString(), // 20 hours ago
    resolved_at: new Date(Date.now() - 12 * 3600000).toISOString(),
    photo: null
  },
  {
    id: '17',
    incident_type: 'power_line_down',
    severity: 4,
    latitude: 6.6912,
    longitude: 80.3567,
    description: 'Street light malfunction reported.',
    responder_name: 'Team Bravo',
    responder_id: 'resp_002',
    created_at: new Date(Date.now() - 22 * 3600000).toISOString(), // 22 hours ago
    resolved_at: new Date(Date.now() - 15 * 3600000).toISOString(),
    photo: null
  },

  // Recent activity (for trend visualization)
  {
    id: '18',
    incident_type: 'landslide',
    severity: 2,
    latitude: 6.7123,
    longitude: 80.3890,
    description: 'Landslide warning issued for hillside community.',
    responder_name: 'Team Charlie',
    responder_id: 'resp_003',
    created_at: new Date(Date.now() - 15 * 60000).toISOString(), // 15 minutes ago
    resolved_at: null,
    photo: null
  },
  {
    id: '19',
    incident_type: 'flood',
    severity: 3,
    latitude: 6.6456,
    longitude: 80.4234,
    description: 'Stream water level rising. Monitoring situation.',
    responder_name: 'Team Delta',
    responder_id: 'resp_004',
    created_at: new Date(Date.now() - 20 * 60000).toISOString(), // 20 minutes ago
    resolved_at: null,
    photo: null
  },
  {
    id: '20',
    incident_type: 'road_block',
    severity: 3,
    latitude: 6.7456,
    longitude: 80.3678,
    description: 'Vehicle breakdown blocking narrow road.',
    responder_name: 'Team Echo',
    responder_id: 'resp_005',
    created_at: new Date(Date.now() - 25 * 60000).toISOString(), // 25 minutes ago
    resolved_at: null,
    photo: null
  }
];

// Summary of mock data:
// - Total: 20 incidents
// - Critical (Severity 1): 3 incidents
// - High (Severity 2): 6 incidents  
// - Medium (Severity 3): 7 incidents
// - Low (Severity 4): 4 incidents
// 
// By Type:
// - Landslides: 7 incidents (35%)
// - Floods: 6 incidents (30%)
// - Road Blocks: 4 incidents (20%)
// - Power Lines: 3 incidents (15%)
//
// Status:
// - Active: 13 incidents
// - Resolved: 7 incidents
//
// Responders: 5 teams (Alpha, Bravo, Charlie, Delta, Echo)
//
// Recent Activity (Last hour): 5 incidents
// Last 6 hours: Increasing trend

