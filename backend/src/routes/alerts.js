import express from 'express';
import { db } from '../db/database.js';
import { verifyToken as authenticateToken } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Get all alerts
router.get('/', authenticateToken, async (req, res) => {
  try {
    await db.read();
    const alerts = db.data.alerts || [];
    // Sort by creation date, newest first
    res.json(alerts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

// Get active alerts only
router.get('/active', async (req, res) => {
  try {
    await db.read();
    const alerts = db.data.alerts || [];
    const now = new Date();
    
    const activeAlerts = alerts.filter(a => {
      if (a.status === 'cancelled') return false;
      if (a.validUntil && new Date(a.validUntil) < now) return false;
      return true;
    });
    
    res.json(activeAlerts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch active alerts' });
  }
});

// Get alerts by area
router.get('/area/:areaName', async (req, res) => {
  try {
    await db.read();
    const alerts = db.data.alerts || [];
    const areaName = req.params.areaName.toLowerCase();
    
    const areaAlerts = alerts.filter(a => {
      if (a.status === 'cancelled') return false;
      return a.affectedAreas?.some(area => 
        area.toLowerCase().includes(areaName)
      );
    });
    
    res.json(areaAlerts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch area alerts' });
  }
});

// Create alert
router.post('/', authenticateToken, async (req, res) => {
  try {
    const alert = {
      id: `alert_${uuidv4()}`,
      ...req.body,
      createdAt: new Date().toISOString(),
      status: 'active'
    };
    
    await db.read();
    db.data.alerts.push(alert);
    await db.write();
    
    // Emit to dashboard and field apps
    const io = req.app.get('io');
    io.emit('new-alert', alert);
    
    // If downstream alert is triggered, emit special event
    if (alert.triggerDownstreamAlert) {
      io.emit('downstream-alert', {
        alert,
        message: `⚠️ DOWNSTREAM ALERT: ${alert.messageEn}`,
        areas: alert.affectedAreas
      });
    }
    
    res.status(201).json(alert);
  } catch (error) {
    console.error('Create alert error:', error);
    res.status(500).json({ error: 'Failed to create alert' });
  }
});

// Update alert status (cancel, etc.)
router.patch('/:id', authenticateToken, async (req, res) => {
  try {
    await db.read();
    const index = db.data.alerts.findIndex(a => a.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    
    db.data.alerts[index] = {
      ...db.data.alerts[index],
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    
    await db.write();
    
    // Emit to all clients
    const io = req.app.get('io');
    io.emit('update-alert', db.data.alerts[index]);
    
    res.json(db.data.alerts[index]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update alert' });
  }
});

// Delete alert
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await db.read();
    const index = db.data.alerts.findIndex(a => a.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    
    db.data.alerts.splice(index, 1);
    await db.write();
    
    // Emit to all clients
    const io = req.app.get('io');
    io.emit('delete-alert', req.params.id);
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete alert' });
  }
});

export default router;
