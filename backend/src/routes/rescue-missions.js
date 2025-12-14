import express from 'express';
import { db } from '../db/database.js';
import { verifyToken as authenticateToken } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Get all rescue missions
router.get('/', authenticateToken, async (req, res) => {
  try {
    await db.read();
    const missions = db.data.rescueMissions || [];
    res.json(missions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch rescue missions' });
  }
});

// Get single rescue mission
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    await db.read();
    const mission = db.data.rescueMissions.find(m => m.id === req.params.id);
    if (!mission) {
      return res.status(404).json({ error: 'Mission not found' });
    }
    res.json(mission);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch mission' });
  }
});

// Create rescue mission
router.post('/', authenticateToken, async (req, res) => {
  try {
    const mission = {
      id: `mission_${uuidv4()}`,
      ...req.body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: req.body.status || 'PLANNED'
    };
    
    await db.read();
    db.data.rescueMissions.push(mission);
    await db.write();
    
    // Emit to dashboard
    const io = req.app.get('io');
    io.emit('new-rescue-mission', mission);
    
    res.status(201).json(mission);
  } catch (error) {
    console.error('Create mission error:', error);
    res.status(500).json({ error: 'Failed to create rescue mission' });
  }
});

// Update rescue mission
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    await db.read();
    const index = db.data.rescueMissions.findIndex(m => m.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Mission not found' });
    }
    
    db.data.rescueMissions[index] = {
      ...db.data.rescueMissions[index],
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    
    await db.write();
    
    // Emit to dashboard
    const io = req.app.get('io');
    io.emit('update-rescue-mission', db.data.rescueMissions[index]);
    
    res.json(db.data.rescueMissions[index]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update mission' });
  }
});

// Update mission status only
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    await db.read();
    const index = db.data.rescueMissions.findIndex(m => m.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Mission not found' });
    }
    
    const { status } = req.body;
    const validStatuses = ['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    // Add timeline event for status change
    const timeline = db.data.rescueMissions[index].timeline || [];
    timeline.push({
      time: new Date().toISOString(),
      event: `Status changed to ${status}`
    });
    
    db.data.rescueMissions[index] = {
      ...db.data.rescueMissions[index],
      status,
      timeline,
      updatedAt: new Date().toISOString()
    };
    
    await db.write();
    
    // Emit to dashboard
    const io = req.app.get('io');
    io.emit('update-rescue-mission', db.data.rescueMissions[index]);
    
    res.json(db.data.rescueMissions[index]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// Delete rescue mission
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await db.read();
    const index = db.data.rescueMissions.findIndex(m => m.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Mission not found' });
    }
    
    db.data.rescueMissions.splice(index, 1);
    await db.write();
    
    // Emit to dashboard
    const io = req.app.get('io');
    io.emit('delete-rescue-mission', req.params.id);
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete mission' });
  }
});

// Get mission statistics
router.get('/stats/summary', authenticateToken, async (req, res) => {
  try {
    await db.read();
    const missions = db.data.rescueMissions || [];
    
    const stats = {
      total: missions.length,
      planned: missions.filter(m => m.status === 'PLANNED').length,
      inProgress: missions.filter(m => m.status === 'IN_PROGRESS').length,
      completed: missions.filter(m => m.status === 'COMPLETED').length,
      cancelled: missions.filter(m => m.status === 'CANCELLED').length,
      totalTrapped: missions.reduce((sum, m) => sum + (m.reportedTrapped || 0), 0),
      totalRescued: missions.reduce((sum, m) => sum + (m.rescued || 0), 0)
    };
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

export default router;
