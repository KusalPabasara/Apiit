import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import syncEngine from './services/syncEngine';
import locationService from './services/locationService';

// Initialize sync engine immediately on app load
// This ensures syncing starts as soon as connectivity returns
syncEngine.init();

// Initialize location cache on app startup
// This ensures we have a cached location even after app kills
locationService.initializeLocationCache();

// ALWAYS try to register Service Worker for offline support
// This is CRITICAL for the PWA to work offline
// If using self-signed cert, user must accept it first
const registerServiceWorker = async () => {
  if (typeof window === 'undefined') return;
  
  try {
    const { registerSW } = await import('virtual:pwa-register');
    
    registerSW({
      immediate: true, // Register immediately
      onNeedRefresh() {
        console.log('🔄 New content available, refresh to update');
      },
      onOfflineReady() {
        console.log('✅ App ready to work offline!');
        console.log('📱 You can now close the browser and reopen in airplane mode!');
      },
      onRegistered(registration) {
        console.log('✅ Service Worker registered successfully!');
        console.log('📍 Scope:', registration?.scope);
        console.log('📴 Offline mode: ENABLED');
      },
      onRegisterError(error) {
        console.error('❌ Service Worker registration failed:', error);
        console.log('⚠️ Offline page refresh will NOT work');
        console.log('💡 TIP: If using self-signed HTTPS, accept the certificate first');
        console.log('📱 IndexedDB data storage still works!');
      }
    });
  } catch (error) {
    console.error('Failed to load SW module:', error);
  }
};

// Register SW
registerServiceWorker();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
