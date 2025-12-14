/**
 * PERSISTENT OFFLINE AUTHENTICATION LAYER
 * 
 * Critical Requirements:
 * - User logs in ONCE while online
 * - App refresh/close/kill while OFFLINE must NOT log user out
 * - Login screen NEVER appears if cached session exists
 * - Firebase tokens are cached locally
 * - Offline mode trusts cached credentials
 * 
 * Architecture:
 * 1. Firebase Auth establishes identity (online only)
 * 2. Session data cached in IndexedDB (uid, token, expiry)
 * 3. Offline auth state machine:
 *    - UNAUTHENTICATED: No cached session
 *    - ONLINE_AUTHENTICATED: Firebase + cached session
 *    - OFFLINE_AUTHENTICATED: Cached session only (trusted)
 * 4. Token refresh happens silently when online
 * 5. Offline mode NEVER calls Firebase
 */

import { db } from '../db/database';

// Auth State Machine
export const AUTH_STATE = {
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  ONLINE_AUTHENTICATED: 'ONLINE_AUTHENTICATED',
  OFFLINE_AUTHENTICATED: 'OFFLINE_AUTHENTICATED',
  VALIDATING: 'VALIDATING'
};

/**
 * Offline Session Schema (stored in IndexedDB)
 */
class OfflineAuthSession {
  constructor() {
    this.SESSION_KEY = 'auth_session';
  }

  /**
   * Save authenticated session to IndexedDB
   * Called after successful Firebase login
   * 
   * @param {Object} sessionData
   * @param {string} sessionData.uid - Firebase user ID
   * @param {string} sessionData.email - User email
   * @param {string} sessionData.displayName - User display name
   * @param {string} sessionData.idToken - Firebase ID token (JWT)
   * @param {number} sessionData.expiresAt - Token expiration timestamp
   * @param {string} sessionData.refreshToken - Firebase refresh token
   */
  async saveSession(sessionData) {
    const session = {
      uid: sessionData.uid,
      email: sessionData.email,
      displayName: sessionData.displayName,
      photoURL: sessionData.photoURL || null,
      idToken: sessionData.idToken,
      refreshToken: sessionData.refreshToken || null,
      expiresAt: sessionData.expiresAt,
      role: sessionData.role || 'responder',
      lastOnlineAt: new Date().toISOString(),
      createdAt: sessionData.createdAt || new Date().toISOString()
    };

    // Store in IndexedDB (survives app kill/restart)
    await db.settings.put({
      key: this.SESSION_KEY,
      value: JSON.stringify(session)
    });

    console.log('💾 Offline auth session saved to IndexedDB');
    console.log('👤 User:', session.email, '| UID:', session.uid.slice(0, 8));
    return session;
  }

  /**
   * Restore session from IndexedDB
   * Called on app startup BEFORE rendering UI
   * 
   * @returns {Promise<Object|null>} Cached session or null
   */
  async restoreSession() {
    try {
      const record = await db.settings.get(this.SESSION_KEY);
      
      if (!record || !record.value) {
        console.log('🔍 No cached auth session found');
        return null;
      }

      const session = JSON.parse(record.value);
      
      // Validate session structure
      if (!session.uid || !session.email) {
        console.warn('⚠️ Invalid session structure, clearing');
        await this.clearSession();
        return null;
      }

      console.log('✅ Cached auth session restored from IndexedDB');
      console.log('👤 User:', session.email, '| Offline since:', session.lastOnlineAt);
      
      return session;
    } catch (error) {
      console.error('❌ Failed to restore session:', error);
      return null;
    }
  }

  /**
   * Update last online timestamp
   * Called when connectivity is restored
   */
  async updateLastOnline(session) {
    if (!session) return;
    
    session.lastOnlineAt = new Date().toISOString();
    
    await db.settings.put({
      key: this.SESSION_KEY,
      value: JSON.stringify(session)
    });
    
    console.log('🔄 Session last online timestamp updated');
  }

  /**
   * Update token after refresh
   * Called when Firebase refreshes the token online
   */
  async updateToken(newToken, expiresAt) {
    const session = await this.restoreSession();
    
    if (!session) {
      console.warn('⚠️ No session to update token');
      return false;
    }

    session.idToken = newToken;
    session.expiresAt = expiresAt;
    session.lastOnlineAt = new Date().toISOString();

    await db.settings.put({
      key: this.SESSION_KEY,
      value: JSON.stringify(session)
    });

    console.log('🔄 Token refreshed and cached');
    return true;
  }

  /**
   * Clear session (logout)
   * Only called when user explicitly logs out
   */
  async clearSession() {
    await db.settings.delete(this.SESSION_KEY);
    console.log('🗑️ Auth session cleared');
  }

  /**
   * Check if token is expired
   * NOTE: In offline mode, we TRUST expired tokens
   */
  isTokenExpired(session) {
    if (!session || !session.expiresAt) return true;
    return Date.now() > session.expiresAt;
  }

  /**
   * Offline auth guard
   * Returns auth state based on network and cached session
   * 
   * CRITICAL RULES:
   * - If OFFLINE + cached session exists → OFFLINE_AUTHENTICATED (trusted)
   * - Token expiration is IGNORED while offline
   * - User stays logged in regardless of token expiry
   */
  async getAuthState() {
    const isOnline = navigator.onLine;
    const session = await this.restoreSession();

    // No cached session → user must login
    if (!session) {
      return {
        state: AUTH_STATE.UNAUTHENTICATED,
        session: null,
        requiresLogin: true
      };
    }

    // OFFLINE MODE: Trust cached session (ignore token expiry)
    if (!isOnline) {
      console.log('📴 OFFLINE MODE: Using cached session (offline authenticated)');
      return {
        state: AUTH_STATE.OFFLINE_AUTHENTICATED,
        session,
        requiresLogin: false,
        message: 'Operating in offline mode with cached credentials'
      };
    }

    // ONLINE MODE: Session exists, proceed with Firebase validation
    return {
      state: AUTH_STATE.ONLINE_AUTHENTICATED,
      session,
      requiresLogin: false,
      message: 'Online authenticated, token will be refreshed if needed'
    };
  }
}

// Singleton instance
export const offlineAuthSession = new OfflineAuthSession();

/**
 * Network Connectivity Manager
 * Handles online/offline transitions
 */
class ConnectivityManager {
  constructor() {
    this.listeners = new Set();
    this.isOnline = navigator.onLine;
    
    // Listen for connectivity changes
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
  }

  handleOnline() {
    console.log('📶 Network restored - entering ONLINE mode');
    this.isOnline = true;
    this.notifyListeners('online');
  }

  handleOffline() {
    console.log('📴 Network lost - entering OFFLINE mode');
    this.isOnline = false;
    this.notifyListeners('offline');
  }

  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notifyListeners(event) {
    this.listeners.forEach(callback => callback(event));
  }

  getStatus() {
    return this.isOnline;
  }
}

export const connectivityManager = new ConnectivityManager();

/**
 * Helper to extract token from Firebase user
 * Called after successful Firebase authentication
 */
export async function extractFirebaseSession(firebaseUser) {
  if (!firebaseUser) return null;

  try {
    // Get ID token (JWT) from Firebase
    const idToken = await firebaseUser.getIdToken(false);
    const tokenResult = await firebaseUser.getIdTokenResult();
    
    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0],
      photoURL: firebaseUser.photoURL,
      idToken: idToken,
      refreshToken: firebaseUser.refreshToken,
      expiresAt: new Date(tokenResult.expirationTime).getTime(),
      role: tokenResult.claims.role || 'responder',
      createdAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('❌ Failed to extract Firebase session:', error);
    return null;
  }
}

/**
 * Refresh Firebase token silently when online
 * Called periodically or on connectivity restore
 */
export async function refreshTokenOnline(firebaseAuth) {
  // NEVER call Firebase while offline
  if (!navigator.onLine) {
    console.log('📴 Offline - skipping token refresh');
    return false;
  }

  try {
    const currentUser = firebaseAuth.currentUser;
    
    if (!currentUser) {
      console.warn('⚠️ No Firebase user to refresh token');
      return false;
    }

    // Force refresh token from Firebase
    const newToken = await currentUser.getIdToken(true);
    const tokenResult = await currentUser.getIdTokenResult();
    const expiresAt = new Date(tokenResult.expirationTime).getTime();

    // Update cached token in IndexedDB
    await offlineAuthSession.updateToken(newToken, expiresAt);
    
    console.log('✅ Token refreshed successfully');
    return true;
  } catch (error) {
    console.error('❌ Token refresh failed:', error);
    
    // If refresh fails while online, user must re-login
    if (navigator.onLine) {
      console.warn('🚨 Token refresh failed while online - requires re-authentication');
      await offlineAuthSession.clearSession();
      return false;
    }
    
    return false;
  }
}

export default offlineAuthSession;

