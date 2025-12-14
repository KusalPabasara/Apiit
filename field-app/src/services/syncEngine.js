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

import { getUnsyncedReports, markReportSynced, getUnsyncedEmergencies, markEmergencySynced, db } from '../db/database';

// Get API URL - Returns relative path /api which browser resolves with current protocol
// This prevents mixed content errors (HTTPS page will use HTTPS API)
const getApiUrl = () => {
  // In production (MODE=production), always use relative /api
  // Browser will resolve this using the current page's protocol
  if (import.meta.env.MODE === 'production') {
    return '/api';
  }
  // Development mode
  return import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
};

// Fetch with timeout helper
const fetchWithTimeout = async (url, options, timeout = 10000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
};

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

  // Subscribe to specific events (compatibility method)
  subscribe(event, callback) {
    const wrappedCallback = (eventName, data) => {
      if (eventName === event) {
        callback(data);
      }
    };
    this.listeners.add(wrappedCallback);
    return wrappedCallback; // Return for unsubscribe
  }

  // Unsubscribe from events
  unsubscribe(event, wrappedCallback) {
    this.listeners.delete(wrappedCallback);
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
    // Debug: Log the API URL being used
    const apiUrl = getApiUrl();
    console.log('🔗 API URL configured:', apiUrl);

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

    // Periodic sync check every 60 seconds when online (reduced frequency)
    setInterval(() => {
      if (navigator.onLine && !this.isSyncing) {
        this.syncAllSilent(); // Use silent version for periodic checks
      }
    }, 60000);

    // Initial sync check with delay - also check on page load/focus
    if (navigator.onLine) {
      setTimeout(() => this.syncAll(), 2000);
    }
    
    // Also sync when page loads/focuses if we're online (handles hard refresh after coming back online)
    window.addEventListener('load', () => {
      if (navigator.onLine) {
        console.log('📄 Page loaded - checking for unsynced reports');
        setTimeout(() => this.syncAll(), 1000);
      }
    });
    
    // Sync when window gets focus (user switches back to tab)
    window.addEventListener('focus', () => {
      if (navigator.onLine && !this.isSyncing) {
        console.log('👀 Window focused - checking for unsynced reports');
        this.syncAllSilent();
      }
    });
  }

  // Get unsynced items from a table
  async getUnsyncedItems(tableName) {
    try {
      return await db[tableName].where('synced').equals(0).toArray();
    } catch (error) {
      console.log(`📋 No unsynced ${tableName} or table empty`);
      return [];
    }
  }

  // Mark item as synced
  async markItemSynced(tableName, id) {
    try {
      const result = await db[tableName].update(id, { synced: 1 });
      if (result === 0) {
        console.warn(`⚠️ No record found to update in ${tableName} with id: ${id}`);
        return false;
      }
      return true;
    } catch (error) {
      console.error(`❌ Failed to mark ${tableName} as synced:`, error);
      return false;
    }
  }

  // Sync all pending reports (incidents, trapped civilians, blocked roads, supply requests)
  async syncAll(silent = false) {
    if (this.isSyncing) {
      if (!silent) console.log('⏳ Sync already in progress');
      return;
    }

    if (!navigator.onLine) {
      if (!silent) console.log('📴 Offline - skipping sync');
      return;
    }

    this.isSyncing = true;
    this.notify('syncStart', {});

    try {
      // Get all unsynced items from all tables
      const [unsyncedReports, unsyncedEmergencies, unsyncedTrapped, unsyncedBlocked, unsyncedSupply] = await Promise.all([
        getUnsyncedReports(),
        getUnsyncedEmergencies(),
        this.getUnsyncedItems('trappedCivilians'),
        this.getUnsyncedItems('blockedRoads'),
        this.getUnsyncedItems('supplyRequests')
      ]);
      
      const totalUnsynced = unsyncedReports.length + unsyncedEmergencies.length + 
                           unsyncedTrapped.length + unsyncedBlocked.length + unsyncedSupply.length;
      
      // Only log if there are items or not silent
      if (totalUnsynced > 0 || !silent) {
        console.log(`📤 Found ${totalUnsynced} unsynced items (${unsyncedReports.length} incidents, ${unsyncedEmergencies.length} SOS, ${unsyncedTrapped.length} trapped, ${unsyncedBlocked.length} blocked roads, ${unsyncedSupply.length} supply)`);
      }

      if (totalUnsynced === 0) {
        this.notify('syncComplete', { synced: 0 });
        this.isSyncing = false;
        return;
      }

      let syncedCount = 0;
      let failedCount = 0;

      // Sync incident reports
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

      // Sync SOS alerts (emergencies)
      // ✅ ATOMICITY: syncSOS marks as synced internally only after confirmed success
      for (const emergency of unsyncedEmergencies) {
        try {
          const success = await this.syncSOS(emergency);
          if (success) {
            syncedCount++;
          } else {
            failedCount++;
          }
        } catch (err) {
          console.error(`❌ Exception syncing SOS ${emergency.id.slice(0, 8)}:`, err);
          failedCount++;
        }
      }

      // Sync trapped civilians
      // ✅ ATOMICITY: syncTrappedCivilian marks as synced internally only after confirmed success
      for (const report of unsyncedTrapped) {
        try {
          const success = await this.syncTrappedCivilian(report);
          if (success) {
            syncedCount++;
          } else {
            failedCount++;
          }
        } catch (err) {
          console.error(`❌ Exception syncing trapped civilian ${report.id.slice(0, 8)}:`, err);
          failedCount++;
        }
      }

      // Sync blocked roads
      // ✅ ATOMICITY: syncBlockedRoad marks as synced internally only after confirmed success
      for (const report of unsyncedBlocked) {
        try {
          const success = await this.syncBlockedRoad(report);
          if (success) {
            syncedCount++;
          } else {
            failedCount++;
          }
        } catch (err) {
          console.error(`❌ Exception syncing blocked road ${report.id.slice(0, 8)}:`, err);
          failedCount++;
        }
      }

      // Sync supply requests
      // ✅ ATOMICITY: syncSupplyRequest marks as synced internally only after confirmed success
      for (const request of unsyncedSupply) {
        try {
          const success = await this.syncSupplyRequest(request);
          if (success) {
            syncedCount++;
          } else {
            failedCount++;
          }
        } catch (err) {
          console.error(`❌ Exception syncing supply request ${request.id.slice(0, 8)}:`, err);
          failedCount++;
        }
      }

      console.log(`✅ Sync complete: ${syncedCount} synced, ${failedCount} failed`);
      this.notify('syncComplete', { synced: syncedCount, failed: failedCount });
      
      // If there were failures, log details for debugging
      if (failedCount > 0) {
        console.warn(`⚠️ ${failedCount} items failed to sync. They will be retried on next sync.`);
      }

    } catch (err) {
      console.error('Sync engine error:', err);
      this.notify('syncError', { error: err.message });
    } finally {
      this.isSyncing = false;
    }
  }

  // Silent sync for periodic checks (no logging unless there's something to sync)
  async syncAllSilent() {
    return this.syncAll(true);
  }

  // Sync a single report (works with or without token - uses device ID)
  // ✅ ATOMICITY: Only marks as synced after confirmed server success
  // ✅ IDEMPOTENCY: Uses local_id to prevent duplicates
  // ✅ RETRY: Exponential backoff (1s, 2s, 4s)
  async syncReport(report) {
    const MAX_RETRIES = 3;
    const RETRY_DELAYS = [1000, 2000, 4000]; // Exponential backoff: 1s, 2s, 4s
    
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const headers = {
          'Content-Type': 'application/json'
        };
        
        // Add auth token if available
        if (this.token) {
          headers['Authorization'] = `Bearer ${this.token}`;
        }

        // Convert report format for backend API
        // Handle both single type (backward compatibility) and multiple types
        const types = report.types || (report.type ? [report.type] : []);
        const incidentTypes = types.map(t => t?.toLowerCase().replace(' ', '_'));
        
        const payload = {
          local_id: report.id, // ✅ IDEMPOTENCY KEY - same as report.id
          incident_type: incidentTypes[0], // First type for backward compatibility
          incident_types: incidentTypes, // Array of all types
          severity: report.severity,
          latitude: report.latitude,
          longitude: report.longitude,
          description: report.description || '',
          photo: report.photo || null,
          voice_note: report.voiceNote || null,
          created_at: report.createdAt,
          device_id: report.deviceId,
          responder_name: report.responderName || `Device-${report.deviceId?.slice(0, 8)}`,
          responder_email: report.responderEmail || null,
          responder_uid: report.responderUid || null
        };

        // Get API URL dynamically to ensure correct protocol (HTTPS)
        const apiUrl = getApiUrl();
        if (attempt === 0) {
          console.log(`🔗 Syncing incident ${report.id.slice(0, 8)} to: ${apiUrl}/incidents/device`);
        }
        
        const response = await fetchWithTimeout(`${apiUrl}/incidents/device`, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload)
        }, 15000); // 15 second timeout

        // ✅ ATOMICITY: Only mark as synced if we get successful response
        if (response.ok || response.status === 200) {
          const result = await response.json();
          
          // ✅ VERIFY: Ensure server actually returned a valid record
          if (result && (result.id || result.local_id)) {
            // ✅ ATOMIC UPDATE: Only mark as synced after confirmed success
            const updated = await markReportSynced(report.id);
            if (updated) {
              if (response.status === 200) {
                console.log(`🔄 Report ${report.id.slice(0, 8)} already exists on server (idempotent)`);
              } else {
                console.log(`✅ Report ${report.id.slice(0, 8)} synced (attempt ${attempt + 1})`);
              }
              return true;
            } else {
              console.error(`❌ Failed to mark report ${report.id.slice(0, 8)} as synced in IndexedDB`);
              // Don't return true - will retry on next sync
              throw new Error('Failed to update sync status');
            }
          } else {
            console.error(`❌ Server response invalid - missing record ID`);
            throw new Error('Invalid server response');
          }
        } else {
          const errorText = await response.text().catch(() => 'Unknown error');
          console.error(`❌ Server rejected report ${report.id.slice(0, 8)}: ${response.status} - ${errorText}`);
          throw new Error(`Server error: ${response.status}`);
        }
      } catch (err) {
        const isLastAttempt = attempt === MAX_RETRIES - 1;
        
        if (isLastAttempt) {
          console.error(`❌ Failed to sync report ${report.id.slice(0, 8)} after ${MAX_RETRIES} attempts:`, err.message || err);
          return false; // ✅ Don't mark as synced - will retry later
        }
        
        // ✅ EXPONENTIAL BACKOFF: Wait before retry
        const delay = RETRY_DELAYS[attempt] || 4000;
        console.log(`⏳ Retry ${attempt + 1}/${MAX_RETRIES} for report ${report.id.slice(0, 8)} in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    return false; // ✅ Never mark as synced if all retries fail
  }

  // Sync a trapped civilian report with atomicity and retry logic
  async syncTrappedCivilian(report) {
    const MAX_RETRIES = 3;
    const RETRY_DELAYS = [1000, 2000, 4000];
    
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const apiUrl = getApiUrl();
        const payload = {
          id: report.id, // ✅ IDEMPOTENCY KEY
          device_id: report.device_id,
          responder_name: report.responder_name,
          responder_email: report.responder_email,
          responder_uid: report.responder_uid,
          number_of_civilians: report.number_of_civilians,
          condition: report.condition,
          urgency: report.urgency,
          description: report.description,
          accessibility_notes: report.accessibility_notes,
          photos: report.photos,
          voice_note: report.voice_note,
          latitude: report.latitude,
          longitude: report.longitude,
          created_at: report.created_at
        };
        
        if (attempt === 0) {
          console.log(`🔄 Syncing trapped civilian ${report.id.slice(0, 8)} to ${apiUrl}/trapped-civilians`);
        }
        
        const response = await fetchWithTimeout(`${apiUrl}/trapped-civilians`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }, 15000);

        if (response.ok || response.status === 200) {
          const result = await response.json();
          if (result && result.id) {
            // ✅ ATOMIC UPDATE: Only mark as synced after confirmed success
            const updated = await this.markItemSynced('trappedCivilians', report.id);
            if (updated) {
              if (response.status === 200) {
                console.log(`🔄 Trapped civilian ${report.id.slice(0, 8)} already exists on server (idempotent)`);
              } else {
                console.log(`✅ Trapped civilian ${report.id.slice(0, 8)} synced (attempt ${attempt + 1})`);
              }
              return true;
            } else {
              console.error(`❌ Failed to mark trapped civilian ${report.id.slice(0, 8)} as synced in IndexedDB`);
              throw new Error('Failed to update sync status');
            }
          }
          throw new Error('Invalid server response');
        } else {
          throw new Error(`Server error: ${response.status}`);
        }
      } catch (err) {
        if (attempt === MAX_RETRIES - 1) {
          console.error(`❌ Failed to sync trapped civilian ${report.id.slice(0, 8)} after ${MAX_RETRIES} attempts:`, err.message || err);
          return false;
        }
        const delay = RETRY_DELAYS[attempt] || 4000;
        console.log(`⏳ Retry ${attempt + 1}/${MAX_RETRIES} for trapped civilian ${report.id.slice(0, 8)} in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    return false;
  }

  // Sync a blocked road report with atomicity and retry logic
  async syncBlockedRoad(report) {
    const MAX_RETRIES = 3;
    const RETRY_DELAYS = [1000, 2000, 4000];
    
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const apiUrl = getApiUrl();
        const payload = {
          id: report.id, // ✅ IDEMPOTENCY KEY
          device_id: report.device_id,
          responder_name: report.responder_name,
          responder_email: report.responder_email,
          responder_uid: report.responder_uid,
          start_lat: report.start_lat,
          start_lng: report.start_lng,
          end_lat: report.end_lat,
          end_lng: report.end_lng,
          obstruction_type: report.obstruction_type,
          severity: report.severity,
          affected_length: report.affected_length,
          clearance_estimate: report.clearance_estimate,
          description: report.description,
          photos: report.photos,
          created_at: report.created_at
        };
        
        if (attempt === 0) {
          console.log(`🔄 Syncing blocked road ${report.id.slice(0, 8)} to ${apiUrl}/blocked-roads`);
        }
        
        const response = await fetchWithTimeout(`${apiUrl}/blocked-roads`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }, 15000);

        if (response.ok || response.status === 200) {
          const result = await response.json();
          if (result && result.id) {
            // ✅ ATOMIC UPDATE: Only mark as synced after confirmed success
            const updated = await this.markItemSynced('blockedRoads', report.id);
            if (updated) {
              if (response.status === 200) {
                console.log(`🔄 Blocked road ${report.id.slice(0, 8)} already exists on server (idempotent)`);
              } else {
                console.log(`✅ Blocked road ${report.id.slice(0, 8)} synced (attempt ${attempt + 1})`);
              }
              return true;
            } else {
              console.error(`❌ Failed to mark blocked road ${report.id.slice(0, 8)} as synced in IndexedDB`);
              throw new Error('Failed to update sync status');
            }
          }
          throw new Error('Invalid server response');
        } else {
          throw new Error(`Server error: ${response.status}`);
        }
      } catch (err) {
        if (attempt === MAX_RETRIES - 1) {
          console.error(`❌ Failed to sync blocked road ${report.id.slice(0, 8)} after ${MAX_RETRIES} attempts:`, err.message || err);
          return false;
        }
        const delay = RETRY_DELAYS[attempt] || 4000;
        console.log(`⏳ Retry ${attempt + 1}/${MAX_RETRIES} for blocked road ${report.id.slice(0, 8)} in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    return false;
  }

  // Sync a SOS alert with atomicity and retry logic
  async syncSOS(emergency) {
    const MAX_RETRIES = 3;
    const RETRY_DELAYS = [1000, 2000, 4000];
    
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const apiUrl = getApiUrl();
        const payload = {
          id: emergency.id, // ✅ IDEMPOTENCY KEY
          local_id: emergency.id,
          device_id: emergency.deviceId || emergency.device_id,
          responder_name: emergency.responder_name || 'Unknown',
          responder_email: emergency.responder_email || null,
          responder_uid: emergency.responder_uid || null,
          latitude: emergency.latitude,
          longitude: emergency.longitude,
          timestamp: emergency.timestamp
        };
        
        if (attempt === 0) {
          console.log(`🆘 Syncing SOS ${emergency.id.slice(0, 8)} to ${apiUrl}/sos`);
        }
        
        const response = await fetchWithTimeout(`${apiUrl}/sos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }, 15000);

        if (response.ok || response.status === 200) {
          const result = await response.json();
          if (result && result.id) {
            // ✅ ATOMIC UPDATE: Only mark as synced after confirmed success
            const updated = await markEmergencySynced(emergency.id);
            if (updated) {
              if (response.status === 200) {
                console.log(`🔄 SOS ${emergency.id.slice(0, 8)} already exists on server (idempotent)`);
              } else {
                console.log(`✅ SOS ${emergency.id.slice(0, 8)} synced (attempt ${attempt + 1})`);
              }
              return true;
            } else {
              console.error(`❌ Failed to mark SOS ${emergency.id.slice(0, 8)} as synced in IndexedDB`);
              throw new Error('Failed to update sync status');
            }
          }
          throw new Error('Invalid server response');
        } else {
          throw new Error(`Server error: ${response.status}`);
        }
      } catch (err) {
        if (attempt === MAX_RETRIES - 1) {
          console.error(`❌ Failed to sync SOS ${emergency.id.slice(0, 8)} after ${MAX_RETRIES} attempts:`, err.message || err);
          return false;
        }
        const delay = RETRY_DELAYS[attempt] || 4000;
        console.log(`⏳ Retry ${attempt + 1}/${MAX_RETRIES} for SOS ${emergency.id.slice(0, 8)} in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    return false;
  }

  // Sync a supply request with atomicity and retry logic
  async syncSupplyRequest(request) {
    const MAX_RETRIES = 3;
    const RETRY_DELAYS = [1000, 2000, 4000];
    
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const apiUrl = getApiUrl();
        const payload = {
          id: request.id, // ✅ IDEMPOTENCY KEY
          device_id: request.device_id,
          responder_name: request.responder_name,
          responder_email: request.responder_email,
          responder_uid: request.responder_uid,
          priority: request.priority,
          supplies: request.supplies,
          recipients: request.recipients,
          notes: request.notes,
          photos: request.photos,
          latitude: request.latitude,
          longitude: request.longitude,
          created_at: request.created_at
        };
        
        if (attempt === 0) {
          console.log(`🔄 Syncing supply request ${request.id.slice(0, 8)} to ${apiUrl}/supply-requests`);
        }
        
        const response = await fetchWithTimeout(`${apiUrl}/supply-requests`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }, 15000);

        if (response.ok || response.status === 200) {
          const result = await response.json();
          if (result && result.id) {
            // ✅ ATOMIC UPDATE: Only mark as synced after confirmed success
            const updated = await this.markItemSynced('supplyRequests', request.id);
            if (updated) {
              if (response.status === 200) {
                console.log(`🔄 Supply request ${request.id.slice(0, 8)} already exists on server (idempotent)`);
              } else {
                console.log(`✅ Supply request ${request.id.slice(0, 8)} synced (attempt ${attempt + 1})`);
              }
              return true;
            } else {
              console.error(`❌ Failed to mark supply request ${request.id.slice(0, 8)} as synced in IndexedDB`);
              throw new Error('Failed to update sync status');
            }
          }
          throw new Error('Invalid server response');
        } else {
          throw new Error(`Server error: ${response.status}`);
        }
      } catch (err) {
        if (attempt === MAX_RETRIES - 1) {
          console.error(`❌ Failed to sync supply request ${request.id.slice(0, 8)} after ${MAX_RETRIES} attempts:`, err.message || err);
          return false;
        }
        const delay = RETRY_DELAYS[attempt] || 4000;
        console.log(`⏳ Retry ${attempt + 1}/${MAX_RETRIES} for supply request ${request.id.slice(0, 8)} in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    return false;
  }

  // Get sync status
  async getStatus() {
    const [unsyncedReports, unsyncedEmergencies, unsyncedTrapped, unsyncedBlocked, unsyncedSupply] = await Promise.all([
      getUnsyncedReports(),
      getUnsyncedEmergencies(),
      this.getUnsyncedItems('trappedCivilians'),
      this.getUnsyncedItems('blockedRoads'),
      this.getUnsyncedItems('supplyRequests')
    ]);
    
    const totalPending = unsyncedReports.length + unsyncedEmergencies.length + 
                        unsyncedTrapped.length + unsyncedBlocked.length + unsyncedSupply.length;
    
    return {
      pendingCount: totalPending,
      isOnline: navigator.onLine,
      isSyncing: this.isSyncing
    };
  }
}

// Singleton instance
export const syncEngine = new SyncEngine();
export default syncEngine;
