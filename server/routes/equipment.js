const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

function parseDate(value) {
  const input = String(value || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input)) return null;
  return input;
}

function normalizeEquipmentStatus(value) {
  const normalized = String(value || '').trim().toLowerCase();

  if (normalized === 'not available' || normalized === 'unavailable' || normalized === 'notavailable' || normalized === 'in-use' || normalized === 'occupied') {
    return 'unavailable';
  }

  if (normalized === 'available' || normalized === 'maintenance') {
    return normalized;
  }

  return 'available';
}

function normalizeEquipmentText(value) {
  const normalized = String(value || '').trim();
  return normalized || null;
}

// GET all equipment (any authenticated user)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM equipment ORDER BY created_at DESC, id DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST log equipment QR scan (any authenticated user)
router.post('/scan', authenticateToken, async (req, res) => {
  const equipmentCode = String(req.body?.equipment_code || '').trim();
  const equipmentName = String(req.body?.equipment_name || '').trim();
  const rawQr = String(req.body?.raw_qr || '').trim();
  const equipmentIdRaw = req.body?.equipment_id;
  const equipmentId = Number.isInteger(Number(equipmentIdRaw)) ? Number(equipmentIdRaw) : null;

  if (!equipmentName) {
    return res.status(400).json({ message: 'equipment_name is required' });
  }

  try {
    let matchedEquipmentId = equipmentId;

    if (!matchedEquipmentId && equipmentCode) {
      const [rows] = await pool.query(
        `SELECT id FROM equipment WHERE LOWER(name) = LOWER(?) OR LOWER(category) = LOWER(?) LIMIT 1`,
        [equipmentName, equipmentCode]
      );
      if (rows.length) matchedEquipmentId = rows[0].id;
    }

    await pool.query(
      `INSERT INTO equipment_scan_logs (user_id, equipment_id, equipment_code, equipment_name, raw_qr)
       VALUES (?, ?, ?, ?, ?)`,
      [req.user.id, matchedEquipmentId || null, equipmentCode || null, equipmentName, rawQr || null]
    );

    res.status(201).json({ message: 'Equipment scan logged.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET equipment scan logs for a specific date (admin only)
router.get('/scan-logs', authenticateToken, authorizeRoles('admin', 'super_admin', 'employee'), async (req, res) => {
  try {
    const date = parseDate(req.query.date) || new Date().toISOString().slice(0, 10);
    const [rows] = await pool.query(
      `SELECT l.id, l.user_id, u.username, u.email, l.equipment_id, l.equipment_code, l.equipment_name, l.scanned_at
       FROM equipment_scan_logs l
       JOIN users u ON u.id = l.user_id
       WHERE DATE(l.scanned_at) = ?
       ORDER BY l.scanned_at DESC`,
      [date]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Notify all users about new equipment
async function notifyNewEquipment(name) {
  try {
    const [users] = await pool.query('SELECT id FROM users WHERE role = ?', ['user']);
    if (!users.length) return;
    const notifications = users.map(user => [
      user.id,
      `New Equipment Added`,
      `A new equipment "${name}" is now available in the gym!`
    ]);
    await pool.query(
      'INSERT INTO notifications (user_id, title, message) VALUES ?',
      [notifications]
    );
  } catch (err) {
    console.error('Failed to send equipment notifications:', err);
  }
}

// POST add equipment (admin only)
router.post('/', authenticateToken, authorizeRoles('admin', 'super_admin', 'employee'), async (req, res) => {
  const { name, category, icon, status, image_url, description, weight_scale } = req.body;
  if (!name) return res.status(400).json({ message: 'Equipment name is required' });

  const safeName = normalizeEquipmentText(name);
  const safeCategory = normalizeEquipmentText(category);
  const safeIcon = normalizeEquipmentText(icon);
  const safeStatus = normalizeEquipmentStatus(status);
  const safeImageUrl = normalizeEquipmentText(image_url);
  const safeDescription = normalizeEquipmentText(description);
  const safeWeightScale = normalizeEquipmentText(weight_scale);

  try {
    const [result] = await pool.query(
      'INSERT INTO equipment (name, category, icon, status, image_url, description, weight_scale) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [safeName, safeCategory, safeIcon, safeStatus, safeImageUrl, safeDescription, safeWeightScale]
    );
    const newItem = {
      id: result.insertId,
      name: safeName,
      category: safeCategory,
      icon: safeIcon,
      status: safeStatus,
      image_url: safeImageUrl,
      description: safeDescription,
      weight_scale: safeWeightScale
    };
    await notifyNewEquipment(safeName);
    res.status(201).json(newItem);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to add equipment' });
  }
});

// PUT update equipment (admin only)
router.put('/:id', authenticateToken, authorizeRoles('admin', 'super_admin', 'employee'), async (req, res) => {
  const { id } = req.params;
  const { name, category, icon, status, image_url, description, weight_scale } = req.body;
  if (!name) return res.status(400).json({ message: 'Equipment name is required' });

  const safeName = normalizeEquipmentText(name);
  const safeCategory = normalizeEquipmentText(category);
  const safeIcon = normalizeEquipmentText(icon);
  const safeStatus = normalizeEquipmentStatus(status);
  const safeImageUrl = normalizeEquipmentText(image_url);
  const safeDescription = normalizeEquipmentText(description);
  const safeWeightScale = normalizeEquipmentText(weight_scale);

  try {
    await pool.query(
      'UPDATE equipment SET name = ?, category = ?, icon = ?, status = ?, image_url = ?, description = ?, weight_scale = ? WHERE id = ?',
      [safeName, safeCategory, safeIcon, safeStatus, safeImageUrl, safeDescription, safeWeightScale, id]
    );
    res.json({ id: Number(id), name: safeName, category: safeCategory, icon: safeIcon, status: safeStatus, image_url: safeImageUrl, description: safeDescription, weight_scale: safeWeightScale });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update equipment' });
  }
});

// DELETE equipment (admin only)
router.delete('/:id', authenticateToken, authorizeRoles('admin', 'super_admin', 'employee'), async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM equipment WHERE id = ?', [id]);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to delete equipment' });
  }
});

module.exports = router;
