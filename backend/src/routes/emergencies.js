import express from 'express';
import { db } from '../db/database.js';
import { verifyToken as authenticateToken } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Start emergency (SOS)
router.post('/start', authenticateToken, async (req, res) => {
  try {
    const { latitude, longitude, medicalId, deviceId } = req.body;
    
    const emergency = {
      id: `emer_${uuidv4()}`,
      userId: req.user.id,
      username: req.user.username,
      deviceId,
      status: 'active',
      medicalId: medicalId || null,
      startTime: new Date().toISOString(),
      locations: [{
        latitude,
        longitude,
        timestamp: new Date().toISOString()
      }]
    };
    
    await db.read();
    db.data.emergencies.push(emergency);
    await db.write();
    
    // Emit to dashboard
    const io = req.app.get('io');
    io.emit('emergency-sos', emergency);
    
    res.status(201).json(emergency);
  } catch (error) {
    console.error('Start emergency error:', error);
    res.status(500).json({ error: 'Failed to start emergency' });
  }
});

// Update emergency location
router.post('/:id/location', authenticateToken, async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    
    await db.read();
    const index = db.data.emergencies.findIndex(e => e.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Emergency not found' });
    }
    
    // Add new location to tracking history
    db.data.emergencies[index].locations.push({
      latitude,
      longitude,
      timestamp: new Date().toISOString()
    });
    
    await db.write();
    
    // Emit location update to dashboard
    const io = req.app.get('io');
    io.emit('emergency-location-update', {
      emergencyId: req.params.id,
      latitude,
      longitude,
      timestamp: new Date().toISOString()
    });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update location' });
  }
});

// End emergency
router.post('/:id/end', authenticateToken, async (req, res) => {
  try {
    await db.read();
    const index = db.data.emergencies.findIndex(e => e.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Emergency not found' });
    }
    
    db.data.emergencies[index] = {
      ...db.data.emergencies[index],
      status: 'resolved',
      endTime: new Date().toISOString()
    };
    
    await db.write();
    
    // Emit to dashboard
    const io = req.app.get('io');
    io.emit('emergency-resolved', db.data.emergencies[index]);
    
    res.json(db.data.emergencies[index]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to end emergency' });
  }
});

// Get all active emergencies
router.get('/active', authenticateToken, async (req, res) => {
  try {
    await db.read();
    const activeEmergencies = db.data.emergencies.filter(e => e.status === 'active');
    res.json(activeEmergencies);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch emergencies' });
  }
});

// Get all emergencies
router.get('/', authenticateToken, async (req, res) => {
  try {
    await db.read();
    res.json(db.data.emergencies || []);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch emergencies' });
  }
});

// Get single emergency
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    await db.read();
    const emergency = db.data.emergencies.find(e => e.id === req.params.id);
    if (!emergency) {
      return res.status(404).json({ error: 'Emergency not found' });
    }
    res.json(emergency);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch emergency' });
  }
});

export default router;
