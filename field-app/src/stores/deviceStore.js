/**
 * DEVICE STORE - Automatic UUID-based Device Identification
 * 
 * No login required! The device gets a unique ID on first use.
 * This ID is stored permanently and used for all API calls.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Generate UUID v4
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Auto-detect API URL based on environment
const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    return `http://${window.location.hostname}:3001/api`;
  }
  return 'http://localhost:3001/api';
};

const API_URL = getApiUrl();

export const useDeviceStore = create(
  persist(
    (set, get) => ({
      // State
      deviceId: null,
      deviceName: null,
      token: null,
      isRegistered: false,
      registeredAt: null,
      
      // Initialize device - generates UUID and registers with server
      initializeDevice: async () => {
        const state = get();
        
        // Already registered? Just return
        if (state.isRegistered && state.deviceId && state.token) {
          console.log('📱 Device already registered:', state.deviceId.slice(0, 8) + '...');
          return { success: true, deviceId: state.deviceId };
        }
        
        // Generate new device ID if not exists
        const deviceId = state.deviceId || generateUUID();
        const deviceName = `Responder-${deviceId.slice(0, 8)}`;
        
        console.log('🆕 Initializing device:', deviceId.slice(0, 8) + '...');
        
        // Try to register with server (if online)
        if (navigator.onLine) {
          try {
            const response = await fetch(`${API_URL}/auth/register-device`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ deviceId, deviceName })
            });
            
            if (response.ok) {
              const data = await response.json();
              set({
                deviceId,
                deviceName,
                token: data.token,
                isRegistered: true,
                registeredAt: new Date().toISOString()
              });
              console.log('✅ Device registered with server');
              return { success: true, deviceId, token: data.token };
            }
          } catch (error) {
            console.log('📴 Server unavailable, continuing offline');
          }
        }
        
        // Offline mode - just save device ID locally
        set({
          deviceId,
          deviceName,
          isRegistered: true,
          registeredAt: new Date().toISOString()
        });
        console.log('📱 Device initialized (offline mode)');
        return { success: true, deviceId, offline: true };
      },
      
      // Get token (registers if needed)
      getToken: () => {
        return get().token;
      },
      
      // Get device ID
      getDeviceId: () => {
        return get().deviceId;
      },
      
      // Sync device with server (when coming online)
      syncWithServer: async () => {
        const { deviceId, deviceName, token } = get();
        
        if (!deviceId) return { success: false };
        
        try {
          const response = await fetch(`${API_URL}/auth/register-device`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ deviceId, deviceName })
          });
          
          if (response.ok) {
            const data = await response.json();
            set({ token: data.token });
            console.log('🔄 Device synced with server');
            return { success: true, token: data.token };
          }
        } catch (error) {
          console.error('Sync failed:', error);
        }
        
        return { success: false };
      },
      
      // Reset device (for testing)
      resetDevice: () => {
        set({
          deviceId: null,
          deviceName: null,
          token: null,
          isRegistered: false,
          registeredAt: null
        });
        localStorage.removeItem('aegis-device');
      }
    }),
    {
      name: 'aegis-device',
      version: 1
    }
  )
);

export default useDeviceStore;
