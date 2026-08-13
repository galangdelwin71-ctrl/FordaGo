const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// GET all sessions (any authenticated user can view the class schedule)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM sessions ORDER BY date ASC, time ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST create a session (admin only)
router.post('/', authenticateToken, authorizeRoles('admin', 'super_admin', 'employee'), async (req, res) => {
  const { title, date, time, location, coach } = req.body;
  if (!title || !date) return res.status(400).json({ message: 'Title and date are required' });
  try {
    const [result] = await pool.query(
      'INSERT INTO sessions (title, date, time, location, coach) VALUES (?, ?, ?, ?, ?)',
      [title, date, time || null, location || null, coach || null]
    );
    const [rows] = await pool.query('SELECT * FROM sessions WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT update a session (admin only)
router.put('/:id', authenticateToken, authorizeRoles('admin', 'super_admin', 'employee'), async (req, res) => {
  const { title, date, time, location, coach } = req.body;
  try {
    await pool.query(
      'UPDATE sessions SET title = ?, date = ?, time = ?, location = ?, coach = ? WHERE id = ?',
      [title, date, time || null, location || null, coach || null, req.params.id]
    );
    res.json({ message: 'Session updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE a session (admin only)
router.delete('/:id', authenticateToken, authorizeRoles('admin', 'super_admin', 'employee'), async (req, res) => {
  try {
    await pool.query('DELETE FROM sessions WHERE id = ?', [req.params.id]);
    res.json({ message: 'Session deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
