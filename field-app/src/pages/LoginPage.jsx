/**
 * LOGIN PAGE - Firebase Authentication with Offline Persistence
 * 
 * Hackathon Requirement:
 * "A responder logs in once while online (e.g., at HQ before deployment)
 * to establish their session. The app must securely cache this session. 
 * If the user closes the app completely and re-opens it hours later in 
 * a dead zone, they must still be logged in and ready to file a report."
 * 
 * Firebase Auth handles this automatically with browserLocalPersistence!
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, User, Lock, AlertCircle, Wifi, WifiOff, Loader2, 
  Mail, Eye, EyeOff, UserPlus, LogIn, CheckCircle 
} from 'lucide-react';
import { useAuth } from '../context/AuthContextV2';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

function LoginPage() {
  const navigate = useNavigate();
  const { login, register, isAuthenticated, error: authError } = useAuth();
  const { isOnline } = useNetworkStatus();
  
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Auto-hide success message after 3 seconds
  useEffect(() => {
    if (registrationSuccess) {
      const timer = setTimeout(() => {
        setRegistrationSuccess(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [registrationSuccess]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setRegistrationSuccess(false);
    
    if (!isOnline) {
      setError('You need internet connection to login/register. Connect at HQ before deployment.');
      return;
    }

    if (!email.trim() || !password.trim()) {
      setError('Please enter email and password');
      return;
    }

    if (isRegisterMode && !displayName.trim()) {
      setError('Please enter your name');
      return;
    }
    
    setLoading(true);
    
    try {
      if (isRegisterMode) {
        // Register the user
        await register(email.trim(), password, displayName.trim());
        // Show success message and switch to login mode
        setRegisteredEmail(email.trim());
        setRegistrationSuccess(true);
        setIsRegisterMode(false);
        // Clear form but keep email for convenience
        setPassword('');
        setDisplayName('');
      } else {
        // Login
        await login(email.trim(), password);
        navigate('/', { replace: true });
      }
    } catch (err) {
      // Error is already set by AuthContext
      setError(authError || err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsRegisterMode(!isRegisterMode);
    setError('');
    setRegistrationSuccess(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Logo & Title */}
      <div className="text-center mb-8">
        <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-2xl">
          <Shield className="w-14 h-14 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Project Aegis</h1>
        <p className="text-gray-400">Field Responder App</p>
        <p className="text-blue-400 text-sm mt-2">
          {isRegisterMode ? 'Create your account' : 'Sign in to continue'}
        </p>
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
            <span className="text-sm text-emerald-400 font-medium">
              Online - Ready to {isRegisterMode ? 'register' : 'login'}
            </span>
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4 text-amber-400" />
            <span className="text-sm text-amber-400 font-medium">
              Offline - {isRegisterMode ? 'Registration' : 'Login'} requires internet
            </span>
          </>
        )}
      </div>

      {/* Auth Form */}
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        {/* Registration Success Message */}
        {registrationSuccess && (
          <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-emerald-300 font-medium">Registration Successful! 🎉</p>
              <p className="text-emerald-400/80 text-sm mt-1">
                Your account has been created. Please sign in with your credentials.
              </p>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="p-4 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <span className="text-red-300 text-sm">{error}</span>
          </div>
        )}

        {/* Display Name (Register only) */}
        {isRegisterMode && (
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Full Name
            </label>
            <div className="input-wrapper">
              <User className="input-icon-left w-5 h-5" />
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your full name"
                className="input-aegis has-icon-left"
                disabled={!isOnline || loading}
                autoComplete="name"
              />
            </div>
          </div>
        )}

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Email
          </label>
          <div className="input-wrapper">
            <Mail className="input-icon-left w-5 h-5" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="responder@aegis.lk"
              className="input-aegis has-icon-left"
              disabled={!isOnline || loading}
              autoComplete="email"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Password
          </label>
          <div className="input-wrapper">
            <Lock className="input-icon-left w-5 h-5" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isRegisterMode ? 'Create password (6+ chars)' : 'Enter password'}
              className="input-aegis has-icon-left has-icon-right"
              disabled={!isOnline || loading}
              autoComplete={isRegisterMode ? 'new-password' : 'current-password'}
              minLength={6}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="input-icon-right"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !isOnline}
          className="btn-aegis btn-primary-aegis w-full mt-6 py-4"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>{isRegisterMode ? 'Creating Account...' : 'Signing in...'}</span>
            </>
          ) : isRegisterMode ? (
            <>
              <UserPlus className="w-5 h-5" />
              <span>Create Account</span>
            </>
          ) : (
            <>
              <LogIn className="w-5 h-5" />
              <span>Sign In</span>
            </>
          )}
        </button>
      </form>

      {/* Toggle Login/Register */}
      <div className="mt-6 text-center">
        <p className="text-gray-400 text-sm">
          {isRegisterMode ? 'Already have an account?' : "Don't have an account?"}
        </p>
        <button
          onClick={toggleMode}
          className="text-blue-400 font-medium mt-1 hover:text-blue-300 transition-colors"
        >
          {isRegisterMode ? 'Sign In' : 'Create Account'}
        </button>
      </div>

      {/* Offline Info */}
      {!isOnline && (
        <div className="mt-6 p-4 rounded-xl bg-slate-800 border border-slate-700 w-full max-w-sm">
          <p className="text-amber-400 text-sm text-center">
            ⚠️ {isRegisterMode ? 'Registration' : 'Login'} requires internet. 
            Connect at HQ before deployment.
          </p>
        </div>
      )}

      {/* Persistent auth info */}
      <div className="mt-6 p-4 rounded-xl bg-slate-800/50 border border-slate-700 w-full max-w-sm">
        <p className="text-gray-300 text-sm font-medium mb-1">📱 Offline-First App</p>
        <p className="text-xs text-gray-500">
          Login once while online. After that, you can use the app completely offline. 
          Your session stays active even without internet.
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
