/**
 * LOCATION SERVICE - Smart GPS location with persistent caching
 * 
 * Features:
 * - Caches last known good location to IndexedDB (survives app kills)
 * - Uses cached location if available and recent (within 10 seconds)
 * - Attempts fresh GPS when online/offline
 * - Falls back to cached location if GPS fails
 * - Updates cache whenever new location is obtained
 */

import { db } from '../db/database';

const CACHE_KEY = 'last_known_location';
const CACHE_VALIDITY_MS = 10000; // 10 seconds - use cached if within this time
const GPS_TIMEOUT_FAST = 3000; // 3 seconds for quick response
const GPS_TIMEOUT_NORMAL = 8000; // 8 seconds for normal attempts
const GPS_MAX_AGE = 600000; // 10 minutes - accept cached GPS positions

// Default location for Ratnapura District
const RATNAPURA_DEFAULT = {
  latitude: 6.6828,
  longitude: 80.3992,
  accuracy: 1000,
  timestamp: Date.now(),
  isDefault: true,
  source: 'default'
};

/**
 * Save location to IndexedDB cache
 */
async function saveLocationToCache(location) {
  try {
    const cacheEntry = {
      id: CACHE_KEY,
      latitude: location.latitude,
      longitude: location.longitude,
      accuracy: location.accuracy || 1000,
      timestamp: location.timestamp || Date.now()
    };
    
    await db.locationCache.put(cacheEntry);
    console.log('💾 Location cached to IndexedDB:', {
      lat: location.latitude.toFixed(6),
      lng: location.longitude.toFixed(6),
      age: 'fresh'
    });
  } catch (error) {
    console.error('❌ Failed to cache location:', error);
  }
}

/**
 * Get cached location from IndexedDB
 */
async function getCachedLocation() {
  try {
    const cached = await db.locationCache.get(CACHE_KEY);
    if (cached) {
      const age = Date.now() - cached.timestamp;
      return {
        ...cached,
        age,
        isCached: true,
        source: 'cache'
      };
    }
  } catch (error) {
    console.log('📋 No cached location found');
  }
  return null;
}

/**
 * Check if cached location is still valid (within 10 seconds)
 */
function isCacheValid(cachedLocation) {
  if (!cachedLocation) return false;
  const age = Date.now() - cachedLocation.timestamp;
  return age <= CACHE_VALIDITY_MS;
}

/**
 * Get current location with smart caching
 * Priority:
 * 1. Try fresh GPS (quick timeout)
 * 2. Use cached location if valid (within 10 seconds)
 * 3. Try GPS with longer timeout (for offline sensors)
 * 4. Use cached location even if old
 * 5. Fall back to default
 */
export async function getCurrentLocation(options = {}) {
  const {
    useCache = true,
    fastMode = true,
    allowOfflineGPS = true
  } = options;

  // Step 1: Get cached location if available
  let cachedLocation = null;
  if (useCache) {
    cachedLocation = await getCachedLocation();
    
    // If cache is very recent (within 10 seconds), use it immediately
    if (isCacheValid(cachedLocation)) {
      console.log('✅ Using cached location (fresh):', {
        lat: cachedLocation.latitude.toFixed(6),
        lng: cachedLocation.longitude.toFixed(6),
        age: `${Math.round((Date.now() - cachedLocation.timestamp) / 1000)}s`
      });
      return {
        latitude: cachedLocation.latitude,
        longitude: cachedLocation.longitude,
        accuracy: cachedLocation.accuracy,
        timestamp: cachedLocation.timestamp,
        isDefault: false,
        source: 'cache_fresh'
      };
    }
  }

  // Step 2: Check if geolocation is available
  if (!navigator.geolocation) {
    console.warn('⚠️ Geolocation not supported');
    if (cachedLocation) {
      console.log('📍 Using cached location (GPS not supported)');
      return {
        latitude: cachedLocation.latitude,
        longitude: cachedLocation.longitude,
        accuracy: cachedLocation.accuracy,
        timestamp: cachedLocation.timestamp,
        isDefault: false,
        source: 'cache_fallback'
      };
    }
    return RATNAPURA_DEFAULT;
  }

  // Step 3: Try to get fresh GPS location (fast mode - 3 seconds)
  if (fastMode) {
    try {
      const freshLocation = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('GPS timeout (fast mode)'));
        }, GPS_TIMEOUT_FAST);

        navigator.geolocation.getCurrentPosition(
          (position) => {
            clearTimeout(timeout);
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy || 100,
              timestamp: position.timestamp || Date.now(),
              isDefault: false,
              source: 'gps_fresh'
            });
          },
          (err) => {
            clearTimeout(timeout);
            reject(err);
          },
          {
            enableHighAccuracy: false, // Faster, works offline
            timeout: GPS_TIMEOUT_FAST,
            maximumAge: GPS_MAX_AGE // Accept cached GPS positions
          }
        );
      });

      // Save to cache
      await saveLocationToCache(freshLocation);
      
      console.log('✅ GPS location obtained (fast):', {
        lat: freshLocation.latitude.toFixed(6),
        lng: freshLocation.longitude.toFixed(6),
        accuracy: `${Math.round(freshLocation.accuracy)}m`
      });
      
      return freshLocation;
    } catch (fastError) {
      console.log('⏱️ Fast GPS timeout, trying alternatives...');
    }
  }

  // Step 4: If we have a cached location (even if old), use it while trying GPS
  if (cachedLocation) {
    console.log('📍 Using cached location while attempting fresh GPS:', {
      lat: cachedLocation.latitude.toFixed(6),
      lng: cachedLocation.longitude.toFixed(6),
      age: `${Math.round((Date.now() - cachedLocation.timestamp) / 1000)}s`
    });
    
    // Try to get fresh GPS in background (don't wait)
    if (allowOfflineGPS) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const freshLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy || 100,
            timestamp: position.timestamp || Date.now(),
            isDefault: false,
            source: 'gps_background'
          };
          await saveLocationToCache(freshLocation);
          console.log('✅ Background GPS update successful');
        },
        () => {
          // Silently fail - we already have cached location
        },
        {
          enableHighAccuracy: false,
          timeout: GPS_TIMEOUT_NORMAL,
          maximumAge: GPS_MAX_AGE
        }
      );
    }
    
    return {
      latitude: cachedLocation.latitude,
      longitude: cachedLocation.longitude,
      accuracy: cachedLocation.accuracy,
      timestamp: cachedLocation.timestamp,
      isDefault: false,
      source: 'cache_while_updating'
    };
  }

  // Step 5: Try GPS with longer timeout (for offline sensors)
  if (allowOfflineGPS) {
    try {
      const location = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('GPS timeout (normal mode)'));
        }, GPS_TIMEOUT_NORMAL);

        navigator.geolocation.getCurrentPosition(
          (position) => {
            clearTimeout(timeout);
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy || 100,
              timestamp: position.timestamp || Date.now(),
              isDefault: false,
              source: 'gps_offline'
            });
          },
          (err) => {
            clearTimeout(timeout);
            reject(err);
          },
          {
            enableHighAccuracy: false,
            timeout: GPS_TIMEOUT_NORMAL,
            maximumAge: GPS_MAX_AGE
          }
        );
      });

      // Save to cache
      await saveLocationToCache(location);
      
      console.log('✅ GPS location obtained (offline mode):', {
        lat: location.latitude.toFixed(6),
        lng: location.longitude.toFixed(6),
        accuracy: `${Math.round(location.accuracy)}m`
      });
      
      return location;
    } catch (gpsError) {
      console.warn('⚠️ GPS failed after retries:', gpsError.message);
    }
  }

  // Step 6: Fall back to default
  console.warn('⚠️ Using default location (Ratnapura)');
  return RATNAPURA_DEFAULT;
}

/**
 * Initialize location cache on app start
 * Tries to get a location immediately and cache it
 */
export async function initializeLocationCache() {
  try {
    // Check if we have a recent cache
    const cached = await getCachedLocation();
    if (isCacheValid(cached)) {
      console.log('📍 Using existing cached location');
      return cached;
    }

    // Try to get fresh location in background (non-blocking)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy || 100,
            timestamp: position.timestamp || Date.now()
          };
          await saveLocationToCache(location);
          console.log('✅ Location cache initialized');
        },
        () => {
          // Silently fail - will use default when needed
        },
        {
          enableHighAccuracy: false,
          timeout: 5000,
          maximumAge: GPS_MAX_AGE
        }
      );
    }
  } catch (error) {
    console.error('❌ Failed to initialize location cache:', error);
  }
}

export default {
  getCurrentLocation,
  initializeLocationCache,
  saveLocationToCache,
  getCachedLocation
};

