const jwt = require('jsonwebtoken');
const { getPool, sql } = require('../config/db');

const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.Int, decoded.id)
      .query('SELECT id, username, name, role, isActive FROM Users WHERE id=@id');

    const user = result.recordset[0];
    if (!user || !user.isActive) return res.status(401).json({ message: 'Unauthorized' });

    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role))
    return res.status(403).json({ message: 'Access denied' });
  next();
};

module.exports = { authenticate, authorize };
