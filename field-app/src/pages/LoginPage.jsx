/**
 * LOGIN PAGE - Persistent Offline Authentication
 * 
 * Hackathon Requirement:
 * "A responder logs in once while online (e.g., at HQ before deployment)
 * to establish their session. The app must securely cache this session. 
 * If the user closes the app completely and re-opens it hours later in 
 * a dead zone, they must still be logged in and ready to file a report."
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, User, Lock, AlertCircle, Wifi, WifiOff, Loader2 } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Track online status
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

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isOnline) {
      setError('You must be online to login. Connect to the internet at HQ before deployment.');
      return;
    }

    if (!username.trim() || !password.trim()) {
      setError('Please enter username and password');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await login(username.trim(), password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: 'var(--gradient-dark)' }}>
      {/* Logo & Title */}
      <div className="text-center mb-8">
        <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-2xl">
          <Shield className="w-14 h-14 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Project Aegis</h1>
        <p className="text-gray-400">Field Responder App</p>
      </div>

      {/* Connection Status */}
      <div className={`flex items-center gap-2 mb-6 px-5 py-3 rounded-xl ${
        isOnline 
          ? 'bg-emerald-500/20 border border-emerald-500/30' 
          : 'bg-amber-500/20 border border-amber-500/30'
      }`}>
        {isOnline ? (
          <>
            <Wifi className="w-4 h-4 text-emerald-400" />
            <span className="text-sm text-emerald-400 font-medium">Online - Ready to login</span>
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4 text-amber-400" />
            <span className="text-sm text-amber-400 font-medium">Offline - Login requires internet</span>
          </>
        )}
      </div>

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-5">
        {/* Error message */}
        {error && (
          <div className="p-4 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <span className="text-red-300 text-sm">{error}</span>
          </div>
        )}

        {/* Username */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Username
          </label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              className="input-aegis pl-12"
              disabled={!isOnline || loading}
              autoComplete="username"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="input-aegis pl-12"
              disabled={!isOnline || loading}
              autoComplete="current-password"
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !isOnline}
          className="btn-aegis btn-primary-aegis w-full mt-4"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Signing in...</span>
            </>
          ) : (
            <span>Sign In</span>
          )}
        </button>
      </form>

      {/* Demo Credentials */}
      <div className="mt-8 p-4 rounded-xl bg-slate-800/50 border border-slate-700 w-full max-w-sm">
        <p className="text-xs text-gray-500 mb-2 text-center">Demo Credentials</p>
        <div className="text-center text-sm">
          <p className="text-gray-400">
            <span className="text-gray-500">Username:</span>
            <span className="text-blue-400 font-mono ml-2">responder1</span>
          </p>
          <p className="text-gray-400">
            <span className="text-gray-500">Password:</span>
            <span className="text-blue-400 font-mono ml-2">responder123</span>
          </p>
        </div>
      </div>

      {/* Offline Info */}
      {!isOnline && (
        <div className="mt-6 p-4 rounded-xl bg-slate-800 border border-slate-700 w-full max-w-sm">
          <p className="text-amber-400 text-sm text-center">
            ⚠️ Login requires an internet connection. Please connect at HQ before deployment to the field.
          </p>
        </div>
      )}

      {/* Persistent auth info */}
      <p className="mt-6 text-xs text-gray-500 text-center max-w-sm">
        Once logged in, you'll stay authenticated even when offline. Your session is securely cached on this device.
      </p>
    </div>
  );
}

export default LoginPage;
