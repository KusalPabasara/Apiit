import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// In-memory storage for trapped civilians reports
let trappedReports = [];

// POST /api/trapped-civilians - Create new trapped civilians report
router.post('/', async (req, res) => {
  try {
    const {
      id,
      device_id,
      responder_name,
      responder_email,
      responder_uid,
      number_of_civilians,
      condition,
      urgency,
      description,
      accessibility_notes,
      photos,
      voice_note,
      latitude,
      longitude,
      created_at
    } = req.body;

    // Validate required fields
    if (!number_of_civilians || number_of_civilians < 1) {
      return res.status(400).json({ error: 'Number of civilians is required' });
    }

    // ✅ IDEMPOTENCY: Check for duplicate
    if (id) {
      const existing = trappedReports.find(t => t.id === id);
      if (existing) {
        console.log(`🔄 Duplicate trapped civilian report detected for ${id.slice(0, 8)}`);
        return res.status(200).json(existing);
      }
    }

    const report = {
      id: id || uuidv4(),
      device_id,
      responder_name: responder_name || 'Unknown',
      responder_email,
      responder_uid,
      number_of_civilians: parseInt(number_of_civilians),
      condition: condition || 'unknown',
      urgency: urgency || 'medium',
      description: description || null,
      accessibility_notes: accessibility_notes || null,
      photos: photos || null,
      voice_note: voice_note || null,
      latitude: latitude || 6.6828,
      longitude: longitude || 80.3992,
      status: 'reported',
      rescue_team: null,
      rescued_count: 0,
      created_at: created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Save to in-memory storage
    trappedReports.push(report);

    console.log('🆘 New trapped civilians report:', {
      id: report.id,
      responder: report.responder_name,
      civilians: report.number_of_civilians,
      urgency: report.urgency,
      condition: report.condition
    });

    // Emit to dashboard via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.emit('new-trapped-report', report);
      console.log('📡 Trapped civilians report emitted to dashboard');
    }

    res.status(201).json(report);
  } catch (error) {
    console.error('❌ Failed to create trapped civilians report:', error);
    res.status(500).json({ error: 'Failed to create report' });
  }
});

// GET /api/trapped-civilians - Get all trapped civilians reports
router.get('/', async (req, res) => {
  try {
    const { status, urgency } = req.query;
    
    let filtered = [...trappedReports];
    
    if (status) {
      filtered = filtered.filter(r => r.status === status);
    }
    
    if (urgency) {
      filtered = filtered.filter(r => r.urgency === urgency);
    }
    
    // Sort by urgency (critical first) then by created_at
    const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    filtered.sort((a, b) => {
      const urgencyDiff = (urgencyOrder[a.urgency] || 4) - (urgencyOrder[b.urgency] || 4);
      if (urgencyDiff !== 0) return urgencyDiff;
      return new Date(b.created_at) - new Date(a.created_at);
    });
    
    res.json(filtered);
  } catch (error) {
    console.error('❌ Failed to fetch trapped civilians reports:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// GET /api/trapped-civilians/:id - Get single report
router.get('/:id', async (req, res) => {
  try {
    const report = trappedReports.find(r => r.id === req.params.id);
    
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    res.json(report);
  } catch (error) {
    console.error('❌ Failed to fetch report:', error);
    res.status(500).json({ error: 'Failed to fetch report' });
  }
});

// PATCH /api/trapped-civilians/:id/status - Update report status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status, rescue_team, rescued_count } = req.body;
    const validStatuses = ['reported', 'acknowledged', 'rescue_dispatched', 'rescue_in_progress', 'rescued', 'unable_to_reach'];
    
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const index = trappedReports.findIndex(r => r.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    if (status) trappedReports[index].status = status;
    if (rescue_team) trappedReports[index].rescue_team = rescue_team;
    if (rescued_count !== undefined) trappedReports[index].rescued_count = rescued_count;
    trappedReports[index].updated_at = new Date().toISOString();
    
    console.log(`🆘 Trapped civilians report ${req.params.id} updated:`, { status, rescue_team, rescued_count });
    
    // Emit update to dashboard
    const io = req.app.get('io');
    if (io) {
      io.emit('trapped-report-updated', trappedReports[index]);
    }
    
    res.json(trappedReports[index]);
  } catch (error) {
    console.error('❌ Failed to update report:', error);
    res.status(500).json({ error: 'Failed to update report' });
  }
});

// DELETE /api/trapped-civilians/:id - Delete report
router.delete('/:id', async (req, res) => {
  try {
    const index = trappedReports.findIndex(r => r.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    trappedReports.splice(index, 1);
    
    console.log(`🆘 Trapped civilians report ${req.params.id} deleted`);
    
    res.json({ message: 'Report deleted' });
  } catch (error) {
    console.error('❌ Failed to delete report:', error);
    res.status(500).json({ error: 'Failed to delete report' });
  }
});

export default router;

