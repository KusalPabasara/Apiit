import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, MapPin, Wifi, WifiOff } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useEmergencyStore } from '../stores/emergencyStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useGeolocation } from '../hooks/useGeolocation';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { db } from '../db/database';

const API_URL = import.meta.env.VITE_API_URL || 'http://152.42.185.253:3001/api';

const HOLD_DURATION = 5000; // 5 seconds
const LOCATION_UPDATE_INTERVAL = 30000; // 30 seconds for emergency mode
const LOCATION_UPDATE_INTERVAL_STATIONARY = 120000; // 2 minutes when stationary

export const EmergencyButton = () => {
  const { t } = useTranslation();
  const [holdProgress, setHoldProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [sendingStatus, setSendingStatus] = useState('idle'); // idle, sending, sent, stored
  
  const holdTimerRef = useRef(null);
  const progressIntervalRef = useRef(null);
  const locationIntervalRef = useRef(null);
  const lastLocationRef = useRef(null);
  
  const { 
    isEmergencyActive, 
    emergencyId,
    activateEmergency, 
    addLocation, 
    deactivateEmergency,
    locations 
  } = useEmergencyStore();
  
  const { medicalId } = useSettingsStore();
  const { getCurrentPosition, startWatching, stopWatching, location } = useGeolocation();
  const { isOnline, networkQuality } = useNetworkStatus();
  
  // Send emergency data to server
  const sendEmergencyData = useCallback(async (emergencyData) => {
    try {
      const response = await fetch(`${API_URL}/emergency`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('aegis_token')}`
        },
        body: JSON.stringify(emergencyData)
      });
      
      if (response.ok) {
        return { success: true };
      }
      throw new Error('Server error');
    } catch (error) {
      return { success: false, error };
    }
  }, []);
  
  // Store emergency data locally
  const storeEmergencyLocally = useCallback(async (emergencyData) => {
    try {
      await db.emergencies.put({
        ...emergencyData,
        syncStatus: 0,
        createdAt: new Date().toISOString()
      });
      return true;
    } catch (error) {
      console.error('Failed to store emergency locally:', error);
      return false;
    }
  }, []);
  
  // Handle emergency activation
  const handleEmergencyActivation = useCallback(async () => {
    const newEmergencyId = uuidv4();
    activateEmergency(newEmergencyId);
    
    setSendingStatus('sending');
    setStatusMessage(t('emergency.sendingLocation'));
    
    try {
      // Get current location
      const loc = await getCurrentPosition();
      addLocation(loc);
      lastLocationRef.current = loc;
      
      const emergencyData = {
        id: newEmergencyId,
        latitude: loc.latitude,
        longitude: loc.longitude,
        accuracy: loc.accuracy,
        timestamp: Date.now(),
        deviceId: localStorage.getItem('aegis_device_id')
      };
      
      // Try to send to server
      if (isOnline) {
        const result = await sendEmergencyData(emergencyData);
        
        if (result.success) {
          setSendingStatus('sent');
          setStatusMessage(t('emergency.locationSent'));
          
          // Try to send medical ID if good connection
          if (networkQuality === 'good' && medicalId && medicalId.bloodType) {
            await sendEmergencyData({
              ...emergencyData,
              medicalId,
              type: 'medical_update'
            });
          }
        } else {
          throw new Error('Send failed');
        }
      } else {
        throw new Error('Offline');
      }
    } catch (error) {
      // Store locally if send fails
      setSendingStatus('stored');
      setStatusMessage(t('emergency.locationStored'));
      
      const loc = lastLocationRef.current || location;
      if (loc) {
        await storeEmergencyLocally({
          id: newEmergencyId,
          latitude: loc.latitude,
          longitude: loc.longitude,
          accuracy: loc.accuracy,
          timestamp: Date.now(),
          deviceId: localStorage.getItem('aegis_device_id')
        });
      }
    }
    
    // Start continuous location tracking
    startLocationTracking();
  }, [activateEmergency, addLocation, getCurrentPosition, isOnline, medicalId, networkQuality, sendEmergencyData, storeEmergencyLocally, t, location]);
  
  // Start continuous location tracking for emergency
  const startLocationTracking = useCallback(() => {
    let lastLat = lastLocationRef.current?.latitude;
    let lastLng = lastLocationRef.current?.longitude;
    
    const updateLocation = async () => {
      try {
        const loc = await getCurrentPosition();
        
        // Check if moved significantly (>50m)
        const hasMoved = lastLat && lastLng && 
          calculateDistance(lastLat, lastLng, loc.latitude, loc.longitude) > 50;
        
        addLocation(loc);
        lastLocationRef.current = loc;
        lastLat = loc.latitude;
        lastLng = loc.longitude;
        
        // Try to send to server
        if (isOnline) {
          const result = await sendEmergencyData({
            id: emergencyId,
            latitude: loc.latitude,
            longitude: loc.longitude,
            accuracy: loc.accuracy,
            timestamp: Date.now(),
            type: 'location_update'
          });
          
          if (result.success) {
            setSendingStatus('sent');
            setStatusMessage(t('emergency.trackingActive'));
          }
        } else {
          // Store locally
          await storeEmergencyLocally({
            id: emergencyId,
            latitude: loc.latitude,
            longitude: loc.longitude,
            timestamp: Date.now(),
            type: 'location_update'
          });
        }
        
        // Adjust interval based on movement
        clearInterval(locationIntervalRef.current);
        locationIntervalRef.current = setInterval(
          updateLocation,
          hasMoved ? LOCATION_UPDATE_INTERVAL : LOCATION_UPDATE_INTERVAL_STATIONARY
        );
      } catch (error) {
        console.error('Location update failed:', error);
      }
    };
    
    // Initial update
    locationIntervalRef.current = setInterval(updateLocation, LOCATION_UPDATE_INTERVAL);
  }, [addLocation, emergencyId, getCurrentPosition, isOnline, sendEmergencyData, storeEmergencyLocally, t]);
  
  // Calculate distance between two points (Haversine formula)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    
    return R * c;
  };
  
  // Handle hold start
  const handleHoldStart = (e) => {
    e.preventDefault();
    if (isEmergencyActive) return;
    
    setIsHolding(true);
    setHoldProgress(0);
    
    // Vibrate if supported
    if (navigator.vibrate) {
      navigator.vibrate(100);
    }
    
    // Start progress tracking
    const startTime = Date.now();
    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / HOLD_DURATION) * 100, 100);
      setHoldProgress(progress);
      
      // Vibrate feedback at intervals
      if (navigator.vibrate && progress % 20 === 0) {
        navigator.vibrate(50);
      }
    }, 50);
    
    // Set timer for activation
    holdTimerRef.current = setTimeout(() => {
      clearInterval(progressIntervalRef.current);
      setIsHolding(false);
      setHoldProgress(100);
      
      // Strong vibration on activation
      if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200, 100, 200]);
      }
      
      handleEmergencyActivation();
    }, HOLD_DURATION);
  };
  
  // Handle hold end
  const handleHoldEnd = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    setIsHolding(false);
    setHoldProgress(0);
  };
  
  // Handle cancel emergency
  const handleCancelEmergency = async () => {
    if (locationIntervalRef.current) {
      clearInterval(locationIntervalRef.current);
      locationIntervalRef.current = null;
    }
    stopWatching();
    deactivateEmergency();
    setSendingStatus('idle');
    setStatusMessage('');
    setHoldProgress(0);
    
    // Notify server of cancellation
    if (isOnline && emergencyId) {
      try {
        await sendEmergencyData({
          id: emergencyId,
          type: 'cancel',
          timestamp: Date.now()
        });
      } catch (e) {
        // Store cancellation locally
        await storeEmergencyLocally({
          id: emergencyId,
          type: 'cancel',
          timestamp: Date.now()
        });
      }
    }
  };
  
  // Sync pending emergencies when online
  useEffect(() => {
    const syncPendingEmergencies = async () => {
      if (!isOnline) return;
      
      try {
        const pendingEmergencies = await db.emergencies
          .where('synced')
          .equals(false)
          .toArray();
        
        for (const emergency of pendingEmergencies) {
          const result = await sendEmergencyData(emergency);
          if (result.success) {
            await db.emergencies.update(emergency.id, { syncStatus: 1 });
          }
        }
      } catch (error) {
        console.error('Failed to sync emergencies:', error);
      }
    };
    
    syncPendingEmergencies();
  }, [isOnline, sendEmergencyData]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      if (locationIntervalRef.current) clearInterval(locationIntervalRef.current);
    };
  }, []);
  
  return (
    <div className="w-full">
      {/* Emergency Button */}
      {!isEmergencyActive ? (
        <div className="relative">
          <button
            className={`emergency-btn ${isHolding ? 'holding' : ''}`}
            onMouseDown={handleHoldStart}
            onMouseUp={handleHoldEnd}
            onMouseLeave={handleHoldEnd}
            onTouchStart={handleHoldStart}
            onTouchEnd={handleHoldEnd}
          >
            {/* Progress Ring */}
            {isHolding && (
              <svg className="progress-ring" viewBox="0 0 120 120">
                <circle
                  className="progress-ring-circle"
                  cx="60"
                  cy="60"
                  r="54"
                  style={{
                    strokeDasharray: `${holdProgress * 3.39} 339`,
                    opacity: 0.3
                  }}
                />
                <circle
                  className="progress-ring-circle"
                  cx="60"
                  cy="60"
                  r="54"
                  style={{
                    strokeDasharray: `${holdProgress * 3.39} 339`
                  }}
                />
              </svg>
            )}
            
            <div className="flex flex-col items-center justify-center relative z-10">
              <AlertTriangle className={`w-14 h-14 mb-2 ${isHolding ? 'animate-pulse' : ''}`} />
              <span className="text-2xl font-bold tracking-wide">
                {t('emergency.title')}
              </span>
              <span className="text-sm opacity-80 mt-1 font-medium">
                {isHolding 
                  ? `${Math.ceil((HOLD_DURATION - (holdProgress / 100 * HOLD_DURATION)) / 1000)}s`
                  : t('emergency.hold')
                }
              </span>
            </div>
          </button>
        </div>
      ) : (
        /* Emergency Active State */
        <div className="rounded-3xl overflow-hidden bg-gradient-to-b from-red-500 to-red-700 p-6 shadow-2xl">
          <div className="text-center mb-5">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-10 h-10 text-white animate-pulse" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">
              {t('emergency.active')}
            </h2>
            <p className="text-white/80 text-sm">
              {t('emergency.helpOnWay')}
            </p>
          </div>
          
          {/* Status Badge */}
          <div className={`flex items-center justify-center gap-2 py-3 px-5 rounded-xl mb-5 ${
            sendingStatus === 'sent' 
              ? 'bg-emerald-500/30 border border-emerald-400/30' 
              : sendingStatus === 'stored' 
                ? 'bg-amber-500/30 border border-amber-400/30' 
                : 'bg-white/10 border border-white/20'
          }`}>
            <MapPin className="w-5 h-5 text-white" />
            <span className="text-white text-sm font-medium">{statusMessage}</span>
          </div>
          
          {/* Live Tracking Info */}
          <div className="bg-white/10 rounded-xl p-4 mb-5">
            <div className="flex items-center justify-between">
              <span className="text-white/70 text-sm">{t('emergency.locationUpdates')}</span>
              <span className="text-white font-bold text-lg">{locations.length}</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="status-dot status-dot-online"></span>
              <span className="text-emerald-300 text-xs font-medium">
                {t('emergency.liveTracking')}
              </span>
            </div>
          </div>
          
          {/* Cancel Button */}
          <button
            onClick={handleCancelEmergency}
            className="w-full py-4 rounded-xl bg-white/10 border-2 border-white/30 text-white font-semibold hover:bg-white/20 transition-colors"
          >
            {t('emergency.cancel')}
          </button>
        </div>
      )}
    </div>
  );
};

export default EmergencyButton;
