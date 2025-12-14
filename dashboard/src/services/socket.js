import { io } from 'socket.io-client';

// Get Socket URL - In production, use current origin for same-origin WebSocket
const getSocketUrl = () => {
  if (import.meta.env.MODE === 'production') {
    // In production, use empty string for same-origin or window.location.origin
    return typeof window !== 'undefined' ? window.location.origin : '';
  }
  return import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';
};

const SOCKET_URL = getSocketUrl();

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.connectionChangeCallback = null;
  }

  connect() {
    if (this.socket?.connected) {
      console.log('🔌 Already connected to socket');
      return;
    }

    console.log('🔌 Connecting to socket at:', SOCKET_URL || 'same-origin');
    
    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    this.socket.on('connect', () => {
      console.log('🔌 Connected to server, socket ID:', this.socket.id);
      if (this.connectionChangeCallback) {
        this.connectionChangeCallback(true);
      }
    });

    this.socket.on('disconnect', () => {
      console.log('🔌 Disconnected from server');
      if (this.connectionChangeCallback) {
        this.connectionChangeCallback(false);
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('🔌 Connection error:', error.message);
    });

    // Register all event handlers
    this.socket.on('new-incident', (incident) => {
      console.log('📥 New incident received:', incident);
      this.notifyListeners('new-incident', incident);
    });

    this.socket.on('sos-alert', (alert) => {
      console.log('🆘 SOS Alert received via socket:', alert);
      this.notifyListeners('sos-alert', alert);
    });

    this.socket.on('sos-update', (alert) => {
      console.log('🆘 SOS Update received:', alert);
      this.notifyListeners('sos-update', alert);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  onConnectionChange(callback) {
    this.connectionChangeCallback = callback;
  }

  subscribe(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);

    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  notifyListeners(event, data) {
    this.listeners.get(event)?.forEach(callback => callback(data));
  }
}

export const socketService = new SocketService();
export default socketService;
