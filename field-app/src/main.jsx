import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import syncEngine from './services/syncEngine';

// Initialize sync engine immediately on app load
// This ensures syncing starts as soon as connectivity returns
syncEngine.init();

// Only register Service Worker on localhost or with valid SSL
// Self-signed certificates don't work with Service Workers
const shouldRegisterSW = () => {
  if (typeof window === 'undefined') return false;
  const hostname = window.location.hostname;
  // Register on localhost (development) or HTTP (no SSL issues)
  // Skip on HTTPS with IP address (likely self-signed cert)
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return true;
  }
  // Skip SW on HTTPS with IP (self-signed cert won't work)
  if (window.location.protocol === 'https:' && /^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
    console.log('⚠️ Skipping Service Worker on HTTPS with IP (self-signed cert)');
    console.log('📱 Offline data storage still works via IndexedDB!');
    return false;
  }
  return true;
};

if (shouldRegisterSW()) {
  import('virtual:pwa-register').then(({ registerSW }) => {
    registerSW({
      onNeedRefresh() {
        console.log('🔄 New content available, refresh to update');
      },
      onOfflineReady() {
        console.log('✅ App ready to work offline!');
      },
      onRegistered(registration) {
        console.log('✅ Service Worker registered:', registration?.scope);
      },
      onRegisterError(error) {
        console.error('❌ Service Worker registration failed:', error);
      }
    });
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
