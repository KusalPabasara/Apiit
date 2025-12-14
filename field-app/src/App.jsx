/**
 * PROJECT AEGIS - Field Responder App (PWA)
 * 
 * Offline-First Disaster Response System
 * Built for the Ratnapura District disaster scenario
 * 
 * Firebase Authentication:
 * - Login once while online
 * - Stay authenticated offline (Firebase persistence)
 */

import { BrowserRouter, Routes, Route, Navigate, NavLink } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Home, FileText, History, Loader2, WifiOff, LogOut } from 'lucide-react';
import { useDeviceStore } from './stores/deviceStore';
import { AuthProvider, useAuth } from './context/AuthContextV2';

// Pages
import HomePage from './pages/HomePage';
import ReportPage from './pages/ReportPage';
import HistoryPage from './pages/HistoryPage';
import LoginPage from './pages/LoginPage';
import SupplyRequestPage from './pages/SupplyRequestPage';
import TrappedCiviliansPage from './pages/TrappedCiviliansPage';
import BlockedRoadsPage from './pages/BlockedRoadsPage';

// Combined Header Bar with Network Status + Logout
function AppHeader({ user, logout }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-3 py-2 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800">
      {/* Network Status */}
      <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
        isOnline 
          ? 'bg-emerald-500/20 text-emerald-400' 
          : 'bg-amber-500/20 text-amber-400'
      }`}>
        {isOnline ? (
          <>
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
            Online
          </>
        ) : (
          <>
            <WifiOff className="w-3 h-3" />
            Offline
          </>
        )}
      </div>
      
      {/* Logout Button */}
      <button
        onClick={logout}
        className="flex items-center gap-2 px-3 py-1 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-slate-700/50 transition-colors"
        title="Logout"
      >
        <span className="max-w-[100px] truncate">{user?.displayName || user?.email?.split('@')[0]}</span>
        <LogOut className="w-4 h-4" />
      </button>
    </div>
  );
}

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

// Protected Route Component
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <LoadingScreen />;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
}

function AppRoutes() {
  const { isRegistered, initializeDevice, deviceId } = useDeviceStore();
  const { isAuthenticated, loading: authLoading, user, logout } = useAuth();
  const [initializing, setInitializing] = useState(true);
  
  // Auto-initialize device on first mount
  useEffect(() => {
    const init = async () => {
      await initializeDevice();
      setInitializing(false);
    };
    init();
  }, [initializeDevice]);
  
  // Show loading while initializing auth or device
  if (authLoading || initializing) {
    return <LoadingScreen />;
  }
  
  // If not authenticated, show login page for all routes except /login
  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }
  
  return (
    <div className="min-h-screen pt-11">
      {/* Combined Header: Network Status + Logout */}
      <AppHeader user={user} logout={logout} />
      
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/report" element={<ReportPage />} />
        <Route path="/supply" element={<SupplyRequestPage />} />
        <Route path="/trapped" element={<TrappedCiviliansPage />} />
        <Route path="/blocked" element={<BlockedRoadsPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter basename="/app" future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
