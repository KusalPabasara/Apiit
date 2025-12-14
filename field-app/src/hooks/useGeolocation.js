import { useState, useEffect, useCallback, useRef } from 'react';
import locationService from '../services/locationService';

// Default location for Ratnapura District (for demo/fallback)
const RATNAPURA_DEFAULT = {
  latitude: 6.6828,
  longitude: 80.3992,
  accuracy: 1000,
  altitude: null,
  altitudeAccuracy: null,
  heading: null,
  speed: null,
  timestamp: Date.now(),
  isDefault: true,
  source: 'default'
};

export function useGeolocation(options = {}) {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [usingDefault, setUsingDefault] = useState(false);
  const watchIdRef = useRef(null);

  const defaultOptions = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0,
    ...options
  };

  const getCurrentPosition = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Use location service with smart caching
      const location = await locationService.getCurrentLocation({
        useCache: true,
        fastMode: true,
        allowOfflineGPS: true
      });

      const loc = {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy || 1000,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
        timestamp: location.timestamp || Date.now(),
        isDefault: location.isDefault || false,
        source: location.source || 'unknown'
      };

      setLocation(loc);
      setUsingDefault(loc.isDefault);
      setLoading(false);
      return loc;
    } catch (err) {
      console.warn('⚠️ Location service error:', err.message);
      setLocation(RATNAPURA_DEFAULT);
      setUsingDefault(true);
      setError(err.message);
      setLoading(false);
      return RATNAPURA_DEFAULT;
    }
  }, []);

  const startWatching = useCallback((onUpdate, watchOptions = {}) => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported');
      return null;
    }

    // Stop any existing watch
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    const mergedOptions = { ...defaultOptions, ...watchOptions };

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const loc = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          heading: position.coords.heading,
          speed: position.coords.speed,
          timestamp: position.timestamp
        };
        setLocation(loc);
        if (onUpdate) onUpdate(loc);
      },
      (err) => {
        setError(err.message);
      },
      mergedOptions
    );

    return watchIdRef.current;
  }, []);

  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  // Legacy getLocation for backward compatibility
  const getLocation = () => {
    getCurrentPosition().catch(() => {});
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopWatching();
    };
  }, [stopWatching]);

  return {
    location,
    error,
    loading,
    usingDefault,
    refresh: getLocation,
    getCurrentPosition,
    startWatching,
    stopWatching,
    isWatching: watchIdRef.current !== null
  };
}

export default useGeolocation;
