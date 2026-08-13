const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Get all workouts for current user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM workouts WHERE user_id = ?', [req.user.id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add a workout for current user
router.post('/', authenticateToken, async (req, res) => {
  const { name, description, date } = req.body;
  try {
    await pool.query('INSERT INTO workouts (user_id, name, description, date) VALUES (?, ?, ?, ?)', [req.user.id, name, description, date]);
    res.json({ message: 'Workout added' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: get all workouts
router.get('/all', authenticateToken, authorizeRoles('admin', 'super_admin', 'employee'), async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM workouts');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
