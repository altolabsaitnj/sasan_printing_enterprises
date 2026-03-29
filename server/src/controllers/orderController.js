const { getPool, sql } = require('../config/db');

const generateOrderNumber = () => {
  const now = new Date();
  return `ORD-${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}-${Date.now().toString().slice(-6)}`;
};

const create = async (req, res) => {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);
  try {
    const { items, subtotal, discount, tax, total, payment_method, amount_paid, customer_id, notes } = req.body;
    await transaction.begin();
    const req1 = new sql.Request(transaction);

    // Insert order
    const orderResult = await req1
      .input('order_number', sql.VarChar, generateOrderNumber())
      .input('customer_id', sql.Int, customer_id || null)
      .input('user_id', sql.Int, req.user.id)
      .input('subtotal', sql.Decimal(10,2), subtotal)
      .input('discount', sql.Decimal(10,2), discount || 0)
      .input('tax', sql.Decimal(10,2), tax || 0)
      .input('total', sql.Decimal(10,2), total)
      .input('payment_method', sql.VarChar, payment_method || 'cash')
      .input('notes', sql.VarChar, notes || null)
      .query(`INSERT INTO Orders (order_number,customer_id,user_id,subtotal,discount,tax,total,payment_method,notes)
              OUTPUT INSERTED.id, INSERTED.order_number
              VALUES (@order_number,@customer_id,@user_id,@subtotal,@discount,@tax,@total,@payment_method,@notes)`);

    const orderId = orderResult.recordset[0].id;
    const orderNumber = orderResult.recordset[0].order_number;

    // Insert items + reduce stock
    for (const item of items) {
      const req2 = new sql.Request(transaction);
      const prodResult = await req2
        .input('pid', sql.Int, item.product_id)
        .query('SELECT name, stock FROM Products WHERE id=@pid');

      const product = prodResult.recordset[0];
      if (!product) throw new Error(`Product ${item.product_id} not found`);
      if (product.stock < item.quantity) throw new Error(`Insufficient stock for ${product.name}`);

      const req3 = new sql.Request(transaction);
      await req3
        .input('order_id', sql.Int, orderId)
        .input('product_id', sql.Int, item.product_id)
        .input('product_name', sql.VarChar, product.name)
        .input('quantity', sql.Int, item.quantity)
        .input('price', sql.Decimal(10,2), item.price)
        .input('total', sql.Decimal(10,2), item.price * item.quantity)
        .query(`INSERT INTO Order_Items (order_id,product_id,product_name,quantity,price,total)
                VALUES (@order_id,@product_id,@product_name,@quantity,@price,@total)`);

      const req4 = new sql.Request(transaction);
      await req4.input('qty', sql.Int, item.quantity).input('pid', sql.Int, item.product_id)
        .query('UPDATE Products SET stock = stock - @qty WHERE id=@pid');
    }

    // Insert payment
    const req5 = new sql.Request(transaction);
    const paid = parseFloat(amount_paid) || total;
    await req5
      .input('order_id', sql.Int, orderId)
      .input('amount_paid', sql.Decimal(10,2), paid)
      .input('balance', sql.Decimal(10,2), paid - total)
      .input('method', sql.VarChar, payment_method || 'cash')
      .query('INSERT INTO Payments (order_id,amount_paid,balance,method) VALUES (@order_id,@amount_paid,@balance,@method)');

    // Update customer total
    if (customer_id) {
      const req6 = new sql.Request(transaction);
      await req6.input('total', sql.Decimal(10,2), total).input('cid', sql.Int, customer_id)
        .query('UPDATE Customers SET total_purchases = total_purchases + @total WHERE id=@cid');
    }

    await transaction.commit();

    // Return full order
    const fullOrder = await getOrderById(orderId, pool);
    res.status(201).json(fullOrder);
  } catch (err) {
    await transaction.rollback();
    res.status(500).json({ message: err.message });
  }
};

const getOrderById = async (id, pool) => {
  const r1 = await pool.request().input('id', sql.Int, id).query(`
    SELECT o.*, u.name AS cashier_name, c.name AS customer_name, c.phone AS customer_phone
    FROM Orders o
    LEFT JOIN Users u ON o.user_id = u.id
    LEFT JOIN Customers c ON o.customer_id = c.id
    WHERE o.id = @id
  `);
  const order = r1.recordset[0];
  if (!order) return null;

  const r2 = await pool.request().input('id', sql.Int, id)
    .query('SELECT * FROM Order_Items WHERE order_id=@id');
  order.items = r2.recordset;

  const r3 = await pool.request().input('id', sql.Int, id)
    .query('SELECT * FROM Payments WHERE order_id=@id');
  order.payment = r3.recordset[0];

  return order;
};

const getAll = async (req, res) => {
  try {
    const { startDate, endDate, payment_method, page = 1, limit = 20 } = req.query;
    const pool = await getPool();
    const req1 = pool.request()
      .input('offset', sql.Int, (parseInt(page)-1) * parseInt(limit))
      .input('limit', sql.Int, parseInt(limit));

    let where = 'WHERE 1=1';
    if (startDate) { req1.input('start', sql.DateTime, new Date(startDate)); where += ' AND o.created_at >= @start'; }
    if (endDate)   { req1.input('end', sql.DateTime, new Date(endDate + 'T23:59:59')); where += ' AND o.created_at <= @end'; }
    if (payment_method) { req1.input('pm', sql.VarChar, payment_method); where += ' AND o.payment_method=@pm'; }

    const result = await req1.query(`
      SELECT o.*, u.name AS cashier_name, c.name AS customer_name,
             COUNT(*) OVER() AS total_count
      FROM Orders o
      LEFT JOIN Users u ON o.user_id=u.id
      LEFT JOIN Customers c ON o.customer_id=c.id
      ${where}
      ORDER BY o.created_at DESC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `);

    const total = result.recordset[0]?.total_count || 0;
    const orders = result.recordset.map(r => { delete r.total_count; return r; });

    // Attach items count
    for (const o of orders) {
      const r2 = await pool.request().input('id', sql.Int, o.id)
        .query('SELECT COUNT(*) AS cnt FROM Order_Items WHERE order_id=@id');
      o.item_count = r2.recordset[0].cnt;
    }

    res.json({ total, orders, page: parseInt(page) });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const getOne = async (req, res) => {
  try {
    const pool = await getPool();
    const order = await getOrderById(parseInt(req.params.id), pool);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

module.exports = { create, getAll, getOne };
