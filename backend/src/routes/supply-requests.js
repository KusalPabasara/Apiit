import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// In-memory storage for supply requests (use real DB in production)
let supplyRequests = [];

// POST /api/supply-requests - Create new supply request from field app
router.post('/', async (req, res) => {
  try {
    const {
      id,
      device_id,
      responder_name,
      responder_email,
      responder_uid,
      priority,
      supplies,
      recipients,
      notes,
      photos,
      latitude,
      longitude,
      created_at
    } = req.body;

    // Validate required fields
    if (!supplies || supplies.length === 0) {
      return res.status(400).json({ error: 'At least one supply item is required' });
    }

    // ✅ IDEMPOTENCY: Check for duplicate
    if (id) {
      const existing = supplyRequests.find(s => s.id === id);
      if (existing) {
        console.log(`🔄 Duplicate supply request detected for ${id.slice(0, 8)}`);
        return res.status(200).json(existing);
      }
    }

    const supplyRequest = {
      id: id || uuidv4(),
      device_id,
      responder_name: responder_name || 'Unknown',
      responder_email,
      responder_uid,
      priority: priority || 'medium',
      supplies: supplies || [],
      recipients: recipients || null,
      notes: notes || null,
      photos: photos || null,
      latitude: latitude || 6.6828,
      longitude: longitude || 80.3992,
      status: 'pending',
      created_at: created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Save to in-memory storage
    supplyRequests.push(supplyRequest);

    console.log('📦 New supply request received:', {
      id: supplyRequest.id,
      responder: supplyRequest.responder_name,
      priority: supplyRequest.priority,
      supplies: supplyRequest.supplies
    });

    // Emit to dashboard via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.emit('new-supply-request', supplyRequest);
      console.log('📡 Supply request emitted to dashboard');
    }

    res.status(201).json(supplyRequest);
  } catch (error) {
    console.error('❌ Failed to create supply request:', error);
    res.status(500).json({ error: 'Failed to create supply request' });
  }
});

// GET /api/supply-requests - Get all supply requests
router.get('/', async (req, res) => {
  try {
    const { status, priority } = req.query;
    
    let filtered = [...supplyRequests];
    
    if (status) {
      filtered = filtered.filter(r => r.status === status);
    }
    
    if (priority) {
      filtered = filtered.filter(r => r.priority === priority);
    }
    
    // Sort by created_at descending (newest first)
    filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    res.json(filtered);
  } catch (error) {
    console.error('❌ Failed to fetch supply requests:', error);
    res.status(500).json({ error: 'Failed to fetch supply requests' });
  }
});

// GET /api/supply-requests/:id - Get single supply request
router.get('/:id', async (req, res) => {
  try {
    const request = supplyRequests.find(r => r.id === req.params.id);
    
    if (!request) {
      return res.status(404).json({ error: 'Supply request not found' });
    }
    
    res.json(request);
  } catch (error) {
    console.error('❌ Failed to fetch supply request:', error);
    res.status(500).json({ error: 'Failed to fetch supply request' });
  }
});

// PATCH /api/supply-requests/:id/status - Update supply request status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'acknowledged', 'in_progress', 'fulfilled', 'cancelled'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const index = supplyRequests.findIndex(r => r.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Supply request not found' });
    }
    
    supplyRequests[index].status = status;
    supplyRequests[index].updated_at = new Date().toISOString();
    
    console.log(`📦 Supply request ${req.params.id} status updated to: ${status}`);
    
    // Emit update to dashboard
    const io = req.app.get('io');
    if (io) {
      io.emit('supply-request-updated', supplyRequests[index]);
    }
    
    res.json(supplyRequests[index]);
  } catch (error) {
    console.error('❌ Failed to update supply request status:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// DELETE /api/supply-requests/:id - Delete supply request
router.delete('/:id', async (req, res) => {
  try {
    const index = supplyRequests.findIndex(r => r.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Supply request not found' });
    }
    
    supplyRequests.splice(index, 1);
    
    console.log(`📦 Supply request ${req.params.id} deleted`);
    
    res.json({ message: 'Supply request deleted' });
  } catch (error) {
    console.error('❌ Failed to delete supply request:', error);
    res.status(500).json({ error: 'Failed to delete supply request' });
  }
});

export default router;

