const { getPool, sql } = require('../config/db');

const getAll = async (req, res) => {
  try {
    const { search, category, lowStock, page = 1, limit = 100 } = req.query;
    const pool = await getPool();
    const req2 = pool.request()
      .input('offset', sql.Int, (parseInt(page) - 1) * parseInt(limit))
      .input('limit', sql.Int, parseInt(limit));

    let where = 'WHERE p.is_active=1';
    if (search) {
      req2.input('search', sql.VarChar, `%${search}%`);
      where += ' AND (p.name LIKE @search OR p.barcode LIKE @search)';
    }
    if (category) {
      req2.input('category', sql.VarChar, category);
      where += ' AND p.category=@category';
    }
    if (lowStock === 'true') where += ' AND p.stock <= p.low_stock_alert';

    const result = await req2.query(`
      SELECT p.*, COUNT(*) OVER() AS total_count
      FROM Products p ${where}
      ORDER BY p.name
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `);
    const total = result.recordset[0]?.total_count || 0;
    res.json({ total, products: result.recordset.map(r => { delete r.total_count; return r; }) });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const getLowStock = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .query('SELECT * FROM Products WHERE is_active=1 AND stock <= low_stock_alert ORDER BY stock ASC');
    res.json(result.recordset);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const getByBarcode = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('barcode', sql.VarChar, req.params.barcode)
      .query('SELECT * FROM Products WHERE barcode=@barcode AND is_active=1');
    if (!result.recordset[0]) return res.status(404).json({ message: 'Product not found' });
    res.json(result.recordset[0]);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const create = async (req, res) => {
  try {
    const { name, barcode, category, price, cost_price, stock, low_stock_alert } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : null;
    const pool = await getPool();
    const result = await pool.request()
      .input('name', sql.VarChar, name)
      .input('barcode', sql.VarChar, barcode || null)
      .input('category', sql.VarChar, category || null)
      .input('price', sql.Decimal(10,2), parseFloat(price))
      .input('cost_price', sql.Decimal(10,2), parseFloat(cost_price) || 0)
      .input('stock', sql.Int, parseInt(stock) || 0)
      .input('low_stock_alert', sql.Int, parseInt(low_stock_alert) || 10)
      .input('image', sql.VarChar, image)
      .query(`INSERT INTO Products (name,barcode,category,price,cost_price,stock,low_stock_alert,image)
              OUTPUT INSERTED.*
              VALUES (@name,@barcode,@category,@price,@cost_price,@stock,@low_stock_alert,@image)`);
    res.status(201).json(result.recordset[0]);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const update = async (req, res) => {
  try {
    const { name, barcode, category, price, cost_price, stock, low_stock_alert } = req.body;
    const pool = await getPool();
    const existing = await pool.request().input('id', sql.Int, req.params.id)
      .query('SELECT image FROM Products WHERE id=@id');
    const image = req.file ? `/uploads/${req.file.filename}` : existing.recordset[0]?.image;

    await pool.request()
      .input('id', sql.Int, req.params.id)
      .input('name', sql.VarChar, name)
      .input('barcode', sql.VarChar, barcode || null)
      .input('category', sql.VarChar, category || null)
      .input('price', sql.Decimal(10,2), parseFloat(price))
      .input('cost_price', sql.Decimal(10,2), parseFloat(cost_price) || 0)
      .input('stock', sql.Int, parseInt(stock) || 0)
      .input('low_stock_alert', sql.Int, parseInt(low_stock_alert) || 10)
      .input('image', sql.VarChar, image)
      .query(`UPDATE Products SET name=@name,barcode=@barcode,category=@category,
              price=@price,cost_price=@cost_price,stock=@stock,
              low_stock_alert=@low_stock_alert,image=@image WHERE id=@id`);
    res.json({ message: 'Updated' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const remove = async (req, res) => {
  try {
    const pool = await getPool();
    await pool.request().input('id', sql.Int, req.params.id)
      .query('UPDATE Products SET is_active=0 WHERE id=@id');
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

module.exports = { getAll, getLowStock, getByBarcode, create, update, remove };
