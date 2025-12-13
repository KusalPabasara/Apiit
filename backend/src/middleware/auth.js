import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'aegis-disaster-response-secret-key-2024';

function generateToken(user) {
  return jwt.sign(
    { 
      id: user.id, 
      username: user.username, 
      full_name: user.full_name,
      role: user.role 
    },
    JWT_SECRET,
    { expiresIn: '7d' } // Long expiry for offline usage
  );
}

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export { generateToken, verifyToken, JWT_SECRET };
