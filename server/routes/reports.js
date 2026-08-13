// server/routes/reports.js
const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Returns SQL date range clause based on period.
 * @param {'daily'|'weekly'|'monthly'|'yearly'} period
 * @param {string} column  - column name to compare, e.g. 'a.check_in_time'
 */
function periodWhere(period, column) {
  switch (period) {
    case 'daily':   return `DATE(${column}) = CURDATE()`;
    case 'weekly':  return `YEARWEEK(${column}, 1) = YEARWEEK(CURDATE(), 1)`;
    case 'monthly': return `YEAR(${column}) = YEAR(CURDATE()) AND MONTH(${column}) = MONTH(CURDATE())`;
    case 'yearly':  return `YEAR(${column}) = YEAR(CURDATE())`;
    default:        return '1=1';
  }
}

// ── USER: My Transaction History ──────────────────────────────────────────────
/**
 * GET /api/reports/my-transactions
 * Returns a unified list of attendance check-ins + shop orders for the current user.
 * Query param: period = daily | weekly | monthly | all (default: all)
 */
router.get('/my-transactions', authenticateToken, async (req, res) => {
  const period = req.query.period || 'all';
  const userId = req.user.id;

  try {
    // Attendance records
    const attendanceWhere = period !== 'all' ? `AND ${periodWhere(period, 'a.check_in_time')}` : '';
    const [attendance] = await pool.query(
      `SELECT
          a.id,
          'attendance' AS source,
          a.check_in_time AS transaction_date,
          a.membership_type AS sub_type,
          a.payment_status,
          CASE WHEN a.membership_type = 'daily' THEN 40.00 ELSE 0.00 END AS amount,
          CASE WHEN a.membership_type = 'daily' THEN 'Daily Pass' ELSE 'Premium Membership' END AS type_label,
          a.confirmed_at,
          NULL AS product_name,
          NULL AS quantity
       FROM attendance a
       WHERE a.user_id = ? ${attendanceWhere}
       ORDER BY a.check_in_time DESC`,
      [userId]
    );

    // Order records
    const orderWhere = period !== 'all' ? `AND ${periodWhere(period, 'o.created_at')}` : '';
    const [orders] = await pool.query(
      `SELECT
          o.id,
          'order' AS source,
          o.created_at AS transaction_date,
          o.status AS sub_type,
          o.status AS payment_status,
          o.total AS amount,
          'Shop Purchase' AS type_label,
          NULL AS confirmed_at,
          p.name AS product_name,
          o.quantity
       FROM orders o
       LEFT JOIN products p ON o.product_id = p.id
       WHERE o.user_id = ? ${orderWhere}
       ORDER BY o.created_at DESC`,
      [userId]
    );

    // Merge & sort by date desc
    const combined = [...attendance, ...orders].sort(
      (a, b) => new Date(b.transaction_date) - new Date(a.transaction_date)
    );

    res.json(combined);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── ADMIN: All Transactions ───────────────────────────────────────────────────
/**
 * GET /api/reports/admin/transactions
 * Returns all attendance + shop orders with optional period filter.
 * Query param: period = daily | weekly | monthly | all (default: all)
 */
router.get('/admin/transactions', authenticateToken, authorizeRoles('admin', 'super_admin', 'employee'), async (req, res) => {
  const period = req.query.period || 'all';
  try {
    const attWhere = period !== 'all' ? `WHERE ${periodWhere(period, 'a.check_in_time')}` : '';
    const [attendance] = await pool.query(
      `SELECT
          a.id,
          'attendance' AS source,
          u.username,
          u.email,
          a.check_in_time AS transaction_date,
          a.membership_type AS sub_type,
          a.payment_status,
          CASE WHEN a.membership_type = 'daily' THEN 40.00 ELSE 0.00 END AS amount,
          CASE WHEN a.membership_type = 'daily' THEN 'Daily Pass' ELSE 'Premium Membership' END AS type_label,
          NULL AS product_name,
          NULL AS quantity
       FROM attendance a
       JOIN users u ON a.user_id = u.id
       ${attWhere}
       ORDER BY a.check_in_time DESC`
    );

    const ordWhere = period !== 'all' ? `WHERE ${periodWhere(period, 'o.created_at')}` : '';
    const [orders] = await pool.query(
      `SELECT
          o.id,
          'order' AS source,
          u.username,
          u.email,
          o.created_at AS transaction_date,
          o.status AS sub_type,
          o.status AS payment_status,
          o.total AS amount,
          'Shop Purchase' AS type_label,
          p.name AS product_name,
          o.quantity
       FROM orders o
       JOIN users u ON o.user_id = u.id
       LEFT JOIN products p ON o.product_id = p.id
       ${ordWhere}
       ORDER BY o.created_at DESC`
    );

    const combined = [...attendance, ...orders].sort(
      (a, b) => new Date(b.transaction_date) - new Date(a.transaction_date)
    );
    res.json(combined);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── ADMIN: Attendance Logs ────────────────────────────────────────────────────
/**
 * GET /api/reports/admin/attendance?period=daily|weekly|monthly
 */
router.get('/admin/attendance', authenticateToken, authorizeRoles('admin', 'super_admin', 'employee'), async (req, res) => {
  const period = req.query.period || 'daily';
  try {
    const where = periodWhere(period, 'a.check_in_time');
    const [rows] = await pool.query(
      `SELECT
          a.id,
          u.username,
          u.email,
          u.membership_type AS user_plan,
          a.check_in_time,
          a.membership_type,
          a.payment_status,
          a.confirmed_at,
          CASE WHEN a.membership_type = 'daily' THEN 40.00 ELSE 0.00 END AS amount
       FROM attendance a
       JOIN users u ON a.user_id = u.id
       WHERE ${where}
       ORDER BY a.check_in_time DESC`
    );

    // Summary counts
    const total = rows.length;
    const daily = rows.filter(r => r.membership_type === 'daily').length;
    const premium = rows.filter(r => r.membership_type === 'premium').length;
    const paidCount = rows.filter(r => r.payment_status === 'paid').length;
    const totalRevenue = rows.reduce((s, r) => s + Number(r.amount), 0);

    res.json({ rows, summary: { total, daily, premium, paidCount, totalRevenue } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── ADMIN: Sales Report ───────────────────────────────────────────────────────
/**
 * GET /api/reports/admin/sales?period=daily|weekly|monthly|yearly
 */
router.get('/admin/sales', authenticateToken, authorizeRoles('admin', 'super_admin', 'employee'), async (req, res) => {
  const period = req.query.period || 'monthly';
  try {
    const attWhere = periodWhere(period, 'a.check_in_time');
    const ordWhere = periodWhere(period, 'o.created_at');

    // Attendance sales (daily passes only, ₱40 each)
    const [attRows] = await pool.query(
      `SELECT
          DATE(a.check_in_time) AS sale_date,
          COUNT(*) AS count,
          SUM(CASE WHEN a.membership_type = 'daily' THEN 40.00 ELSE 0.00 END) AS revenue
       FROM attendance a
       WHERE ${attWhere} AND a.payment_status = 'paid'
       GROUP BY DATE(a.check_in_time)
       ORDER BY sale_date DESC`
    );

    // Shop/inventory sales (approved orders)
    const [ordRows] = await pool.query(
      `SELECT
          DATE(o.created_at) AS sale_date,
          COUNT(*) AS count,
          SUM(o.total) AS revenue
       FROM orders o
       WHERE ${ordWhere} AND o.status = 'approved'
       GROUP BY DATE(o.created_at)
       ORDER BY sale_date DESC`
    );

    // Grand totals
    const [[attTotal]] = await pool.query(
      `SELECT
          COUNT(*) AS total_checkins,
          SUM(CASE WHEN membership_type='daily' AND payment_status='paid' THEN 40.00 ELSE 0 END) AS gym_revenue
       FROM attendance WHERE ${attWhere}`
    );
    const [[ordTotal]] = await pool.query(
      `SELECT COUNT(*) AS total_orders, COALESCE(SUM(total),0) AS shop_revenue
       FROM orders WHERE ${ordWhere} AND status='approved'`
    );

    res.json({
      attendanceSales: attRows,
      shopSales: ordRows,
      summary: {
        gymRevenue: Number(attTotal.gym_revenue || 0),
        shopRevenue: Number(ordTotal.shop_revenue || 0),
        totalRevenue: Number(attTotal.gym_revenue || 0) + Number(ordTotal.shop_revenue || 0),
        totalCheckins: attTotal.total_checkins,
        totalOrders: ordTotal.total_orders,
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── ADMIN: Inventory Summary ──────────────────────────────────────────────────
/**
 * GET /api/reports/admin/inventory
 * Returns all products with their current stock and total units sold.
 */
router.get('/admin/inventory', authenticateToken, authorizeRoles('admin', 'super_admin', 'employee'), async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
          p.id,
          p.name,
          p.brand,
          p.price,
          p.stock AS current_stock,
          COALESCE(SUM(CASE WHEN o.status = 'approved' THEN o.quantity ELSE 0 END), 0) AS total_sold,
          COALESCE(SUM(CASE WHEN o.status = 'approved' THEN o.total ELSE 0 END), 0) AS total_revenue
       FROM products p
       LEFT JOIN orders o ON o.product_id = p.id
       GROUP BY p.id
       ORDER BY total_sold DESC`
    );

    const totalStock = rows.reduce((s, r) => s + Number(r.current_stock), 0);
    const totalSold = rows.reduce((s, r) => s + Number(r.total_sold), 0);
    const totalRevenue = rows.reduce((s, r) => s + Number(r.total_revenue), 0);

    res.json({ rows, summary: { totalStock, totalSold, totalRevenue } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
