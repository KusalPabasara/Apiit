import express from 'express';
import { db } from '../db/database.js';
import { verifyToken as authenticateToken } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Get all relief camps
router.get('/', authenticateToken, async (req, res) => {
  try {
    await db.read();
    const camps = db.data.reliefCamps || [];
    res.json(camps);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch relief camps' });
  }
});

// Get single relief camp
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    await db.read();
    const camp = db.data.reliefCamps.find(c => c.id === req.params.id);
    if (!camp) {
      return res.status(404).json({ error: 'Camp not found' });
    }
    res.json(camp);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch camp' });
  }
});

// Create relief camp
router.post('/', authenticateToken, async (req, res) => {
  try {
    const camp = {
      id: `camp_${uuidv4()}`,
      ...req.body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: req.body.status || 'active'
    };
    
    await db.read();
    db.data.reliefCamps.push(camp);
    await db.write();
    
    // Emit to dashboard
    const io = req.app.get('io');
    io.emit('new-relief-camp', camp);
    
    res.status(201).json(camp);
  } catch (error) {
    console.error('Create camp error:', error);
    res.status(500).json({ error: 'Failed to create relief camp' });
  }
});

// Update relief camp
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    await db.read();
    const index = db.data.reliefCamps.findIndex(c => c.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Camp not found' });
    }
    
    db.data.reliefCamps[index] = {
      ...db.data.reliefCamps[index],
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    
    await db.write();
    
    // Emit to dashboard
    const io = req.app.get('io');
    io.emit('update-relief-camp', db.data.reliefCamps[index]);
    
    res.json(db.data.reliefCamps[index]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update camp' });
  }
});

// Delete relief camp
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await db.read();
    const index = db.data.reliefCamps.findIndex(c => c.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Camp not found' });
    }
    
    db.data.reliefCamps.splice(index, 1);
    await db.write();
    
    // Emit to dashboard
    const io = req.app.get('io');
    io.emit('delete-relief-camp', req.params.id);
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete camp' });
  }
});

// Get camp statistics
router.get('/stats/summary', authenticateToken, async (req, res) => {
  try {
    await db.read();
    const camps = db.data.reliefCamps || [];
    
    const stats = {
      totalCamps: camps.length,
      activeCamps: camps.filter(c => c.status === 'active').length,
      totalOccupancy: camps.reduce((sum, c) => sum + (c.currentOccupancy || 0), 0),
      totalCapacity: camps.reduce((sum, c) => sum + (c.capacity || 0), 0),
      demographics: {
        children: camps.reduce((sum, c) => sum + (c.demographics?.children || 0), 0),
        elderly: camps.reduce((sum, c) => sum + (c.demographics?.elderly || 0), 0),
        pregnant: camps.reduce((sum, c) => sum + (c.demographics?.pregnant || 0), 0),
        disabled: camps.reduce((sum, c) => sum + (c.demographics?.disabled || 0), 0),
        infants: camps.reduce((sum, c) => sum + (c.demographics?.infants || 0), 0)
      }
    };
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

export default router;
