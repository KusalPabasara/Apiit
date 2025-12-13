import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import syncEngine from './services/syncEngine';

// Initialize sync engine immediately on app load
// This ensures syncing starts as soon as connectivity returns
syncEngine.init();

// Register service worker for offline support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/app/sw.js')
      .then((registration) => {
        console.log('✅ Service Worker registered:', registration.scope);
      })
      .catch((error) => {
        console.log('❌ Service Worker registration failed:', error);
      });
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
