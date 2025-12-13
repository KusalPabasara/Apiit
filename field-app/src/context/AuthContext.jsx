/**
 * Firebase Auth Context for Project Aegis
 * 
 * Hackathon Requirement:
 * "A responder logs in once while online to establish their session.
 * The app must securely cache this session. If the user closes the app 
 * and re-opens it hours later in a dead zone, they must still be logged in."
 * 
 * Firebase Auth handles this automatically with browserLocalPersistence!
 */

import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { firebaseAuth, auth } from '../config/firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Flag to ignore auth state changes during registration
  const isRegistering = useRef(false);

  // Listen for Firebase auth state changes
  // This automatically handles offline persistence!
  useEffect(() => {
    const unsubscribe = firebaseAuth.onAuthStateChanged((firebaseUser) => {
      // Ignore auth changes during registration process
      if (isRegistering.current) {
        return;
      }
      
      if (firebaseUser) {
        // User is signed in
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0],
          photoURL: firebaseUser.photoURL
        });
        console.log('✅ User authenticated:', firebaseUser.displayName || firebaseUser.email);
      } else {
        // User is signed out
        setUser(null);
        console.log('👤 No user authenticated');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Register new responder (does NOT auto-login)
  const register = async (email, password, displayName) => {
    setError(null);
    // Set flag to prevent auth state listener from updating user during registration
    isRegistering.current = true;
    
    try {
      const firebaseUser = await firebaseAuth.register(email, password, displayName);
      // Sign out immediately after registration - user must login manually
      await firebaseAuth.logout();
      // Ensure user state is null
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
      // Reset the flag after registration completes
      isRegistering.current = false;
    }
  };

  // Login function
  const login = async (email, password) => {
    setError(null);
    try {
      const firebaseUser = await firebaseAuth.login(email, password);
      return {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName
      };
    } catch (err) {
      setError(getAuthErrorMessage(err.code));
      throw err;
    }
  };

  // Logout function
  const logout = async () => {
    setError(null);
    try {
      await firebaseAuth.logout();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Check if authenticated (works offline!)
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      error,
      login, 
      logout,
      register,
      isAuthenticated 
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
