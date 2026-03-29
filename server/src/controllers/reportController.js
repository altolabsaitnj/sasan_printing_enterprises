const { getPool, sql } = require('../config/db');

const getSummary = async (req, res) => {
  try {
    const pool = await getPool();
    const today = new Date(); today.setHours(0,0,0,0);
    const weekStart = new Date(today); weekStart.setDate(today.getDate() - 7);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const query = async (start) => {
      const r = await pool.request()
        .input('start', sql.DateTime, start)
        .query(`SELECT COUNT(*) AS [count], ISNULL(SUM(total),0) AS revenue
                FROM Orders WHERE created_at >= @start AND status='completed'`);
      return r.recordset[0];
    };

    const [todayData, weekData, monthData] = await Promise.all([
      query(today), query(weekStart), query(monthStart),
    ]);
    res.json({ today: todayData, week: weekData, month: monthData });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const getDailySales = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const start = new Date(); start.setDate(start.getDate() - parseInt(days));
    const pool = await getPool();
    const result = await pool.request()
      .input('start', sql.DateTime, start)
      .query(`SELECT CONVERT(VARCHAR(10), created_at, 120) AS date,
                     COUNT(*) AS orders,
                     ISNULL(SUM(total),0) AS revenue
              FROM Orders
              WHERE created_at >= @start AND status='completed'
              GROUP BY CONVERT(VARCHAR(10), created_at, 120)
              ORDER BY date ASC`);
    res.json(result.recordset);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const getTopProducts = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const pool = await getPool();
    const result = await pool.request()
      .input('limit', sql.Int, parseInt(limit))
      .query(`SELECT TOP (@limit) product_id, product_name,
                     SUM(quantity) AS total_qty,
                     SUM(total) AS total_revenue
              FROM Order_Items
              GROUP BY product_id, product_name
              ORDER BY total_qty DESC`);
    res.json(result.recordset);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const getPaymentBreakdown = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const pool = await getPool();
    const req1 = pool.request();
    let where = "WHERE status='completed'";
    if (startDate) { req1.input('start', sql.DateTime, new Date(startDate)); where += ' AND created_at >= @start'; }
    if (endDate)   { req1.input('end', sql.DateTime, new Date(endDate+'T23:59:59')); where += ' AND created_at <= @end'; }

    const result = await req1.query(`
      SELECT payment_method, COUNT(*) AS [count], ISNULL(SUM(total),0) AS total
      FROM Orders ${where}
      GROUP BY payment_method`);
    res.json(result.recordset);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

module.exports = { getSummary, getDailySales, getTopProducts, getPaymentBreakdown };
