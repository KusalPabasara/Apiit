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
      voice_note,
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
    
    // ✅ IDEMPOTENCY CHECK: Check for duplicate local_id BEFORE processing
    await db.read();
    if (local_id) {
      const existingIncident = db.data.incidents.find(i => i.local_id === local_id);
      if (existingIncident) {
        console.log(`🔄 Duplicate detected for local_id ${local_id.slice(0, 8)} - returning existing record`);
        // Return 200 OK with existing record (idempotent - safe to retry)
        return res.status(200).json(existingIncident);
      }
    }
    
    // Handle multiple incident types (array) or single type (for backward compatibility)
    let incident_types = req.body.incident_types;
    
    // If incident_types not provided, check incident_type
    if (!incident_types) {
      if (Array.isArray(incident_type)) {
        incident_types = incident_type;
      } else if (incident_type) {
        incident_types = [incident_type];
      } else {
        return res.status(400).json({ error: 'At least one incident type required' });
      }
    }
    
    // Ensure it's an array
    if (!Array.isArray(incident_types)) {
      incident_types = [incident_types];
    }
    
    if (incident_types.length === 0) {
      return res.status(400).json({ error: 'At least one incident type required' });
    }
    
    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'GPS coordinates required' });
    }

    // Normalize types to lowercase
    const normalizedTypes = incident_types.map(t => {
      if (typeof t === 'string') {
        return t.toLowerCase().replace(/\s+/g, '_');
      }
      return String(t).toLowerCase().replace(/\s+/g, '_');
    });

    console.log('📝 Storing incident with types:', normalizedTypes); // Debug log

    // ✅ ATOMIC WRITE: Only write if we're sure it's new
    const incident = {
      id: uuidv4(),
      local_id: local_id || uuidv4(),
      incident_type: normalizedTypes[0], // Keep first type for backward compatibility
      incident_types: normalizedTypes, // Store all types as array
      severity: severity || 3,
      latitude,
      longitude,
      description: description || '',
      photo: photo || null,
      voice_note: voice_note || null,
      device_id,
      responder_name: responder_name || `Device-${device_id.slice(0, 8)}`,
      responder_email: responder_email || null,
      responder_uid: responder_uid || null,
      created_at: created_at || new Date().toISOString(),
      synced_at: new Date().toISOString()
    };

    // ✅ ATOMIC WRITE: Only write if we're sure it's new (already checked for duplicates above)
    db.data.incidents.push(incident);
    await db.write();

    // Emit to all connected dashboards
    const io = req.app.get('io');
    io.emit('new-incident', incident);

    console.log(`📍 New incident from device ${device_id.slice(0, 8)}: ${normalizedTypes.join(', ')}${voice_note ? ' 🎤' : ''}`);

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
