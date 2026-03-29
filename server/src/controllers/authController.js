const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getPool, sql } = require('../config/db');

const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const pool = await getPool();
    const result = await pool.request()
      .input('username', sql.VarChar, username)
      .query('SELECT * FROM Users WHERE username=@username AND isActive=1');

    const user = result.recordset[0];
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });

    res.json({
      token,
      user: { id: user.id, username: user.username, name: user.name, role: user.role },
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const getMe = async (req, res) => res.json(req.user);

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.Int, req.user.id)
      .query('SELECT password FROM Users WHERE id=@id');

    const valid = await bcrypt.compare(currentPassword, result.recordset[0].password);
    if (!valid) return res.status(400).json({ message: 'Current password incorrect' });

    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.request()
      .input('id', sql.Int, req.user.id)
      .input('pw', sql.VarChar, hashed)
      .query('UPDATE Users SET password=@pw WHERE id=@id');

    res.json({ message: 'Password updated' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

module.exports = { login, getMe, changePassword };
