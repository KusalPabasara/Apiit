import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// In-memory storage for blocked road reports
let blockedRoads = [];

// POST /api/blocked-roads - Create new blocked road report
router.post('/', async (req, res) => {
  try {
    const {
      id,
      device_id,
      responder_name,
      responder_email,
      responder_uid,
      start_lat,
      start_lng,
      end_lat,
      end_lng,
      obstruction_type,
      severity,
      affected_length,
      clearance_estimate,
      description,
      photos,
      created_at
    } = req.body;

    // Validate required fields
    if (!start_lat || !start_lng) {
      return res.status(400).json({ error: 'Start location is required' });
    }

    // ✅ IDEMPOTENCY: Check for duplicate
    if (id) {
      const existing = blockedRoads.find(b => b.id === id);
      if (existing) {
        console.log(`🔄 Duplicate blocked road report detected for ${id.slice(0, 8)}`);
        return res.status(200).json(existing);
      }
    }

    const report = {
      id: id || uuidv4(),
      device_id,
      responder_name: responder_name || 'Unknown',
      responder_email,
      responder_uid,
      start_lat: parseFloat(start_lat),
      start_lng: parseFloat(start_lng),
      end_lat: end_lat ? parseFloat(end_lat) : null,
      end_lng: end_lng ? parseFloat(end_lng) : null,
      obstruction_type: obstruction_type || 'debris',
      severity: severity || 'restricted',
      affected_length: affected_length || null,
      clearance_estimate: clearance_estimate || null,
      description: description || null,
      photos: photos || null,
      status: 'reported',
      clearance_team: null,
      created_at: created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Save to in-memory storage
    blockedRoads.push(report);

    console.log('🚧 New blocked road report:', {
      id: report.id,
      responder: report.responder_name,
      type: report.obstruction_type,
      severity: report.severity,
      start: `${report.start_lat}, ${report.start_lng}`
    });

    // Emit to dashboard via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.emit('new-blocked-road', report);
      console.log('📡 Blocked road report emitted to dashboard');
    }

    res.status(201).json(report);
  } catch (error) {
    console.error('❌ Failed to create blocked road report:', error);
    res.status(500).json({ error: 'Failed to create report' });
  }
});

// GET /api/blocked-roads - Get all blocked road reports
router.get('/', async (req, res) => {
  try {
    const { status, severity } = req.query;
    
    let filtered = [...blockedRoads];
    
    if (status) {
      filtered = filtered.filter(r => r.status === status);
    }
    
    if (severity) {
      filtered = filtered.filter(r => r.severity === severity);
    }
    
    // Sort by severity (blocked first) then by created_at
    const severityOrder = { blocked: 0, restricted: 1, hazardous: 2, minor: 3 };
    filtered.sort((a, b) => {
      const severityDiff = (severityOrder[a.severity] || 4) - (severityOrder[b.severity] || 4);
      if (severityDiff !== 0) return severityDiff;
      return new Date(b.created_at) - new Date(a.created_at);
    });
    
    res.json(filtered);
  } catch (error) {
    console.error('❌ Failed to fetch blocked road reports:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// GET /api/blocked-roads/:id - Get single report
router.get('/:id', async (req, res) => {
  try {
    const report = blockedRoads.find(r => r.id === req.params.id);
    
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    res.json(report);
  } catch (error) {
    console.error('❌ Failed to fetch report:', error);
    res.status(500).json({ error: 'Failed to fetch report' });
  }
});

// PATCH /api/blocked-roads/:id/status - Update report status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status, clearance_team } = req.body;
    const validStatuses = ['reported', 'acknowledged', 'clearance_dispatched', 'clearing_in_progress', 'cleared', 'alternative_route'];
    
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const index = blockedRoads.findIndex(r => r.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    if (status) blockedRoads[index].status = status;
    if (clearance_team) blockedRoads[index].clearance_team = clearance_team;
    blockedRoads[index].updated_at = new Date().toISOString();
    
    console.log(`🚧 Blocked road ${req.params.id} updated:`, { status, clearance_team });
    
    // Emit update to dashboard
    const io = req.app.get('io');
    if (io) {
      io.emit('blocked-road-updated', blockedRoads[index]);
    }
    
    res.json(blockedRoads[index]);
  } catch (error) {
    console.error('❌ Failed to update report:', error);
    res.status(500).json({ error: 'Failed to update report' });
  }
});

// DELETE /api/blocked-roads/:id - Delete report
router.delete('/:id', async (req, res) => {
  try {
    const index = blockedRoads.findIndex(r => r.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    blockedRoads.splice(index, 1);
    
    console.log(`🚧 Blocked road report ${req.params.id} deleted`);
    
    res.json({ message: 'Report deleted' });
  } catch (error) {
    console.error('❌ Failed to delete report:', error);
    res.status(500).json({ error: 'Failed to delete report' });
  }
});

export default router;

