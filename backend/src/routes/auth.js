import express from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db/database.js';
import { generateToken, verifyToken } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Register device endpoint (for anonymous field users)
router.post('/register-device', async (req, res) => {
  try {
    const { deviceId, deviceName } = req.body;

    if (!deviceId) {
      return res.status(400).json({ error: 'Device ID required' });
    }

    await db.read();
    
    // Initialize devices array if it doesn't exist
    if (!db.data.devices) {
      db.data.devices = [];
    }

    // Check if device already registered
    let device = db.data.devices.find(d => d.deviceId === deviceId);
    
    if (device) {
      // Device exists - update last seen and return token
      device.lastSeen = new Date().toISOString();
      device.loginCount = (device.loginCount || 0) + 1;
      await db.write();
      
      const token = generateToken({ 
        id: device.id, 
        deviceId: device.deviceId,
        role: 'field_user',
        isDevice: true 
      });
      
      return res.json({
        token,
        user: {
          id: device.id,
          deviceId: device.deviceId,
          deviceName: device.deviceName,
          role: 'field_user',
          registeredAt: device.registeredAt,
          isDevice: true
        },
        returning: true
      });
    }
    
    // New device - register it
    const newDevice = {
      id: uuidv4(),
      deviceId,
      deviceName: deviceName || `Device-${deviceId.slice(0, 8)}`,
      role: 'field_user',
      registeredAt: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
      loginCount: 1,
      isDevice: true
    };
    
    db.data.devices.push(newDevice);
    await db.write();
    
    const token = generateToken({ 
      id: newDevice.id, 
      deviceId: newDevice.deviceId,
      role: 'field_user',
      isDevice: true 
    });
    
    console.log(`📱 New device registered: ${newDevice.deviceName}`);
    
    res.status(201).json({
      token,
      user: {
        id: newDevice.id,
        deviceId: newDevice.deviceId,
        deviceName: newDevice.deviceName,
        role: 'field_user',
        registeredAt: newDevice.registeredAt,
        isDevice: true
      },
      returning: false
    });
  } catch (error) {
    console.error('Device registration error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Login endpoint (for named responders & admins)
router.post('/login', async (req, res) => {
  try {
    const { username, password, deviceId } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    await db.read();
    const user = db.data.users.find(u => u.username === username);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = bcrypt.compareSync(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update user's last device
    if (deviceId) {
      user.lastDeviceId = deviceId;
      user.lastLoginAt = new Date().toISOString();
      await db.write();
    }

    const token = generateToken({
      ...user,
      deviceId
    });

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        role: user.role,
        deviceId
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Validate token endpoint (for auto-login)
router.get('/validate', verifyToken, (req, res) => {
  res.json({ 
    valid: true, 
    user: req.user 
  });
});

// Verify token endpoint (legacy compatibility)
router.get('/verify', verifyToken, (req, res) => {
  res.json({ valid: true, user: req.user });
});

// Get all responders (for admin dashboard)
router.get('/responders', verifyToken, async (req, res) => {
  try {
    await db.read();
    const responders = db.data.users
      .filter(u => u.role === 'responder')
      .map(({ password, ...rest }) => rest);
    
    res.json(responders);
  } catch (error) {
    console.error('Get responders error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all registered devices (for admin)
router.get('/devices', verifyToken, async (req, res) => {
  try {
    await db.read();
    const devices = db.data.devices || [];
    res.json(devices);
  } catch (error) {
    console.error('Get devices error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
