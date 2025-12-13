import Dexie from 'dexie';

// Create the database
export const db = new Dexie('AegisFieldDB');

// Define schema - v3 with sync status as number (0=unsynced, 1=synced)
// Note: Dexie doesn't index booleans well, so we use 0/1 for synced status
db.version(3).stores({
  // Disaster reports - stored locally until synced
  // syncStatus: 0 = pending, 1 = synced
  reports: 'id, localId, type, severity, latitude, longitude, timestamp, syncStatus, deviceId',
  
  // Emergency SOS - stored locally until synced
  emergencies: 'id, localId, latitude, longitude, timestamp, syncStatus, status, deviceId',
  
  // Sync queue - tracks what needs to be synced
  syncQueue: '++id, reportId, type, status, attempts, lastAttempt',
  
  // Cached map tiles for offline
  mapTiles: 'url, data, timestamp',
  
  // User settings
  settings: 'key, value'
});

// Incident types
export const INCIDENT_TYPES = [
  { value: 'FLOOD', label: 'Flood', icon: '🌊', color: '#0369a1' },
  { value: 'LANDSLIDE', label: 'Landslide', icon: '⛰️', color: '#b45309' },
  { value: 'ROAD_BLOCK', label: 'Road Block', icon: '🚧', color: '#dc2626' },
  { value: 'POWER_LINE', label: 'Power Line Down', icon: '⚡', color: '#7c3aed' },
  { value: 'BUILDING_COLLAPSE', label: 'Building Collapse', icon: '🏚️', color: '#1f2937' },
  { value: 'FIRE', label: 'Fire', icon: '🔥', color: '#ea580c' },
  { value: 'OTHER', label: 'Other', icon: '⚠️', color: '#6b7280' }
];

// Severity levels
export const SEVERITY_LEVELS = [
  { value: 1, label: 'Critical', color: '#dc2626', description: 'Immediate danger - requires rescue' },
  { value: 2, label: 'High', color: '#f97316', description: 'Urgent attention needed' },
  { value: 3, label: 'Medium', color: '#eab308', description: 'Important but stable' },
  { value: 4, label: 'Low', color: '#22c55e', description: 'Minor issue - monitoring' },
  { value: 5, label: 'Minimal', color: '#6b7280', description: 'Information only' }
];

// Helper to get unsynced reports (syncStatus = 0)
export const getUnsyncedReports = async () => {
  try {
    return await db.reports.where('syncStatus').equals(0).toArray();
  } catch (error) {
    console.log('📋 No unsynced reports or table empty');
    return [];
  }
};

// Helper to get unsynced emergencies (syncStatus = 0)
export const getUnsyncedEmergencies = async () => {
  try {
    return await db.emergencies.where('syncStatus').equals(0).toArray();
  } catch (error) {
    console.log('📋 No unsynced emergencies or table empty');
    return [];
  }
};

// Helper to mark as synced (syncStatus = 1)
export const markReportSynced = async (id) => {
  return await db.reports.update(id, { syncStatus: 1 });
};

export const markEmergencySynced = async (id) => {
  return await db.emergencies.update(id, { syncStatus: 1 });
};

export default db;
