import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

const AUTH_STORAGE_KEY = 'aegis_auth';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load auth from localStorage on mount (PERSISTENT AUTH)
  useEffect(() => {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      try {
        const { user, token, expiresAt } = JSON.parse(stored);
        
        // Check if token is expired (7 days)
        if (new Date(expiresAt) > new Date()) {
          setUser(user);
          setToken(token);
          
          // Verify token with server if online (non-blocking)
          if (navigator.onLine) {
            authAPI.verify().catch(() => {
              // Token invalid on server - but keep local session for offline use
              console.log('Token verification failed, keeping local session');
            });
          }
        } else {
          // Token expired, clear storage
          localStorage.removeItem(AUTH_STORAGE_KEY);
        }
      } catch (e) {
        console.error('Failed to parse stored auth:', e);
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    }
    setLoading(false);
  }, []);

  // Login function
  const login = async (username, password) => {
    const response = await authAPI.login(username, password);
    
    const authData = {
      user: response.user,
      token: response.token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
    };
    
    // Store in localStorage for persistent auth
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
    
    setUser(response.user);
    setToken(response.token);
    
    return response.user;
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setUser(null);
    setToken(null);
  };

  // Check if authenticated (works offline!)
  const isAuthenticated = !!user && !!token;

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      loading, 
      login, 
      logout, 
      isAuthenticated 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
