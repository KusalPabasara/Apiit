/**
 * PROJECT AEGIS - Field Responder App (PWA)
 * 
 * Offline-First Disaster Response System
 * Built for the Ratnapura District disaster scenario
 * 
 * NO LOGIN REQUIRED!
 * Device auto-registers with UUID on first use.
 */

import { BrowserRouter, Routes, Route, Navigate, NavLink } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Home, FileText, History, Loader2 } from 'lucide-react';
import { useDeviceStore } from './stores/deviceStore';

// Pages
import HomePage from './pages/HomePage';
import ReportPage from './pages/ReportPage';
import HistoryPage from './pages/HistoryPage';

// Simple bottom navigation
function BottomNav() {
  const navItems = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/report', icon: FileText, label: 'Report' },
    { to: '/history', icon: History, label: 'History' },
  ];
  
  return (
    <nav className="bottom-nav-aegis">
      {navItems.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) => `nav-item-aegis ${isActive ? 'active' : ''}`}
        >
          <Icon className="w-6 h-6" />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

// Loading screen while device initializes
function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900">
      <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mb-6">
        <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-white mb-2">Project Aegis</h1>
      <p className="text-gray-400 mb-6">Initializing device...</p>
      <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
    </div>
  );
}

function AppRoutes() {
  const { isRegistered, initializeDevice, deviceId } = useDeviceStore();
  const [initializing, setInitializing] = useState(true);
  
  // Auto-initialize device on first mount
  useEffect(() => {
    const init = async () => {
      await initializeDevice();
      setInitializing(false);
    };
    init();
  }, [initializeDevice]);
  
  // Show loading while initializing
  if (initializing) {
    return <LoadingScreen />;
  }
  
  return (
    <div className="min-h-screen">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/report" element={<ReportPage />} />
        <Route path="/history" element={<HistoryPage />} />
        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <BottomNav />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter basename="/app" future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
