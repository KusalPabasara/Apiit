import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { 
  FileText,
  History, 
  Shield,
  Wifi,
  WifiOff,
  ChevronRight,
  Upload,
  CheckCircle,
  AlertCircle,
  Smartphone
} from 'lucide-react';
import { useDeviceStore } from '../stores/deviceStore';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { getUnsyncedReports } from '../db/database';
import syncEngine from '../services/syncEngine';

function HomePage() {
  const navigate = useNavigate();
  const { deviceId, deviceName, token } = useDeviceStore();
  const { isOnline } = useNetworkStatus();
  const [pendingReports, setPendingReports] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState(null);

  // Set token on sync engine and listen for events
  // Note: syncEngine.init() is called once in main.jsx
  useEffect(() => {
    if (token) {
      syncEngine.setToken(token);
    }

    // Check pending reports count
    const checkPending = async () => {
      const unsynced = await getUnsyncedReports();
      setPendingReports(unsynced.length);
    };
    checkPending();

    // Listen for sync events
    const unsubscribe = syncEngine.addListener((event, data) => {
      if (event === 'syncStart') {
        setSyncing(true);
        setLastSyncResult(null);
      } else if (event === 'syncComplete') {
        setSyncing(false);
        setLastSyncResult(data);
        checkPending();
      } else if (event === 'reportSynced') {
        checkPending();
      } else if (event === 'online') {
        // Refresh pending count when coming online
        checkPending();
      }
    });

    return () => unsubscribe();
  }, [token]);

  // Manual sync trigger
  const handleManualSync = () => {
    if (isOnline && pendingReports > 0) {
      syncEngine.syncAll();
    }
  };

  return (
    <div className="min-h-screen safe-top safe-bottom px-4">
      {/* Header */}
      <header className="flex items-center justify-between py-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Project Aegis</h1>
            <p className="text-xs text-gray-400">Field Responder App</p>
          </div>
        </div>
      </header>

      {/* Connection Status */}
      <div className={`flex items-center justify-between p-4 rounded-xl mb-4 ${
        isOnline 
          ? 'bg-emerald-500/20 border border-emerald-500/30' 
          : 'bg-amber-500/20 border border-amber-500/30'
      }`}>
        <div className="flex items-center gap-3">
          {isOnline ? (
            <Wifi className="w-5 h-5 text-emerald-400" />
          ) : (
            <WifiOff className="w-5 h-5 text-amber-400" />
          )}
          <div>
            <p className={`font-medium ${isOnline ? 'text-emerald-400' : 'text-amber-400'}`}>
              {isOnline ? 'Online' : 'Offline Mode'}
            </p>
            <p className="text-xs text-gray-400">
              {isOnline 
                ? 'Reports will sync automatically' 
                : 'Reports saved locally until reconnected'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Device Card */}
      <div className="card-aegis mb-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white">
            <Smartphone className="w-7 h-7" />
          </div>
          <div className="flex-1">
            <p className="text-gray-400 text-sm">Device ID</p>
            <h2 className="text-white font-mono text-sm">
              {deviceId ? deviceId.slice(0, 8) + '...' : 'Initializing...'}
            </h2>
            <p className="text-xs text-gray-500 mt-1">{deviceName || 'Responder'}</p>
          </div>
        </div>
      </div>

      {/* Pending Sync Status */}
      {pendingReports > 0 && (
        <div className="card-aegis mb-4 border-l-4 border-amber-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Upload className="w-5 h-5 text-amber-400" />
              <div>
                <p className="text-white font-medium">
                  {pendingReports} report{pendingReports > 1 ? 's' : ''} pending sync
                </p>
                <p className="text-xs text-gray-400">
                  {isOnline ? 'Tap to sync now' : 'Will sync when online'}
                </p>
              </div>
            </div>
            {isOnline && !syncing && (
              <button
                onClick={handleManualSync}
                className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium"
              >
                Sync Now
              </button>
            )}
            {syncing && (
              <div className="text-amber-400 text-sm">Syncing...</div>
            )}
          </div>
        </div>
      )}

      {/* Last Sync Result */}
      {lastSyncResult && lastSyncResult.synced > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/20 text-emerald-400 text-sm mb-4">
          <CheckCircle className="w-4 h-4" />
          {lastSyncResult.synced} report{lastSyncResult.synced > 1 ? 's' : ''} synced successfully
        </div>
      )}

      {/* Main Action - Report Incident */}
      <button
        onClick={() => navigate('/report')}
        className="w-full p-6 rounded-2xl bg-gradient-to-r from-red-500 to-red-600 text-white mb-4 shadow-lg hover:shadow-xl transition-shadow"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
              <FileText className="w-7 h-7" />
            </div>
            <div className="text-left">
              <h3 className="text-xl font-bold">Report Incident</h3>
              <p className="text-red-100 text-sm">Log disaster situation</p>
            </div>
          </div>
          <ChevronRight className="w-6 h-6 opacity-70" />
        </div>
      </button>

      {/* View History */}
      <button
        onClick={() => navigate('/history')}
        className="card-aegis w-full flex items-center justify-between hover:bg-slate-700/50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
            <History className="w-6 h-6 text-blue-400" />
          </div>
          <div className="text-left">
            <h3 className="text-white font-semibold">My Reports</h3>
            <p className="text-gray-400 text-sm">View submitted incidents</p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-500" />
      </button>

      {/* Offline Mode Info */}
      {!isOnline && (
        <div className="mt-6 p-4 rounded-xl bg-slate-800 border border-slate-700">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-white font-medium text-sm">Working Offline</p>
              <p className="text-gray-400 text-xs mt-1">
                You can continue to report incidents. All data is saved securely on your device 
                and will automatically sync when you reconnect to the internet.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HomePage;
