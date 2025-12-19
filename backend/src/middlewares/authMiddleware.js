const jwt = require('jsonwebtoken');

// --- Regular User Auth ---
function authenticateToken(req, res, next) {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; 
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// --- Admin Auth ---
function authenticateAdmin(req, res, next) {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No admin token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check for the specific admin flag
    if (decoded.isAdmin) {
      req.user = decoded; 
      next();
    } else {
      res.status(403).json({ error: 'Access denied. Admin only.' });
    }
  } catch (err) {
    res.status(401).json({ error: 'Invalid admin token' });
  }
}

module.exports = { authenticateToken, authenticateAdmin };