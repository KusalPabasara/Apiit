import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/database.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Get all incidents (for dashboard - requires auth)
router.get('/', verifyToken, async (req, res) => {
  try {
    await db.read();
    const incidents = [...db.data.incidents].sort((a, b) => 
      new Date(b.created_at) - new Date(a.created_at)
    );
    res.json(incidents);
  } catch (error) {
    console.error('Get incidents error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get incidents by type
router.get('/type/:type', verifyToken, async (req, res) => {
  try {
    await db.read();
    const incidents = db.data.incidents
      .filter(i => i.incident_type === req.params.type)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    res.json(incidents);
  } catch (error) {
    console.error('Get incidents by type error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================
// DEVICE-BASED INCIDENT SUBMISSION (NO AUTH!)
// ============================================
// This endpoint allows field devices to submit incidents
// using only their UUID - no login required!
router.post('/device', async (req, res) => {
  try {
    const {
      local_id,
      incident_type,
      severity,
      latitude,
      longitude,
      description,
      photo,
      created_at,
      device_id,
      responder_name,
      responder_email,
      responder_uid
    } = req.body;

    // Validate required fields
    if (!device_id) {
      return res.status(400).json({ error: 'Device ID required' });
    }
    if (!incident_type) {
      return res.status(400).json({ error: 'Incident type required' });
    }
    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'GPS coordinates required' });
    }

    const incident = {
      id: uuidv4(),
      local_id: local_id || uuidv4(),
      incident_type: incident_type?.toLowerCase(),
      severity: severity || 3,
      latitude,
      longitude,
      description: description || '',
      photo: photo || null,
      device_id,
      responder_name: responder_name || `Device-${device_id.slice(0, 8)}`,
      responder_email: responder_email || null,
      responder_uid: responder_uid || null,
      created_at: created_at || new Date().toISOString(),
      synced_at: new Date().toISOString()
    };

    await db.read();
    db.data.incidents.push(incident);
    await db.write();

    // Emit to all connected dashboards
    const io = req.app.get('io');
    io.emit('new-incident', incident);

    console.log(`📍 New incident from device ${device_id.slice(0, 8)}: ${incident_type}`);

    res.status(201).json(incident);
  } catch (error) {
    console.error('Device incident error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new incident (authenticated - for backward compatibility)
router.post('/', verifyToken, async (req, res) => {
  try {
    const {
      local_id,
      incident_type,
      severity,
      latitude,
      longitude,
      description,
      photo,
      created_at
    } = req.body;

    const incident = {
      id: uuidv4(),
      local_id: local_id || uuidv4(),
      incident_type,
      severity,
      latitude,
      longitude,
      description: description || '',
      photo: photo || null,
      responder_id: req.user.id,
      responder_name: req.user.full_name,
      created_at: created_at || new Date().toISOString(),
      synced_at: new Date().toISOString()
    };

    await db.read();
    db.data.incidents.push(incident);
    await db.write();

    // Emit to all connected dashboards
    const io = req.app.get('io');
    io.emit('new-incident', incident);

    res.status(201).json(incident);
  } catch (error) {
    console.error('Create incident error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Bulk sync incidents (for offline sync)
router.post('/sync', verifyToken, async (req, res) => {
  try {
    const { incidents } = req.body;
    
    if (!Array.isArray(incidents)) {
      return res.status(400).json({ error: 'Incidents must be an array' });
    }

    await db.read();
    const io = req.app.get('io');
    const syncedIncidents = [];

    for (const incident of incidents) {
      const newIncident = {
        id: uuidv4(),
        local_id: incident.local_id || uuidv4(),
        incident_type: incident.incident_type,
        severity: incident.severity,
        latitude: incident.latitude,
        longitude: incident.longitude,
        description: incident.description || '',
        photo: incident.photo || null,
        responder_id: req.user.id,
        responder_name: req.user.full_name,
        created_at: incident.created_at,
        synced_at: new Date().toISOString()
      };

      db.data.incidents.push(newIncident);
      syncedIncidents.push(newIncident);
      
      // Emit each incident to dashboard
      io.emit('new-incident', newIncident);
    }

    await db.write();

    res.json({ 
      success: true, 
      synced: syncedIncidents.length,
      incidents: syncedIncidents 
    });
  } catch (error) {
    console.error('Sync incidents error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get incident statistics
router.get('/stats', verifyToken, async (req, res) => {
  try {
    await db.read();
    const incidents = db.data.incidents;
    
    const total = incidents.length;
    
    // Group by type
    const byType = Object.entries(
      incidents.reduce((acc, i) => {
        acc[i.incident_type] = (acc[i.incident_type] || 0) + 1;
        return acc;
      }, {})
    ).map(([incident_type, count]) => ({ incident_type, count }));
    
    // Group by severity
    const bySeverity = Object.entries(
      incidents.reduce((acc, i) => {
        acc[i.severity] = (acc[i.severity] || 0) + 1;
        return acc;
      }, {})
    ).map(([severity, count]) => ({ severity: parseInt(severity), count }))
     .sort((a, b) => a.severity - b.severity);

    // Recent incidents
    const recent = [...incidents]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 10);

    res.json({
      total,
      byType,
      bySeverity,
      recent
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
