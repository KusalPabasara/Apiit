/**
 * ENHANCED AUTH CONTEXT WITH PERSISTENT OFFLINE AUTHENTICATION
 * 
 * Critical Requirements Met:
 * ✅ User logs in ONCE while online
 * ✅ App restart/refresh while OFFLINE does NOT log user out
 * ✅ Login screen NEVER appears if cached session exists
 * ✅ Operates for hours in dead zone with no connectivity
 * ✅ Token refresh happens silently when online
 * 
 * Auth State Machine:
 * - UNAUTHENTICATED: No cached session, show login
 * - ONLINE_AUTHENTICATED: Firebase + cached session active
 * - OFFLINE_AUTHENTICATED: Cached session only (Firebase unavailable)
 * 
 * Critical Flow:
 * 1. App starts → Load cached session from IndexedDB FIRST
 * 2. If cached session exists → User is authenticated (even offline)
 * 3. If online → Firebase validates in background
 * 4. If offline → Trust cached session completely
 */

import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { firebaseAuth, auth } from '../config/firebase';
import { 
  offlineAuthSession, 
  AUTH_STATE, 
  extractFirebaseSession,
  refreshTokenOnline,
  connectivityManager
} from '../services/offlineAuth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Auth state
  const [user, setUser] = useState(null);
  const [authState, setAuthState] = useState(AUTH_STATE.VALIDATING);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Flags
  const isRegistering = useRef(false);
  const isInitialized = useRef(false);
  const tokenRefreshInterval = useRef(null);

  /**
   * CRITICAL: Initialize auth on app startup
   * This runs BEFORE rendering any UI
   * Loads cached session from IndexedDB
   */
  useEffect(() => {
    const initializeAuth = async () => {
      console.log('🔐 Initializing authentication...');
      
      try {
        // STEP 1: Check for cached session in IndexedDB
        const authStateResult = await offlineAuthSession.getAuthState();
        
        console.log('📊 Auth state:', authStateResult.state);
        
        if (authStateResult.state === AUTH_STATE.UNAUTHENTICATED) {
          // No cached session → user must login
          console.log('🚪 No cached session - login required');
          setAuthState(AUTH_STATE.UNAUTHENTICATED);
          setUser(null);
          setLoading(false);
          return;
        }

        // STEP 2: Cached session exists → User is authenticated!
        const cachedSession = authStateResult.session;
        
        // Set user from cached session IMMEDIATELY
        // This ensures user stays logged in even if offline
        setUser({
          uid: cachedSession.uid,
          email: cachedSession.email,
          displayName: cachedSession.displayName,
          photoURL: cachedSession.photoURL
        });
        
        setAuthState(authStateResult.state);
        setLoading(false);
        
        console.log('✅ Authenticated from cached session');
        console.log('👤 User:', cachedSession.email);
        console.log('📡 Mode:', authStateResult.state);

        // STEP 3: If online, validate with Firebase in background
        // This happens AFTER user is already authenticated
        if (authStateResult.state === AUTH_STATE.ONLINE_AUTHENTICATED) {
          validateFirebaseSession(cachedSession);
        }

        isInitialized.current = true;

      } catch (err) {
        console.error('❌ Auth initialization failed:', err);
        setAuthState(AUTH_STATE.UNAUTHENTICATED);
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  /**
   * Validate Firebase session in background (online only)
   * Does NOT block user interface
   * If validation fails, user can still use cached session
   */
  const validateFirebaseSession = async (cachedSession) => {
    if (!navigator.onLine) {
      console.log('📴 Offline - skipping Firebase validation');
      return;
    }

    try {
      // Listen for Firebase auth state
      const unsubscribe = firebaseAuth.onAuthStateChanged(async (firebaseUser) => {
        if (firebaseUser) {
          // Firebase confirms user is authenticated
          console.log('✅ Firebase validation successful');
          
          // Extract fresh token and update cache
          const freshSession = await extractFirebaseSession(firebaseUser);
          if (freshSession) {
            await offlineAuthSession.saveSession(freshSession);
            setAuthState(AUTH_STATE.ONLINE_AUTHENTICATED);
          }
          
          // Start token refresh interval
          startTokenRefreshInterval();
        } else {
          // Firebase says no user, but we have cached session
          // Trust cached session (user might be offline or token expired)
          console.log('⚠️ Firebase no user, but cached session exists - trusting cache');
          setAuthState(AUTH_STATE.OFFLINE_AUTHENTICATED);
        }
        
        unsubscribe();
      });

    } catch (err) {
      console.error('⚠️ Firebase validation failed:', err);
      // Keep cached session active even if Firebase fails
      setAuthState(AUTH_STATE.OFFLINE_AUTHENTICATED);
    }
  };

  /**
   * Start token refresh interval (online only)
   * Refreshes token every 50 minutes (before 1 hour expiry)
   */
  const startTokenRefreshInterval = () => {
    // Clear existing interval
    if (tokenRefreshInterval.current) {
      clearInterval(tokenRefreshInterval.current);
    }

    // Refresh every 50 minutes
    tokenRefreshInterval.current = setInterval(async () => {
      if (navigator.onLine) {
        console.log('🔄 Refreshing auth token...');
        await refreshTokenOnline(auth);
      }
    }, 50 * 60 * 1000); // 50 minutes
  };

  /**
   * Handle connectivity changes
   * When online → refresh token
   * When offline → trust cached session
   */
  useEffect(() => {
    const handleConnectivity = async (status) => {
      if (status === 'online' && user) {
        console.log('📶 Network restored - refreshing auth token');
        const success = await refreshTokenOnline(auth);
        
        if (success) {
          setAuthState(AUTH_STATE.ONLINE_AUTHENTICATED);
          await offlineAuthSession.updateLastOnline(user);
        } else {
          // Token refresh failed - keep offline mode
          setAuthState(AUTH_STATE.OFFLINE_AUTHENTICATED);
        }
      } else if (status === 'offline' && user) {
        console.log('📴 Network lost - entering offline authenticated mode');
        setAuthState(AUTH_STATE.OFFLINE_AUTHENTICATED);
      }
    };

    return connectivityManager.addListener(handleConnectivity);
  }, [user]);

  /**
   * Register new responder (requires online)
   */
  const register = async (email, password, displayName) => {
    if (!navigator.onLine) {
      throw new Error('Registration requires internet connection');
    }

    setError(null);
    isRegistering.current = true;
    
    try {
      const firebaseUser = await firebaseAuth.register(email, password, displayName);
      
      // Do NOT save session or login user
      // User must explicitly login after registration
      await firebaseAuth.logout();
      setUser(null);
      
      return {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        success: true
      };
    } catch (err) {
      setError(getAuthErrorMessage(err.code));
      throw err;
    } finally {
      isRegistering.current = false;
    }
  };

  /**
   * Login (requires online for first login)
   * After successful login, session is cached for offline use
   */
  const login = async (email, password) => {
    if (!navigator.onLine) {
      throw new Error('First login requires internet connection. After logging in once, you can work offline.');
    }

    setError(null);
    setLoading(true);
    
    try {
      // Authenticate with Firebase
      const firebaseUser = await firebaseAuth.login(email, password);
      
      // Extract and cache session data
      const sessionData = await extractFirebaseSession(firebaseUser);
      
      if (!sessionData) {
        throw new Error('Failed to extract session data');
      }

      // Save to IndexedDB for offline persistence
      await offlineAuthSession.saveSession(sessionData);
      
      // Set user state
      setUser({
        uid: sessionData.uid,
        email: sessionData.email,
        displayName: sessionData.displayName,
        photoURL: sessionData.photoURL
      });
      
      setAuthState(AUTH_STATE.ONLINE_AUTHENTICATED);
      
      // Start token refresh
      startTokenRefreshInterval();
      
      console.log('✅ Login successful - session cached for offline use');
      
      return {
        uid: sessionData.uid,
        email: sessionData.email,
        displayName: sessionData.displayName
      };
    } catch (err) {
      setError(getAuthErrorMessage(err.code));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Logout
   * Clears cached session and Firebase session
   */
  const logout = async () => {
    setError(null);
    
    try {
      // Clear token refresh interval
      if (tokenRefreshInterval.current) {
        clearInterval(tokenRefreshInterval.current);
      }

      // Clear cached session
      await offlineAuthSession.clearSession();
      
      // Sign out from Firebase (if online)
      if (navigator.onLine) {
        try {
          await firebaseAuth.logout();
        } catch (err) {
          console.warn('Firebase logout failed (might be offline):', err);
        }
      }
      
      setUser(null);
      setAuthState(AUTH_STATE.UNAUTHENTICATED);
      
      console.log('👋 Logged out - session cleared');
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  /**
   * Get auth token for API calls
   * Returns cached token (works offline)
   */
  const getAuthToken = async () => {
    const cachedSession = await offlineAuthSession.restoreSession();
    return cachedSession?.idToken || null;
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (tokenRefreshInterval.current) {
        clearInterval(tokenRefreshInterval.current);
      }
    };
  }, []);

  // Check if authenticated (works offline!)
  const isAuthenticated = !!user;
  
  // Check if operating in offline mode
  const isOfflineMode = authState === AUTH_STATE.OFFLINE_AUTHENTICATED;

  return (
    <AuthContext.Provider value={{ 
      user, 
      authState,
      loading, 
      error,
      login, 
      logout,
      register,
      getAuthToken,
      isAuthenticated,
      isOfflineMode
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// Helper to get user-friendly error messages
function getAuthErrorMessage(code) {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'This email is already registered. Please login instead.';
    case 'auth/invalid-email':
      return 'Invalid email address.';
    case 'auth/operation-not-allowed':
      return 'Email/password accounts are not enabled.';
    case 'auth/weak-password':
      return 'Password is too weak. Use at least 6 characters.';
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    case 'auth/user-not-found':
      return 'No account found with this email.';
    case 'auth/wrong-password':
      return 'Incorrect password.';
    case 'auth/invalid-credential':
      return 'Invalid email or password.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection.';
    default:
      return 'Authentication error. Please try again.';
  }
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;

