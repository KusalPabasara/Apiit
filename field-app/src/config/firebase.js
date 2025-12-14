/**
 * Firebase Configuration for Project Aegis
 * 
 * Used for:
 * - Responder Authentication (works offline!)
 * - Persistent login sessions
 */

import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  setPersistence, 
  browserLocalPersistence,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD6RshE3bz_F0upY2nCXgI3KAsAsDFDKSc",
  authDomain: "apiit-b5750.firebaseapp.com",
  projectId: "apiit-b5750",
  storageBucket: "apiit-b5750.firebasestorage.app",
  messagingSenderId: "559979269484",
  appId: "1:559979269484:web:b5b947317331e90992b749",
  measurementId: "G-K10MLYCH0F"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Set persistence to LOCAL (survives browser restarts, works offline)
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error('Failed to set auth persistence:', error);
});

// Auth helper functions
export const firebaseAuth = {
  // Get current user
  getCurrentUser: () => auth.currentUser,
  
  // Register new responder
  register: async (email, password, displayName) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    // Update display name
    if (displayName) {
      await updateProfile(userCredential.user, { displayName });
    }
    return userCredential.user;
  },
  
  // Login
  login: async (email, password) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  },
  
  // Logout
  logout: async () => {
    await signOut(auth);
  },
  
  // Listen for auth state changes
  onAuthStateChanged: (callback) => {
    return onAuthStateChanged(auth, callback);
  },
  
  // Check if user is authenticated
  isAuthenticated: () => !!auth.currentUser
};

export { auth };
export default app;

