import { useState, useEffect, useCallback } from 'react';
import syncService from '../services/syncService';

export function useSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSync, setLastSync] = useState(null);
  const [error, setError] = useState(null);

  // Update pending count
  const updatePendingCount = useCallback(async () => {
    const count = await syncService.getPendingCount();
    setPendingCount(count);
  }, []);

  useEffect(() => {
    // Subscribe to sync events
    const unsubscribe = syncService.subscribe((event) => {
      switch (event.type) {
        case 'online':
          setIsOnline(true);
          setError(null);
          break;
        case 'offline':
          setIsOnline(false);
          break;
        case 'sync_started':
          setIsSyncing(true);
          setError(null);
          break;
        case 'sync_complete':
          setIsSyncing(false);
          setLastSync(new Date());
          updatePendingCount();
          break;
        case 'sync_error':
          setIsSyncing(false);
          setError(event.error);
          break;
        case 'incident_saved':
          updatePendingCount();
          break;
      }
    });

    // Initialize sync service
    syncService.init();
    
    // Get initial pending count
    updatePendingCount();

    // Listen for online/offline
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [updatePendingCount]);

  // Manual sync trigger
  const triggerSync = useCallback(async () => {
    return await syncService.syncAll();
  }, []);

  return {
    isOnline,
    isSyncing,
    pendingCount,
    lastSync,
    error,
    triggerSync,
    updatePendingCount
  };
}

export default useSync;
