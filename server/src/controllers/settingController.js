const { getPool, sql } = require('../config/db');

const getAll = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query('SELECT [key], value FROM Settings');
    const obj = {};
    result.recordset.forEach(s => obj[s.key] = s.value);
    res.json(obj);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const update = async (req, res) => {
  try {
    const pool = await getPool();
    for (const [key, value] of Object.entries(req.body)) {
      await pool.request()
        .input('k', sql.VarChar, key)
        .input('v', sql.VarChar, String(value))
        .query(`IF EXISTS (SELECT 1 FROM Settings WHERE [key]=@k)
                  UPDATE Settings SET value=@v, updated_at=GETDATE() WHERE [key]=@k
                ELSE
                  INSERT INTO Settings ([key],value) VALUES (@k,@v)`);
    }
    res.json({ message: 'Settings updated' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

module.exports = { getAll, update };
