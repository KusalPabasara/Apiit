import { useState, useEffect, useCallback, useRef } from 'react';

// Check if we're on a secure origin (HTTPS or localhost)
const isSecureOrigin = () => {
  if (typeof window === 'undefined') return false;
  // Always try GPS - HTTPS is now enabled on the server
  return window.location.protocol === 'https:' || 
         window.location.hostname === 'localhost' ||
         window.location.hostname === '127.0.0.1';
};

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
  isDefault: true
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

  const getCurrentPosition = useCallback(() => {
    return new Promise((resolve, reject) => {
      // Check for secure origin first (Geolocation requires HTTPS)
      if (!isSecureOrigin()) {
        console.warn('⚠️ Geolocation requires HTTPS. Using default location for Ratnapura District.');
        setLocation(RATNAPURA_DEFAULT);
        setUsingDefault(true);
        setLoading(false);
        setError('GPS requires HTTPS. Using default location.');
        resolve(RATNAPURA_DEFAULT);
        return;
      }

      if (!navigator.geolocation) {
        console.warn('⚠️ Geolocation not supported. Using default location.');
        setLocation(RATNAPURA_DEFAULT);
        setUsingDefault(true);
        setError('Geolocation not supported');
        resolve(RATNAPURA_DEFAULT);
        return;
      }

      setLoading(true);
      setError(null);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude,
            altitudeAccuracy: position.coords.altitudeAccuracy,
            heading: position.coords.heading,
            speed: position.coords.speed,
            timestamp: position.timestamp,
            isDefault: false
          };
          setLocation(loc);
          setUsingDefault(false);
          setLoading(false);
          resolve(loc);
        },
        (err) => {
          console.warn('⚠️ Geolocation error:', err.message, '- Using default location.');
          // On error, use default location instead of failing
          setLocation(RATNAPURA_DEFAULT);
          setUsingDefault(true);
          setError(err.message);
          setLoading(false);
          resolve(RATNAPURA_DEFAULT); // Resolve with default, don't reject
        },
        defaultOptions
      );
    });
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
