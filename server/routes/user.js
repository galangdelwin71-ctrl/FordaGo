const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcryptjs');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { sendSms, normalizePhoneNumber } = require('../services/sms');

function normalizePhone(value) {
  return String(value || '').replace(/\D/g, '').slice(0, 20);
}

function isValidPhone(value) {
  return /^\d{11}$/.test(value);
}

const STAFF_ROLES = ['admin', 'super_admin', 'employee'];

// Get all users (staff only) — includes membership fields
router.get('/', authenticateToken, authorizeRoles('admin', 'super_admin', 'employee'), async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, username, first_name, last_name, email, role, phone, gender, profile_image, membership_type, membership_status, payment_method, membership_expiry FROM users'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get total user count (staff only)
router.get('/count', authenticateToken, authorizeRoles('admin', 'super_admin', 'employee'), async (req, res) => {
  try {
    const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM users');
    res.json({ total });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current user profile (self)
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, username, first_name, last_name, email, role, phone, gender, profile_image, membership_type, membership_status, payment_method, membership_expiry FROM users WHERE id = ?',
      [req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: create a user directly (active immediately, full details)
router.post('/create', authenticateToken, authorizeRoles('admin', 'super_admin', 'employee'), async (req, res) => {
  const creatorRole = req.user.role;
  const username = String(req.body?.username || '').trim();
  const rawEmail = String(req.body?.email || '').trim().toLowerCase();
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  const rawPhone = String(req.body?.phone || '').trim();
  const phone = normalizePhone(rawPhone);
  const gender = String(req.body?.gender || '').trim().toLowerCase() || null;
  const requestedRole = String(req.body?.role || 'user').trim().toLowerCase();
  const membership_type = req.body?.membership_type === 'daily' ? 'daily' : 'premium';
  const payment_method = req.body?.payment_method === 'gcash' ? 'gcash' : 'cash';

  if (!username || !rawEmail || !password) {
    return res.status(400).json({ message: 'Username, email and password are required.' });
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(rawEmail)) {
    return res.status(400).json({ message: 'Invalid email format.' });
  }
  if (password.length < 8 || password.length > 128) {
    return res.status(400).json({ message: 'Password must be 8-128 characters.' });
  }
  if (rawPhone && !isValidPhone(phone)) {
    return res.status(400).json({ message: 'Phone number must be exactly 11 digits (e.g. 09171234567).' });
  }
  if (gender && !['male', 'female', 'other'].includes(gender)) {
    return res.status(400).json({ message: 'Invalid gender.' });
  }

  // Role permission: super_admin can assign any role, admin can assign employee/user, employee can only assign user
  const allowedRoles = creatorRole === 'super_admin'
    ? ['super_admin', 'admin', 'employee', 'user']
    : creatorRole === 'admin'
      ? ['employee', 'user']
      : ['user'];

  const assignedRole = allowedRoles.includes(requestedRole) ? requestedRole : 'user';

  try {
    const [existing] = await pool.query(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, rawEmail]
    );
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Username or email already exists.' });
    }

    const bcrypt = require('bcryptjs');
    const hashed = await bcrypt.hash(password, 10);
    const membership_status = 'active'; // admin-created accounts are immediately active
    const membership_expiry = membership_type === 'premium'
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
      : null;

    const [result] = await pool.query(
      'INSERT INTO users (username, email, password, role, phone, gender, membership_type, membership_status, payment_method, membership_expiry) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [username, rawEmail, hashed, assignedRole, phone || null, gender, membership_type, membership_status, payment_method, membership_expiry]
    );

    res.status(201).json({ message: 'Account created.', id: result.insertId });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile (self or admin)
router.put('/:id', authenticateToken, async (req, res) => {
  const targetId = parseInt(req.params.id);
  const isAdmin = ['admin', 'super_admin'].includes(req.user.role);
  const isSelf  = req.user.id === targetId;

  if (!isAdmin && !isSelf) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const { username, email, phone, gender, profile_image, role, membership_type, payment_method, membership_expiry } = req.body;
  const firstName = String(req.body?.first_name ?? req.body?.firstName ?? '').trim();
  const lastName = String(req.body?.last_name ?? req.body?.lastName ?? '').trim();
  const normalizedUsername = String(username || `${firstName} ${lastName}`.trim()).trim();
  const phoneProvided = typeof phone !== 'undefined' && String(phone).trim() !== '';
  const normalizedPhone = phoneProvided ? normalizePhone(phone) : null;

  if (phoneProvided && !isValidPhone(normalizedPhone)) {
    return res.status(400).json({ message: 'Phone number must be exactly 11 digits (e.g. 09171234567).' });
  }

  try {
    if (isAdmin) {
      // Admin can update everything including role, membership
      await pool.query(
        `UPDATE users SET username = ?, first_name = COALESCE(?, first_name), last_name = COALESCE(?, last_name), email = ?, role = ?,
         phone = ?, gender = ?, profile_image = ?, membership_type = ?, payment_method = ?, membership_expiry = ?
         WHERE id = ?`,
        [normalizedUsername, firstName || null, lastName || null, email, role || 'user', normalizedPhone, gender || null, profile_image || null,
         membership_type || 'premium', payment_method || 'cash',
         membership_expiry || null, targetId]
      );
    } else {
      // User can only update their own basic info
      await pool.query(
        'UPDATE users SET username = ?, first_name = COALESCE(?, first_name), last_name = COALESCE(?, last_name), email = ?, phone = ?, gender = ?, profile_image = ? WHERE id = ?',
        [normalizedUsername, firstName || null, lastName || null, email, normalizedPhone, gender || null, profile_image || null, targetId]
      );
    }
    res.json({ message: 'User updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: activate/set membership expiry
router.put('/:id/membership', authenticateToken, authorizeRoles('admin', 'super_admin', 'employee'), async (req, res) => {
  const membership_type = req.body?.membership_type === 'daily' ? 'daily' : 'premium';
  const providedExpiry = req.body?.membership_expiry ? String(req.body.membership_expiry) : '';

  try {
    const membership_status = 'active';
    const membership_expiry = membership_type === 'premium'
      ? (providedExpiry || new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)).toISOString().slice(0, 10))
      : null;

    await pool.query(
      'UPDATE users SET membership_type = ?, membership_status = ?, membership_expiry = ? WHERE id = ?',
      [membership_type, membership_status, membership_expiry, req.params.id]
    );

    // Notify user
    const [user] = await pool.query('SELECT username, id, phone FROM users WHERE id = ?', [req.params.id]);
    if (user.length) {
      const username = user[0].username;
      const inAppMessage = membership_type === 'premium'
        ? `Your Premium payment has been verified by admin. You can now log in. Membership valid until ${membership_expiry}.`
        : 'Your Daily Pass account has been verified by admin. You can now log in. Payment is required each time you scan for attendance.';

      await pool.query(
        'INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)',
        [
          user[0].id,
          membership_type === 'premium' ? 'Premium Payment Verified' : 'Account Verified',
          inAppMessage,
        ]
      );

      const smsPhone = normalizePhoneNumber(user[0].phone);
      if (smsPhone) {
        const smsMessage = membership_type === 'premium'
          ? `FordaGO: Hi ${username}, your Premium payment is verified. You can now log in. Membership valid until ${membership_expiry}.`
          : `FordaGO: Hi ${username}, your Daily Pass account is verified. You can now log in. Please pay at each attendance QR scan.`;
        await sendSms({ to: smsPhone, message: smsMessage });
      }
    }

    res.json({ message: 'Membership updated and user notified.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete user (staff)
router.delete('/:id', authenticateToken, authorizeRoles('admin', 'super_admin', 'employee'), async (req, res) => {
  try {
    const targetId = parseInt(req.params.id, 10);
    const [targetRows] = await pool.query('SELECT id, role FROM users WHERE id = ?', [targetId]);
    if (!targetRows.length) return res.status(404).json({ message: 'User not found' });

    const targetRole = targetRows[0].role;
    if (req.user.role === 'employee' && ['admin', 'super_admin'].includes(targetRole)) {
      return res.status(403).json({ message: 'Employees cannot delete admin accounts.' });
    }

    const [result] = await pool.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
