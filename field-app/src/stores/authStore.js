import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Generate UUID v4 (no external dependency)
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Get or create persistent device ID - NEVER changes unless app reinstalled
const getDeviceId = () => {
  const STORAGE_KEY = 'aegis_device_uuid_v2';
  let deviceId = localStorage.getItem(STORAGE_KEY);
  
  if (!deviceId) {
    deviceId = generateUUID();
    localStorage.setItem(STORAGE_KEY, deviceId);
    console.log('🆔 New Device ID generated:', deviceId.slice(0, 8) + '...');
  }
  
  return deviceId;
};

// Get API URL - Returns relative path /api which browser resolves with current protocol
const getApiUrl = () => {
  if (import.meta.env.MODE === 'production') {
    return '/api';
  }
  return import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
};

export const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      token: null,
      deviceId: getDeviceId(),
      isAuthenticated: false,
      isDeviceRegistered: false,
      authMode: null, // 'device' | 'credentials'
      
      // Register device automatically (for anonymous field users)
      registerDevice: async (deviceName = null) => {
        const { deviceId } = get();
        
        try {
          const response = await fetch(`${getApiUrl()}/auth/register-device`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              deviceId, 
              deviceName: deviceName || `Device-${deviceId.slice(0, 8)}`
            })
          });
          
          if (response.ok) {
            const data = await response.json();
            set({ 
              user: data.user,
              token: data.token,
              isAuthenticated: true,
              isDeviceRegistered: true,
              authMode: 'device'
            });
            return { success: true, data };
          }
          
          const error = await response.json();
          return { success: false, error: error.error };
        } catch (error) {
          console.error('Device registration failed:', error);
          return { success: false, error: 'Network error' };
        }
      },
      
      // Login with username/password (for named responders & admins)
      login: async (username, password) => {
        const { deviceId } = get();
        
        const response = await fetch(`${getApiUrl()}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password, deviceId })
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Login failed');
        }
        
        const data = await response.json();
        set({ 
          user: data.user,
          token: data.token,
          isAuthenticated: true,
          isDeviceRegistered: true,
          authMode: 'credentials'
        });
        
        return data;
      },
      
      // Auto-login with stored token (works offline too)
      autoLogin: async () => {
        const { token, user, deviceId } = get();
        
        // If we have cached user data, allow offline access
        if (user && token) {
          set({ isAuthenticated: true });
          
          // Try to validate token in background (non-blocking)
          try {
            const response = await fetch(`${getApiUrl()}/auth/validate`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
              const data = await response.json();
              set({ user: data.user });
            }
          } catch {
            // Offline - keep using cached data
            console.log('📴 Offline mode - using cached credentials');
          }
          
          return true;
        }
        
        return false;
      },
      
      // Logout (keeps device ID for re-registration)
      logout: () => {
        set({ 
          user: null, 
          token: null, 
          isAuthenticated: false,
          authMode: null
          // Keep: deviceId, isDeviceRegistered
        });
      },
      
      // Update user profile
      updateProfile: (updates) => {
        const { user } = get();
        if (user) {
          set({ user: { ...user, ...updates } });
        }
      },
      
      // Get auth headers for API requests
      getAuthHeaders: () => {
        const { token } = get();
        return token ? { 'Authorization': `Bearer ${token}` } : {};
      }
    }),
    {
      name: 'aegis-auth-v2',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        deviceId: state.deviceId,
        isAuthenticated: state.isAuthenticated,
        isDeviceRegistered: state.isDeviceRegistered,
        authMode: state.authMode
      })
    }
  )
);

export default useAuthStore;
