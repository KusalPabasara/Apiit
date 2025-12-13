import { Wifi, WifiOff, RefreshCw, Cloud, CloudOff } from 'lucide-react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

function StatusBar() {
  const { isOnline, networkQuality } = useNetworkStatus();

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 px-4 py-2 flex items-center justify-between text-sm ${
      isOnline ? 'bg-base-200' : 'bg-error/80'
    }`}>
      {/* Connection Status */}
      <div className="flex items-center gap-2">
        {isOnline ? (
          <>
            <Wifi className="w-4 h-4 text-success" />
            <span className="text-success">
              Online
              {networkQuality !== 'unknown' && ` (${networkQuality})`}
            </span>
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4 text-error-content" />
            <span className="text-error-content">Offline Mode</span>
          </>
        )}
      </div>

      {/* Network Quality Indicator */}
      <div className="flex items-center gap-1">
        <div className={`w-2 h-2 rounded-full ${
          !isOnline ? 'bg-error' :
          networkQuality === 'good' ? 'bg-success' :
          networkQuality === 'moderate' ? 'bg-warning' :
          'bg-error'
        }`} />
        <div className={`w-2 h-3 rounded-full ${
          !isOnline ? 'bg-base-content/20' :
          networkQuality === 'good' ? 'bg-success' :
          networkQuality === 'moderate' ? 'bg-warning' :
          'bg-base-content/20'
        }`} />
        <div className={`w-2 h-4 rounded-full ${
          !isOnline || networkQuality !== 'good' ? 'bg-base-content/20' : 'bg-success'
        }`} />
      </div>
    </div>
  );
}

export default StatusBar;
