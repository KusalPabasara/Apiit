/**
 * SYNC ENGINE - Auto-sync offline data when connectivity returns
 * 
 * Hackathon Requirement:
 * "The app must automatically detect when network connectivity returns.
 * Upon reconnection, it must upload all locally stored reports to the 
 * central server without user intervention."
 * 
 * Uses Device UUID for identification (no auth token required)
 */

import { getUnsyncedReports, markReportSynced } from '../db/database';

// Auto-detect API URL based on environment
const getApiUrl = () => {
  // If env variable is set, use it
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  // In production, use the same host as the app
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    return `http://${window.location.hostname}:3001/api`;
  }
  // Default to localhost for development
  return 'http://localhost:3001/api';
};

const API_URL = getApiUrl();

class SyncEngine {
  constructor() {
    this.isSyncing = false;
    this.isInitialized = false;
    this.listeners = new Set();
    this.token = null;
    this.deviceId = null;
    this.retryTimeout = null;
    this.retryAttempts = 0;
    this.maxRetries = 3;
  }

  // Set auth token (optional - for authenticated sync)
  setToken(token) {
    this.token = token;
  }

  // Set device ID (for device-based sync)
  setDeviceId(deviceId) {
    this.deviceId = deviceId;
  }

  // Add listener for sync events
  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Notify all listeners
  notify(event, data) {
    this.listeners.forEach(callback => callback(event, data));
  }

  // Initialize sync engine - listen for connectivity changes
  init() {
    // Prevent double initialization
    if (this.isInitialized) {
      console.log('🔄 Sync Engine already initialized, skipping');
      return;
    }
    
    this.isInitialized = true;
    console.log('🔄 Sync Engine initialized');

    // Listen for online event
    window.addEventListener('online', () => {
      console.log('📶 Network restored - triggering sync');
      this.notify('online', {});
      this.retryAttempts = 0; // Reset retry counter
      // Small delay to ensure connection is stable
      setTimeout(() => this.syncAll(), 1000);
    });

    // Listen for offline event
    window.addEventListener('offline', () => {
      console.log('📴 Network lost');
      this.notify('offline', {});
      // Clear any pending retry
      if (this.retryTimeout) {
        clearTimeout(this.retryTimeout);
        this.retryTimeout = null;
      }
    });

    // Sync on visibility change (when app comes to foreground)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        console.log('👁️ App visible - checking for pending syncs');
        this.syncAll();
      }
    });

    // Periodic sync check every 30 seconds when online
    setInterval(() => {
      if (navigator.onLine && !this.isSyncing) {
        this.syncAll();
      }
    }, 30000);

    // Initial sync check with delay
    if (navigator.onLine) {
      setTimeout(() => this.syncAll(), 2000);
    }
  }

  // Sync all pending reports
  async syncAll() {
    if (this.isSyncing) {
      console.log('⏳ Sync already in progress');
      return;
    }

    if (!navigator.onLine) {
      console.log('📴 Offline - skipping sync');
      return;
    }

    this.isSyncing = true;
    this.notify('syncStart', {});

    try {
      const unsyncedReports = await getUnsyncedReports();
      console.log(`📤 Found ${unsyncedReports.length} unsynced reports`);

      if (unsyncedReports.length === 0) {
        this.notify('syncComplete', { synced: 0 });
        this.isSyncing = false;
        return;
      }

      let syncedCount = 0;
      let failedCount = 0;

      for (const report of unsyncedReports) {
        try {
          const success = await this.syncReport(report);
          if (success) {
            syncedCount++;
            this.notify('reportSynced', { report });
          } else {
            failedCount++;
          }
        } catch (err) {
          console.error('Failed to sync report:', report.id, err);
          failedCount++;
        }
      }

      console.log(`✅ Sync complete: ${syncedCount} synced, ${failedCount} failed`);
      this.notify('syncComplete', { synced: syncedCount, failed: failedCount });

    } catch (err) {
      console.error('Sync engine error:', err);
      this.notify('syncError', { error: err.message });
    } finally {
      this.isSyncing = false;
    }
  }

  // Sync a single report (works with or without token - uses device ID)
  async syncReport(report) {
    try {
      const headers = {
        'Content-Type': 'application/json'
      };
      
      // Add auth token if available
      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
      }

      // Convert report format for backend API
      const payload = {
        local_id: report.id,
        incident_type: report.type?.toLowerCase().replace(' ', '_'),
        severity: report.severity,
        latitude: report.latitude,
        longitude: report.longitude,
        description: report.description || '',
        photo: report.photo || null,
        created_at: report.createdAt,
        device_id: report.deviceId,
        responder_name: report.responderName || `Device-${report.deviceId?.slice(0, 8)}`
      };

      const response = await fetch(`${API_URL}/incidents/device`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        await markReportSynced(report.id);
        console.log(`✅ Report ${report.id.slice(0, 8)} synced`);
        return true;
      } else {
        console.error(`❌ Server rejected report: ${response.status}`);
        return false;
      }
    } catch (err) {
      console.error('Network error syncing report:', err);
      return false;
    }
  }

  // Get sync status
  async getStatus() {
    const unsynced = await getUnsyncedReports();
    return {
      pendingCount: unsynced.length,
      isOnline: navigator.onLine,
      isSyncing: this.isSyncing
    };
  }
}

// Singleton instance
export const syncEngine = new SyncEngine();
export default syncEngine;
