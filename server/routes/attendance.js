// server/routes/attendance.js
const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const GYM_QR_CODE = 'FORDAGO_GYM_CHECKIN_V1'; // the static QR payload

function parseDate(value) {
  const input = String(value || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input)) return null;
  return input;
}

/**
 * POST /api/attendance/checkin
 * User scans the gym QR → creates an attendance record.
 * - Premium users: immediately paid (no admin confirmation needed)
 * - Daily users: status = pending; admin must confirm payment first
 */
router.post('/checkin', authenticateToken, async (req, res) => {
  const { qr_code } = req.body;

  if (qr_code !== GYM_QR_CODE) {
    return res.status(400).json({ message: 'Invalid QR code. Please scan the official gym QR code.' });
  }

  try {
    const [rows] = await pool.query(
      'SELECT id, username, membership_type, membership_status, membership_expiry FROM users WHERE id = ?',
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'User not found' });

    const user = rows[0];

    // Check if already checked in today
    const today = new Date().toISOString().slice(0, 10);
    const [existing] = await pool.query(
      `SELECT id, payment_status FROM attendance WHERE user_id = ? AND DATE(check_in_time) = ?`,
      [req.user.id, today]
    );
    if (existing.length > 0) {
      return res.status(409).json({
        message: 'Already checked in today.',
        attendance: existing[0],
      });
    }

    if (user.membership_status !== 'active') {
      const pendingMessage = user.membership_type === 'premium'
        ? 'Your Premium account is pending admin payment verification. Please wait for approval.'
        : 'Your Daily Pass account is pending admin verification. Please wait for approval.';
      return res.status(403).json({ message: pendingMessage });
    }

    // Premium requires a valid expiry date.
    if (user.membership_type === 'premium') {
      if (!user.membership_expiry || new Date(user.membership_expiry) < new Date()) {
        return res.status(403).json({ message: 'Your Premium membership has expired. Please renew at the gym counter.' });
      }
    }

    const paymentStatus = user.membership_type === 'premium' ? 'paid' : 'pending';

    const [result] = await pool.query(
      `INSERT INTO attendance (user_id, membership_type, payment_status) VALUES (?, ?, ?)`,
      [req.user.id, user.membership_type, paymentStatus]
    );

    // For daily users: notify admin
    if (user.membership_type === 'daily') {
      await pool.query(
        `INSERT INTO notifications (user_id, title, message)
         SELECT id, ?, ? FROM users WHERE role = 'admin' LIMIT 1`,
        [
          `Payment Pending: ${user.username}`,
          `${user.username} is requesting check-in (Daily Pass ₱40). Please collect payment and confirm to complete their attendance.`,
        ]
      ).catch(() => {});
    }

    return res.json({
      message: user.membership_type === 'daily'
        ? 'Check-in request submitted. Waiting for admin to confirm your payment.'
        : 'Check-in successful! Welcome to the gym 💪',
      attendance_id: result.insertId,
      payment_status: paymentStatus,
      membership_type: user.membership_type,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * GET /api/attendance/my
 * Returns the current user's attendance records (last 30)
 */
router.get('/my', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT a.*, u.username AS confirmed_by_name
       FROM attendance a
       LEFT JOIN users u ON u.id = a.confirmed_by
       WHERE a.user_id = ?
       ORDER BY a.check_in_time DESC
       LIMIT 30`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * GET /api/attendance/today
 * Returns all check-ins for today (admin only)
 */
router.get('/today', authenticateToken, authorizeRoles('admin', 'super_admin', 'employee'), async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const [rows] = await pool.query(
      `SELECT a.*, u.username, u.email, u.membership_type AS user_plan
       FROM attendance a
       JOIN users u ON u.id = a.user_id
       WHERE DATE(a.check_in_time) = ?
       ORDER BY a.check_in_time DESC`,
      [today]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * GET /api/attendance/by-date?date=YYYY-MM-DD
 * Returns all check-ins for a specific date (admin only)
 */
router.get('/by-date', authenticateToken, authorizeRoles('admin', 'super_admin', 'employee'), async (req, res) => {
  try {
    const date = parseDate(req.query.date) || new Date().toISOString().slice(0, 10);
    const [rows] = await pool.query(
      `SELECT a.*, u.username, u.email, u.membership_type AS user_plan
       FROM attendance a
       JOIN users u ON u.id = a.user_id
       WHERE DATE(a.check_in_time) = ?
       ORDER BY a.check_in_time DESC`,
      [date]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * GET /api/attendance/pending
 * Returns all pending daily-pass check-ins (admin only)
 */
router.get('/pending', authenticateToken, authorizeRoles('admin', 'super_admin', 'employee'), async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT a.*, u.username, u.email, u.phone
       FROM attendance a
       JOIN users u ON u.id = a.user_id
       WHERE a.payment_status = 'pending'
       ORDER BY a.check_in_time DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * PUT /api/attendance/:id/confirm
 * Admin confirms payment → marks attendance as paid
 */
router.put('/:id/confirm', authenticateToken, authorizeRoles('admin', 'super_admin', 'employee'), async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM attendance WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Attendance record not found' });

    await pool.query(
      `UPDATE attendance SET payment_status = 'paid', confirmed_by = ?, confirmed_at = NOW() WHERE id = ?`,
      [req.user.id, req.params.id]
    );

    // Notify the user
    await pool.query(
      `INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)`,
      [
        rows[0].user_id,
        'Check-in Confirmed! ✅',
        'Your ₱40 daily pass payment has been confirmed by the admin. Your attendance has been recorded. Enjoy your workout! 💪',
      ]
    ).catch(() => {});

    res.json({ message: 'Attendance confirmed and payment recorded.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * PUT /api/attendance/:id/reject
 * Admin rejects payment request
 */
router.put('/:id/reject', authenticateToken, authorizeRoles('admin', 'super_admin', 'employee'), async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM attendance WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Attendance record not found' });

    await pool.query('DELETE FROM attendance WHERE id = ?', [req.params.id]);

    await pool.query(
      `INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)`,
      [
        rows[0].user_id,
        'Check-in Rejected',
        'Your check-in request was not confirmed. Please visit the admin counter for assistance.',
      ]
    ).catch(() => {});

    res.json({ message: 'Attendance request rejected.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * GET /api/attendance/qr-code
 * Returns the static QR code value (so the admin page can display it as a QR image)
 */
router.get('/qr-code', authenticateToken, authorizeRoles('admin', 'super_admin', 'employee'), async (req, res) => {
  res.json({ qr_code: GYM_QR_CODE });
});

module.exports = router;
