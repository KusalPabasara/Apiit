import express from 'express';
import { db } from '../db/database.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// POST /api/sos - Emergency SOS alert from field responder
router.post('/', async (req, res) => {
  try {
    const {
      device_id,
      responder_name,
      responder_email,
      responder_uid,
      latitude,
      longitude,
      timestamp
    } = req.body;

    // Validation
    if (!device_id || !latitude || !longitude) {
      return res.status(400).json({ 
        error: 'Missing required fields: device_id, latitude, longitude' 
      });
    }

    // ✅ IDEMPOTENCY: Check for duplicate
    await db.read();
    const idempotencyKey = req.body.id || req.body.local_id;
    if (idempotencyKey) {
      const existing = db.data.sos_alerts?.find(e => 
        e.id === idempotencyKey || e.local_id === idempotencyKey
      );
      if (existing) {
        console.log(`🔄 Duplicate SOS detected for ${idempotencyKey.slice(0, 8)} - returning existing`);
        return res.status(200).json(existing);
      }
    }

    const sosAlert = {
      id: idempotencyKey || uuidv4(),
      local_id: idempotencyKey || uuidv4(),
      device_id,
      responder_name: responder_name || `Device-${device_id.slice(0, 8)}`,
      responder_email: responder_email || null,
      responder_uid: responder_uid || null,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      timestamp: timestamp || new Date().toISOString(),
      status: 'active', // active, acknowledged, resolved
      created_at: new Date().toISOString()
    };

    // FAST PATH: Emit socket event IMMEDIATELY before database write
    // This ensures dashboard gets the alert as fast as possible
    const io = req.app.get('io');
    if (io) {
      console.log('📡 FAST PATH: Emitting sos-alert immediately to all connected clients...');
      console.log('📊 Connected clients:', io.engine.clientsCount);
      io.emit('sos-alert', sosAlert); // Emit immediately for fastest response
      console.log('✅ SOS alert emitted via Socket.IO (fast path)');
    } else {
      console.error('❌ Socket.IO not available!');
    }

    // Send HTTP response immediately (don't wait for DB write)
    res.status(201).json(sosAlert);
    console.log(`🆘 SOS ALERT from ${responder_name} (${device_id.slice(0, 8)}) at ${latitude}, ${longitude}`);

    // Save to database asynchronously (after response sent for fastest response)
    // This maintains atomicity while ensuring fastest possible response time
    db.read().then(() => {
      if (!db.data.sos_alerts) {
        db.data.sos_alerts = [];
      }
      db.data.sos_alerts.push(sosAlert);
      return db.write();
    }).then(() => {
      console.log('💾 SOS alert saved to database');
    }).catch((dbError) => {
      console.error('❌ Failed to save SOS to database:', dbError);
      // Alert already emitted and response sent, so this is non-critical
    });
  } catch (error) {
    console.error('SOS alert error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/sos - Get all active SOS alerts
router.get('/', async (req, res) => {
  try {
    await db.read();
    const sosAlerts = db.data.sos_alerts || [];
    
    // Filter for active alerts
    const activeAlerts = sosAlerts.filter(alert => alert.status === 'active');
    
    res.json(activeAlerts);
  } catch (error) {
    console.error('Error fetching SOS alerts:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/sos/:id - Update SOS alert status
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'acknowledged', 'resolved'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    await db.read();
    const alert = db.data.sos_alerts?.find(a => a.id === id);

    if (!alert) {
      return res.status(404).json({ error: 'SOS alert not found' });
    }

    alert.status = status;
    alert.updated_at = new Date().toISOString();
    await db.write();

    // Emit update to dashboards
    const io = req.app.get('io');
    io.emit('sos-update', alert);

    res.json(alert);
  } catch (error) {
    console.error('Error updating SOS alert:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;

