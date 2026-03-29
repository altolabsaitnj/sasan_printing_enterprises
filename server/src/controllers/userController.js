const bcrypt = require('bcryptjs');
const { getPool, sql } = require('../config/db');

const getAll = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .query('SELECT id, username, name, role, isActive, created_at FROM Users ORDER BY id');
    res.json(result.recordset);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const create = async (req, res) => {
  try {
    const { username, password, name, role } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    const pool = await getPool();
    const result = await pool.request()
      .input('u', sql.VarChar, username)
      .input('p', sql.VarChar, hashed)
      .input('n', sql.VarChar, name || username)
      .input('r', sql.VarChar, role || 'cashier')
      .query('INSERT INTO Users (username,password,name,role) OUTPUT INSERTED.id,INSERTED.username,INSERTED.name,INSERTED.role VALUES (@u,@p,@n,@r)');
    res.status(201).json(result.recordset[0]);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const update = async (req, res) => {
  try {
    const { name, role, isActive, password } = req.body;
    const pool = await getPool();
    if (password) {
      const hashed = await bcrypt.hash(password, 10);
      await pool.request()
        .input('id', sql.Int, req.params.id)
        .input('n', sql.VarChar, name).input('r', sql.VarChar, role)
        .input('a', sql.Bit, isActive ? 1 : 0).input('p', sql.VarChar, hashed)
        .query('UPDATE Users SET name=@n,role=@r,isActive=@a,password=@p WHERE id=@id');
    } else {
      await pool.request()
        .input('id', sql.Int, req.params.id)
        .input('n', sql.VarChar, name).input('r', sql.VarChar, role)
        .input('a', sql.Bit, isActive ? 1 : 0)
        .query('UPDATE Users SET name=@n,role=@r,isActive=@a WHERE id=@id');
    }
    res.json({ message: 'Updated' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const remove = async (req, res) => {
  try {
    const pool = await getPool();
    await pool.request().input('id', sql.Int, req.params.id)
      .query('DELETE FROM Users WHERE id=@id');
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

module.exports = { getAll, create, update, remove };
