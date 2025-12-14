import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import authRoutes from './routes/auth.js';
import incidentRoutes from './routes/incidents.js';
import reliefCampRoutes from './routes/relief-camps.js';
import rescueMissionRoutes from './routes/rescue-missions.js';
import alertRoutes from './routes/alerts.js';
import emergencyRoutes from './routes/emergencies.js';
import sosRoutes from './routes/sos.js';
import supplyRequestRoutes from './routes/supply-requests.js';
import trappedCiviliansRoutes from './routes/trapped-civilians.js';
import blockedRoadsRoutes from './routes/blocked-roads.js';
import { initDB } from './db/database.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:5173', 
      'http://localhost:5174', 
      'http://152.42.185.253:5173', 
      'http://152.42.185.253:5174',
      'http://152.42.185.253',
      'http://152.42.185.253:80',
      'http://152.42.185.253:3001'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
  }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static('uploads'));

// Make io available to routes
app.set('io', io);

// Initialize database
await initDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/relief-camps', reliefCampRoutes);
app.use('/api/rescue-missions', rescueMissionRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/sos', sosRoutes);
app.use('/api/supply-requests', supplyRequestRoutes);
app.use('/api/trapped-civilians', trappedCiviliansRoutes);
app.use('/api/blocked-roads', blockedRoadsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  // Join room based on user type
  socket.on('join-room', (room) => {
    socket.join(room);
    console.log(`Socket ${socket.id} joined room: ${room}`);
  });
  
  // Field responder location updates
  socket.on('responder-location', (data) => {
    // Broadcast to dashboard
    io.to('dashboard').emit('responder-location-update', data);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Project Aegis Backend running on http://localhost:${PORT}`);
  console.log(`📡 Also accessible at http://152.42.185.253:${PORT}`);
});
