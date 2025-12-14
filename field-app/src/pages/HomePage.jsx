import { useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { 
  FileText,
  History, 
  Shield,
  Wifi,
  WifiOff,
  Users,
  Blocks,
  Package,
  AlertTriangle
} from 'lucide-react';
import { useDeviceStore } from '../stores/deviceStore';
import { useAuth } from '../context/AuthContextV2';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { getUnsyncedReports, getUnsyncedEmergencies, db } from '../db/database';
import syncEngine from '../services/syncEngine';
import locationService from '../services/locationService';

function HomePage() {
  const navigate = useNavigate();
  const { deviceId } = useDeviceStore();
  const { user } = useAuth();
  const { isOnline } = useNetworkStatus();
  const [pendingReports, setPendingReports] = useState(0);
  const [sosActive, setSosActive] = useState(false);
  const [sosProgress, setSosProgress] = useState(0);
  const [sosSent, setSosSent] = useState(false);
  const sosTimerRef = useRef(null);
  const sosIntervalRef = useRef(null);

  useEffect(() => {
    // Check pending reports count (all types: incidents, SOS, trapped, blocked roads, supply)
    const checkPending = async () => {
      try {
        const [unsyncedReports, unsyncedEmergencies, unsyncedTrapped, unsyncedBlocked, unsyncedSupply] = await Promise.all([
          getUnsyncedReports(),
          getUnsyncedEmergencies(),
          db.trappedCivilians.where('synced').equals(0).toArray().catch(() => []),
          db.blockedRoads.where('synced').equals(0).toArray().catch(() => []),
          db.supplyRequests.where('synced').equals(0).toArray().catch(() => [])
        ]);
        const total = unsyncedReports.length + unsyncedEmergencies.length + 
                     unsyncedTrapped.length + unsyncedBlocked.length + unsyncedSupply.length;
        setPendingReports(total);
      } catch (error) {
        console.error('Error checking pending reports:', error);
        const unsynced = await getUnsyncedReports();
        setPendingReports(unsynced.length);
      }
    };
    checkPending();

    // Listen for sync events
    const unsubscribe = syncEngine.addListener((event) => {
      if (event === 'syncComplete' || event === 'reportSynced' || event === 'online') {
        checkPending();
      }
    });

    return () => unsubscribe();
  }, []);

  // Get API URL dynamically
  const getApiUrl = () => {
    if (import.meta.env.MODE === 'production') {
      return '/api';
    }
    return import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
  };

  // SOS Button Handlers
  const handleSosStart = () => {
    setSosActive(true);
    setSosProgress(0);
    
    // Progress animation
    sosIntervalRef.current = setInterval(() => {
      setSosProgress(prev => {
        if (prev >= 100) {
          clearInterval(sosIntervalRef.current);
          return 100;
        }
        return prev + (100 / 30); // 3 seconds = 30 intervals at 100ms
      });
    }, 100);
    
    // Trigger SOS after 3 seconds
    sosTimerRef.current = setTimeout(() => {
      triggerSos();
    }, 3000);
  };

  const handleSosEnd = () => {
    if (sosTimerRef.current) {
      clearTimeout(sosTimerRef.current);
    }
    if (sosIntervalRef.current) {
      clearInterval(sosIntervalRef.current);
    }
    setSosActive(false);
    setSosProgress(0);
  };

  const triggerSos = async () => {
    setSosSent(true);
    
    try {
      // Use location service with smart caching
      const location = await locationService.getCurrentLocation({
        useCache: true,
        fastMode: true,
        allowOfflineGPS: true
      });
      
      const latitude = location.latitude;
      const longitude = location.longitude;

      const sosData = {
        id: `sos_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        localId: `sos_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        deviceId: deviceId,
        responder_name: user?.displayName || user?.email || 'Unknown',
        responder_email: user?.email || null,
        responder_uid: user?.uid || null,
        latitude,
        longitude,
        timestamp: new Date().toISOString(),
        status: 'active',
        syncStatus: 0 // 0 = unsynced, 1 = synced (matches emergencies table schema)
      };

      // Always save to IndexedDB first
      try {
        await db.emergencies.add(sosData);
        console.log('💾 SOS alert saved to IndexedDB');
      } catch (dbError) {
        console.error('❌ Failed to save SOS to IndexedDB:', dbError);
      }

      // Try to sync immediately if online
      if (isOnline) {
        const apiUrl = getApiUrl();
        console.log('🆘 Sending SOS to:', `${apiUrl}/sos`);
        console.log('🆘 SOS Data:', sosData);
        
        try {
          const response = await fetch(`${apiUrl}/sos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              device_id: sosData.device_id,
              responder_name: sosData.responder_name,
              responder_email: sosData.responder_email,
              responder_uid: sosData.responder_uid,
              latitude: sosData.latitude,
              longitude: sosData.longitude,
              timestamp: sosData.timestamp
            })
          });

          if (response.ok) {
            const result = await response.json();
            // Mark as synced
            try {
              await db.emergencies.update(sosData.id, { syncStatus: 1 });
              console.log('✅ SOS Alert sent and marked as synced!', result);
            } catch (updateError) {
              console.error('⚠️ Failed to mark SOS as synced:', updateError);
            }
          } else {
            const errorText = await response.text();
            console.error(`❌ Server rejected SOS: ${response.status} - ${errorText}`);
            // Keep as unsynced, will retry later
          }
        } catch (fetchError) {
          console.error('❌ Network error sending SOS:', fetchError);
          // Keep as unsynced, will retry later
        }
      } else {
        console.log('📴 Offline - SOS saved locally, will sync when online');
      }
    } catch (error) {
      console.error('❌ Failed to process SOS:', error);
    }

    // Reset after 3 seconds
    setTimeout(() => {
      setSosSent(false);
      setSosActive(false);
      setSosProgress(0);
    }, 3000);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sosTimerRef.current) clearTimeout(sosTimerRef.current);
      if (sosIntervalRef.current) clearInterval(sosIntervalRef.current);
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 safe-top safe-bottom">
      {/* Compact Header */}
      <header className="px-4 pt-4 pb-3">
        <div className="flex items-center justify-between">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white">Project Aegis</h1>
              <p className="text-xs text-gray-400">Field Responder App</p>
            </div>
          </div>

          {/* Compact Status Badges */}
          <div className="flex items-center gap-2">
            {/* Online Status Badge */}
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${
              isOnline 
                ? 'bg-emerald-500/20 text-emerald-400' 
                : 'bg-amber-500/20 text-amber-400'
            }`}>
              {isOnline ? (
                <Wifi className="w-3 h-3" />
              ) : (
                <WifiOff className="w-3 h-3" />
              )}
              <span className="hidden sm:inline">{isOnline ? 'Online' : 'Offline'}</span>
            </div>

            {/* Device ID Badge */}
            <div className="px-2 py-1 bg-slate-800 text-slate-400 rounded-full text-xs font-mono">
              {deviceId ? deviceId.slice(0, 6) : '---'}
            </div>
          </div>
        </div>
      </header>

      {/* Grid Layout */}
      <main className="px-4 pt-2">
        <div className="grid grid-cols-2 gap-3">
          {/* Report Incident - Large Card (spans 2 columns on mobile, stays single on larger) */}
          <button
            onClick={() => navigate('/report')}
            className="col-span-2 sm:col-span-1 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-5 text-white shadow-lg hover:shadow-xl transition-all active:scale-[0.98] relative overflow-hidden"
          >
            {/* Pending Badge */}
            {pendingReports > 0 && (
              <div className="absolute top-3 right-3 bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {pendingReports} pending
              </div>
            )}
            <div className="flex flex-col items-start gap-3">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                <FileText className="w-7 h-7" />
              </div>
              <div className="text-left">
                <h3 className="text-xl font-bold">Report Incident</h3>
                <p className="text-red-100 text-sm mt-1">Log disaster situation</p>
              </div>
            </div>
          </button>

          {/* Trapped Civilians - Softer Rose */}
          <button
            onClick={() => navigate('/trapped')}
            className="bg-gradient-to-br from-pink-400 to-pink-500 rounded-2xl p-5 text-white shadow-lg hover:shadow-xl transition-all active:scale-[0.98]"
          >
            <div className="flex flex-col items-start gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <div className="text-left">
                <h3 className="text-base font-bold">Trapped Civilians</h3>
                <p className="text-pink-100 text-xs mt-1">People need rescue</p>
              </div>
            </div>
          </button>

          {/* Blocked Roads - Softer Orange */}
          <button
            onClick={() => navigate('/blocked')}
            className="bg-gradient-to-br from-amber-400 to-amber-500 rounded-2xl p-5 text-white shadow-lg hover:shadow-xl transition-all active:scale-[0.98]"
          >
            <div className="flex flex-col items-start gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                <Blocks className="w-6 h-6" />
              </div>
              <div className="text-left">
                <h3 className="text-base font-bold">Blocked Roads</h3>
                <p className="text-amber-100 text-xs mt-1">Report obstructions</p>
              </div>
            </div>
          </button>

          {/* Supply Needs */}
          <button
            onClick={() => navigate('/supply')}
            className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-5 text-white shadow-lg hover:shadow-xl transition-all active:scale-[0.98]"
          >
            <div className="flex flex-col items-start gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                <Package className="w-6 h-6" />
              </div>
              <div className="text-left">
                <h3 className="text-base font-bold">Supply Needs</h3>
                <p className="text-blue-100 text-xs mt-1">Request supplies</p>
              </div>
            </div>
          </button>

          {/* History */}
          <button
            onClick={() => navigate('/history')}
            className="bg-gradient-to-br from-slate-700 to-slate-800 rounded-2xl p-5 text-white shadow-lg hover:shadow-xl transition-all active:scale-[0.98] border border-slate-600"
          >
            <div className="flex flex-col items-start gap-3">
              <div className="w-12 h-12 bg-slate-600/50 rounded-2xl flex items-center justify-center">
                <History className="w-6 h-6" />
              </div>
              <div className="text-left">
                <h3 className="text-base font-bold">History</h3>
                <p className="text-slate-300 text-xs mt-1">View all submissions</p>
              </div>
            </div>
          </button>
        </div>

        {/* Offline Info Banner */}
        {!isOnline && (
          <div className="mt-4 p-3 rounded-xl bg-amber-500/20 border border-amber-500/30">
            <p className="text-amber-400 text-sm font-medium">
              📱 Working Offline - Reports saved locally
            </p>
          </div>
        )}

        {/* Sync Info */}
        {isOnline && pendingReports > 0 && (
          <div className="mt-4 p-3 rounded-xl bg-blue-500/20 border border-blue-500/30">
            <p className="text-blue-400 text-sm font-medium">
              ☁️ {pendingReports} report{pendingReports > 1 ? 's' : ''} pending sync
            </p>
            <p className="text-blue-300 text-xs mt-1">
              Will sync automatically when online...
            </p>
          </div>
        )}
        
        {/* Sync Success Message */}
        {isOnline && pendingReports === 0 && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30">
            <p className="text-emerald-400 text-sm font-medium">
              ✅ All reports synced
            </p>
          </div>
        )}

        {/* SOS Button - Press and Hold */}
        <div className="mt-8 mb-6 flex flex-col items-center">
          <p className="text-slate-400 text-xs mb-3">Emergency Alert</p>
          
          <button
            onMouseDown={handleSosStart}
            onMouseUp={handleSosEnd}
            onMouseLeave={handleSosEnd}
            onTouchStart={handleSosStart}
            onTouchEnd={handleSosEnd}
            className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 select-none ${
              sosSent 
                ? 'bg-gradient-to-br from-emerald-400 to-emerald-500 shadow-2xl scale-110 cursor-default' 
                : sosActive
                ? 'bg-gradient-to-br from-red-500 to-red-600 shadow-2xl scale-105 cursor-grabbing'
                : 'bg-gradient-to-br from-red-400 to-red-500 shadow-lg hover:shadow-xl cursor-pointer active:cursor-grabbing'
            }`}
            style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none', userSelect: 'none' }}
          >
            {/* Progress Ring */}
            {sosActive && !sosSent && (
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  stroke="white"
                  strokeWidth="4"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 36}`}
                  strokeDashoffset={`${2 * Math.PI * 36 * (1 - sosProgress / 100)}`}
                  className="transition-all duration-100"
                  opacity="0.5"
                />
              </svg>
            )}
            
            {/* Icon */}
            <div className="relative z-10">
              {sosSent ? (
                <div className="text-white text-center">
                  <div className="text-2xl font-bold mb-1">✓</div>
                  <div className="text-xs">Sent!</div>
                </div>
              ) : (
                <div className="text-white text-center">
                  <AlertTriangle className="w-8 h-8 mx-auto mb-1" />
                  <div className="text-xs font-bold">SOS</div>
                </div>
              )}
            </div>

            {/* Ripple Effect when active */}
            {sosActive && !sosSent && (
              <>
                <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75"></span>
                <span className="absolute inset-0 rounded-full bg-red-500 animate-pulse opacity-50"></span>
              </>
            )}
          </button>
          
          <p className="text-slate-500 text-xs mt-3 text-center">
            {sosSent ? 'Emergency alert sent!' : sosActive ? 'Hold...' : 'Press & hold for 3s'}
          </p>
        </div>
      </main>
    </div>
  );
}

export default HomePage;
