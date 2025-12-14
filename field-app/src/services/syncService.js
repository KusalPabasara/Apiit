import db from '../db/database';
import { incidentsAPI } from './api';

class SyncService {
  constructor() {
    this.isSyncing = false;
    this.listeners = new Set();
  }

  // Subscribe to sync events
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Notify all listeners
  notify(event) {
    this.listeners.forEach(callback => callback(event));
  }

  // Check if online
  isOnline() {
    return navigator.onLine;
  }

  // Get pending incidents count
  async getPendingCount() {
    return await db.incidents.where('synced').equals(0).count();
  }

  // Get all pending incidents
  async getPendingIncidents() {
    return await db.incidents.where('synced').equals(0).toArray();
  }

  // Save incident locally
  async saveIncident(incident) {
    const localId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const record = {
      local_id: localId,
      incident_type: incident.incident_type,
      severity: incident.severity,
      latitude: incident.latitude,
      longitude: incident.longitude,
      description: incident.description || '',
      photo: incident.photo || null,
      created_at: new Date().toISOString(),
      synced: 0
    };

    const id = await db.incidents.add(record);
    this.notify({ type: 'incident_saved', incident: { ...record, id } });
    
    // Try to sync immediately if online
    if (this.isOnline()) {
      this.syncAll();
    }

    return { ...record, id };
  }

  // Sync all pending incidents
  async syncAll() {
    if (this.isSyncing || !this.isOnline()) {
      return { success: false, reason: this.isSyncing ? 'already_syncing' : 'offline' };
    }

    this.isSyncing = true;
    this.notify({ type: 'sync_started' });

    try {
      const pending = await this.getPendingIncidents();
      
      if (pending.length === 0) {
        this.isSyncing = false;
        this.notify({ type: 'sync_complete', synced: 0 });
        return { success: true, synced: 0 };
      }

      // Prepare incidents for sync
      const incidentsToSync = pending.map(inc => ({
        local_id: inc.local_id,
        incident_type: inc.incident_type,
        severity: inc.severity,
        latitude: inc.latitude,
        longitude: inc.longitude,
        description: inc.description,
        photo: inc.photo,
        created_at: inc.created_at
      }));

      // Send to server
      const result = await incidentsAPI.sync(incidentsToSync);

      // Mark as synced in local DB
      await db.transaction('rw', db.incidents, async () => {
        for (const inc of pending) {
          await db.incidents.update(inc.id, { synced: 1 });
        }
      });

      this.isSyncing = false;
      this.notify({ type: 'sync_complete', synced: result.synced });
      
      return { success: true, synced: result.synced };
    } catch (error) {
      console.error('Sync failed:', error);
      this.isSyncing = false;
      this.notify({ type: 'sync_error', error: error.message });
      return { success: false, error: error.message };
    }
  }

  // Initialize sync listeners
  init() {
    // Listen for online event
    window.addEventListener('online', () => {
      console.log('🌐 Back online - initiating sync...');
      this.notify({ type: 'online' });
      setTimeout(() => this.syncAll(), 1000); // Small delay to ensure connection is stable
    });

    window.addEventListener('offline', () => {
      console.log('📴 Gone offline');
      this.notify({ type: 'offline' });
    });

    // Initial sync if online
    if (this.isOnline()) {
      setTimeout(() => this.syncAll(), 2000);
    }
  }
}

export const syncService = new SyncService();
export default syncService;
