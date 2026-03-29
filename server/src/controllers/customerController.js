const { getPool, sql } = require('../config/db');

const getAll = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .query('SELECT * FROM Customers ORDER BY name');
    res.json(result.recordset);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const getById = async (req, res) => {
  try {
    const pool = await getPool();
    const c = await pool.request().input('id', sql.Int, req.params.id)
      .query('SELECT * FROM Customers WHERE id=@id');
    if (!c.recordset[0]) return res.status(404).json({ message: 'Not found' });

    const orders = await pool.request().input('id', sql.Int, req.params.id)
      .query('SELECT TOP 10 * FROM Orders WHERE customer_id=@id ORDER BY created_at DESC');

    res.json({ ...c.recordset[0], orders: orders.recordset });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const create = async (req, res) => {
  try {
    const { name, phone, email, address } = req.body;
    const pool = await getPool();
    const result = await pool.request()
      .input('name', sql.VarChar, name)
      .input('phone', sql.VarChar, phone || null)
      .input('email', sql.VarChar, email || null)
      .input('address', sql.VarChar, address || null)
      .query('INSERT INTO Customers (name,phone,email,address) OUTPUT INSERTED.* VALUES (@name,@phone,@email,@address)');
    res.status(201).json(result.recordset[0]);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const update = async (req, res) => {
  try {
    const { name, phone, email, address } = req.body;
    const pool = await getPool();
    await pool.request()
      .input('id', sql.Int, req.params.id)
      .input('name', sql.VarChar, name)
      .input('phone', sql.VarChar, phone || null)
      .input('email', sql.VarChar, email || null)
      .input('address', sql.VarChar, address || null)
      .query('UPDATE Customers SET name=@name,phone=@phone,email=@email,address=@address WHERE id=@id');
    res.json({ message: 'Updated' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const remove = async (req, res) => {
  try {
    const pool = await getPool();
    await pool.request().input('id', sql.Int, req.params.id)
      .query('DELETE FROM Customers WHERE id=@id');
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

module.exports = { getAll, getById, create, update, remove };
