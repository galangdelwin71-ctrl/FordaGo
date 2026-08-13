const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { sendSms, normalizePhoneNumber } = require('../services/sms');

function formatHomeWorkoutList(exercises) {
  const lines = (Array.isArray(exercises) ? exercises : [])
    .map((item) => String(item || '').trim())
    .filter(Boolean)
    .slice(0, 4);

  if (!lines.length) {
    return 'Open Schedule to view your home workout alternatives.';
  }

  return `Home workout:\n${lines.map((line, index) => `${index + 1}) ${line}`).join('\n')}`;
}

// GET notifications — admin gets all, regular user gets their own + broadcasts (user_id IS NULL)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const isStaff = ['admin', 'super_admin', 'employee'].includes(req.user.role);
    let rows;
    if (isStaff) {
      [rows] = await pool.query('SELECT * FROM notifications ORDER BY created_at DESC');
    } else {
      [rows] = await pool.query(
        'SELECT * FROM notifications WHERE user_id = ? OR user_id IS NULL ORDER BY created_at DESC',
        [req.user.id]
      );
    }
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST send notification (admin can send to anyone; member can only send to self)
router.post('/', authenticateToken, async (req, res) => {
  const { user_id, title, message } = req.body;
  if (!message) return res.status(400).json({ message: 'Message is required' });

  const isAdmin = ['admin', 'super_admin', 'employee'].includes(req.user.role);
  // Non-admin users can only create notifications addressed to themselves
  const targetUserId = isAdmin ? (user_id || null) : req.user.id;

  try {
    const [result] = await pool.query(
      'INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)',
      [targetUserId, title || 'Notice', message]
    );
    res.status(201).json({ id: result.insertId, message: 'Notification sent' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST missed workout alert (member -> self only)
router.post('/missed-workout-alert', authenticateToken, async (req, res) => {
  const sessionTitle = String(req.body?.sessionTitle || '').trim();
  const dayLabel = String(req.body?.dayLabel || '').trim();
  const homeExercises = Array.isArray(req.body?.homeExercises) ? req.body.homeExercises : [];

  if (!sessionTitle || !dayLabel) {
    return res.status(400).json({ message: 'sessionTitle and dayLabel are required.' });
  }

  const title = `Missed Workout: ${sessionTitle}`;
  const body = [
    `You missed your ${sessionTitle} session on ${dayLabel}.`,
    formatHomeWorkoutList(homeExercises),
  ].join('\n\n');

  try {
    await pool.query(
      'INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)',
      [req.user.id, title, body]
    );

    const [rows] = await pool.query('SELECT phone, username FROM users WHERE id = ? LIMIT 1', [req.user.id]);
    const phone = rows?.[0]?.phone ? normalizePhoneNumber(rows[0].phone) : '';
    const username = rows?.[0]?.username || 'Member';

    let smsResult = { sent: false, skippedReason: 'No phone number on file' };
    if (phone) {
      const previewExercises = homeExercises
        .map((item) => String(item || '').trim())
        .filter(Boolean)
        .slice(0, 2)
        .join(' | ');
      const smsMessage = previewExercises
        ? `FordaGO: Hi ${username}, you missed ${sessionTitle} (${dayLabel}). Home workout: ${previewExercises}. Open app for full guide.`
        : `FordaGO: Hi ${username}, you missed ${sessionTitle} (${dayLabel}). Open app for your home workout guide.`;

      smsResult = await sendSms({ to: phone, message: smsMessage });
    }

    res.status(201).json({
      message: 'Missed workout alert delivered.',
      smsSent: Boolean(smsResult.sent),
      smsReason: smsResult.sent ? null : (smsResult.skippedReason || smsResult.error || 'SMS not sent'),
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH mark notifications as read (member marks their own)
router.patch('/read', authenticateToken, async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ message: 'ids array is required' });
  }
  try {
    const placeholders = ids.map(() => '?').join(',');
    await pool.query(
      `UPDATE notifications SET is_read = 1 WHERE id IN (${placeholders}) AND (user_id = ? OR user_id IS NULL)`,
      [...ids, req.user.id]
    );
    res.json({ message: 'Marked as read' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE notification (admin only)
router.delete('/:id', authenticateToken, authorizeRoles('admin', 'super_admin', 'employee'), async (req, res) => {
  try {
    await pool.query('DELETE FROM notifications WHERE id = ?', [req.params.id]);
    res.json({ message: 'Notification deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
