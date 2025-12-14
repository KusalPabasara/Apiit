import { useState, useEffect, useCallback } from 'react';

export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [networkQuality, setNetworkQuality] = useState('unknown');
  const [effectiveType, setEffectiveType] = useState(null);
  
  const updateNetworkInfo = useCallback(() => {
    setIsOnline(navigator.onLine);
    
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    
    if (connection) {
      setEffectiveType(connection.effectiveType);
      
      // Determine network quality
      if (connection.effectiveType === '4g' && connection.downlink > 5) {
        setNetworkQuality('good');
      } else if (connection.effectiveType === '4g' || connection.effectiveType === '3g') {
        setNetworkQuality('moderate');
      } else if (connection.effectiveType === '2g' || connection.effectiveType === 'slow-2g') {
        setNetworkQuality('poor');
      } else {
        setNetworkQuality('unknown');
      }
    } else {
      setNetworkQuality(navigator.onLine ? 'unknown' : 'offline');
    }
  }, []);
  
  useEffect(() => {
    updateNetworkInfo();
    
    window.addEventListener('online', updateNetworkInfo);
    window.addEventListener('offline', updateNetworkInfo);
    
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (connection) {
      connection.addEventListener('change', updateNetworkInfo);
    }
    
    return () => {
      window.removeEventListener('online', updateNetworkInfo);
      window.removeEventListener('offline', updateNetworkInfo);
      
      if (connection) {
        connection.removeEventListener('change', updateNetworkInfo);
      }
    };
  }, [updateNetworkInfo]);
  
  return {
    isOnline,
    networkQuality,
    effectiveType,
    isGoodConnection: networkQuality === 'good',
    isPoorConnection: networkQuality === 'poor' || !isOnline
  };
};
