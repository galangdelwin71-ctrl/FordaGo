const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

function toNonNegativeNumber(value, fallback = 0) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return parsed;
}

// ── Products ──────────────────────────────────────────────────────────────────

// GET all products (any authenticated user can browse)
router.get('/products', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST add product (admin only)
router.post('/products', authenticateToken, authorizeRoles('admin', 'super_admin', 'employee'), async (req, res) => {
  const { name, brand, price, stock, image_url } = req.body;
  if (!name) return res.status(400).json({ message: 'Product name is required' });
  const safePrice = toNonNegativeNumber(price, 0);
  const safeStock = Math.floor(toNonNegativeNumber(stock, 0));

  if (safeStock < 0 || safePrice < 0) {
    return res.status(400).json({ message: 'Price and stock cannot be negative.' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO products (name, brand, price, stock, image_url) VALUES (?, ?, ?, ?, ?)',
      [name, brand || null, safePrice, safeStock, image_url || null]
    );
    const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT update product (admin only)
router.put('/products/:id', authenticateToken, authorizeRoles('admin', 'super_admin', 'employee'), async (req, res) => {
  const { name, brand, price, stock, image_url } = req.body;
  const safePrice = toNonNegativeNumber(price, 0);
  const safeStock = Math.floor(toNonNegativeNumber(stock, 0));

  if (safeStock < 0 || safePrice < 0) {
    return res.status(400).json({ message: 'Price and stock cannot be negative.' });
  }

  try {
    await pool.query(
      'UPDATE products SET name = ?, brand = ?, price = ?, stock = ?, image_url = ? WHERE id = ?',
      [name, brand || null, safePrice, safeStock, image_url || null, req.params.id]
    );
    res.json({ message: 'Product updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE product (admin only)
router.delete('/products/:id', authenticateToken, authorizeRoles('admin', 'super_admin', 'employee'), async (req, res) => {
  try {
    await pool.query('DELETE FROM products WHERE id = ?', [req.params.id]);
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ── Orders ────────────────────────────────────────────────────────────────────

// GET my orders (current user only) -- each row carries its own
// order_group_id/payment_method/group status so the frontend can pack
// items from the same checkout together.
router.get('/my-orders', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT o.*, p.name AS product_name_db, g.payment_method AS group_payment_method,
              g.status AS group_status, g.total AS group_total, g.created_at AS group_created_at
       FROM orders o
       LEFT JOIN products p ON o.product_id = p.id
       LEFT JOIN order_groups g ON o.order_group_id = g.id
       WHERE o.user_id = ?
       ORDER BY o.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET all orders (admin only) -- flat line-item rows; the admin frontend
// packs them into one card per order_group_id so a multi-item checkout
// shows up as a single order instead of N separate rows.
router.get('/orders', authenticateToken, authorizeRoles('admin', 'super_admin', 'employee'), async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT o.*, u.username, u.email, p.name AS product_name,
              g.payment_method AS group_payment_method, g.status AS group_status,
              g.total AS group_total, g.created_at AS group_created_at
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       LEFT JOIN products p ON o.product_id = p.id
       LEFT JOIN order_groups g ON o.order_group_id = g.id
       ORDER BY o.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST checkout the cart (any authenticated user).
// Body: { items: [{ product_id, quantity }, ...], payment_method: 'cash' | 'gcash' }
// Places every cart line as one atomic "order group": every item's stock is
// locked (SELECT ... FOR UPDATE) and re-validated inside a single
// transaction, so two members racing for the last unit can never both
// succeed, and a failure on any one item rolls back the entire checkout
// (nothing is charged/decremented) instead of partially placing the cart.
router.post('/cart/checkout', authenticateToken, async (req, res) => {
  const items = Array.isArray(req.body?.items) ? req.body.items : [];
  const paymentMethod = req.body?.payment_method === 'gcash' ? 'gcash' : 'cash';

  if (items.length === 0) {
    return res.status(400).json({ message: 'Your cart is empty.' });
  }
  if (items.length > 50) {
    return res.status(400).json({ message: 'Too many items in one checkout.' });
  }

  // Normalize + validate shape before touching the database.
  const normalizedItems = [];
  for (const item of items) {
    const productId = Number(item?.product_id);
    const quantity = Math.floor(toNonNegativeNumber(item?.quantity, 0));
    if (!Number.isFinite(productId) || productId <= 0) {
      return res.status(400).json({ message: 'Invalid product in cart.' });
    }
    if (quantity < 1) {
      return res.status(400).json({ message: 'Quantity must be at least 1 for every item.' });
    }
    normalizedItems.push({ productId, quantity });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    let groupTotal = 0;
    const lineItems = [];

    for (const { productId, quantity } of normalizedItems) {
      // Row-level lock: prevents a concurrent checkout from reading the
      // same stock value before this transaction commits its decrement.
      const [productRows] = await conn.query('SELECT * FROM products WHERE id = ? FOR UPDATE', [productId]);
      if (!productRows.length) {
        throw Object.assign(new Error(`Product #${productId} is no longer available.`), { statusCode: 404 });
      }
      const product = productRows[0];
      if (product.stock < quantity) {
        throw Object.assign(
          new Error(`Not enough stock for "${product.name}" (only ${product.stock} left).`),
          { statusCode: 409 }
        );
      }

      const lineTotal = Number(product.price) * quantity;
      groupTotal += lineTotal;
      lineItems.push({ productId, quantity, lineTotal });

      await conn.query('UPDATE products SET stock = stock - ? WHERE id = ?', [quantity, productId]);
    }

    const [groupResult] = await conn.query(
      'INSERT INTO order_groups (user_id, payment_method, total, status) VALUES (?, ?, ?, ?)',
      [req.user.id, paymentMethod, groupTotal, 'pending']
    );
    const orderGroupId = groupResult.insertId;

    for (const line of lineItems) {
      await conn.query(
        'INSERT INTO orders (user_id, product_id, order_group_id, quantity, total, payment_method, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [req.user.id, line.productId, orderGroupId, line.quantity, line.lineTotal, paymentMethod, 'pending']
      );
    }

    await conn.commit();
    res.status(201).json({ id: orderGroupId, total: groupTotal, message: 'Order placed' });
  } catch (err) {
    await conn.rollback();
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({ message: statusCode === 500 ? 'Server error' : err.message });
  } finally {
    conn.release();
  }
});

// PUT cancel an order group (member cancels their own order).
// Only allowed while the group is still 'pending' -- once an admin has
// approved/rejected it, payment has already been handled at the counter
// and the member can no longer self-cancel. Restocks every item in the
// group inside the same transaction that flips the status, so stock is
// never lost/duplicated on a mid-request failure.
router.put('/order-groups/:id/cancel', authenticateToken, async (req, res) => {
  const groupId = Number(req.params.id);
  if (!Number.isFinite(groupId) || groupId <= 0) {
    return res.status(400).json({ message: 'Invalid order id.' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [groupRows] = await conn.query('SELECT * FROM order_groups WHERE id = ? FOR UPDATE', [groupId]);
    if (!groupRows.length) {
      throw Object.assign(new Error('Order not found.'), { statusCode: 404 });
    }
    const group = groupRows[0];
    if (group.user_id !== req.user.id) {
      throw Object.assign(new Error('You can only cancel your own orders.'), { statusCode: 403 });
    }
    if (group.status !== 'pending') {
      throw Object.assign(new Error('This order can no longer be cancelled.'), { statusCode: 409 });
    }

    const [orderRows] = await conn.query('SELECT * FROM orders WHERE order_group_id = ?', [groupId]);
    for (const order of orderRows) {
      if (order.product_id) {
        await conn.query('UPDATE products SET stock = stock + ? WHERE id = ?', [order.quantity, order.product_id]);
      }
    }
    await conn.query("UPDATE orders SET status = 'cancelled' WHERE order_group_id = ?", [groupId]);
    await conn.query("UPDATE order_groups SET status = 'cancelled' WHERE id = ?", [groupId]);

    await conn.commit();
    res.json({ message: 'Order cancelled' });
  } catch (err) {
    await conn.rollback();
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({ message: statusCode === 500 ? 'Server error' : err.message });
  } finally {
    conn.release();
  }
});

// PUT approve an order group (admin only) -- payment confirmed at counter.
router.put('/order-groups/:id/approve', authenticateToken, authorizeRoles('admin', 'super_admin', 'employee'), async (req, res) => {
  const groupId = Number(req.params.id);
  if (!Number.isFinite(groupId) || groupId <= 0) {
    return res.status(400).json({ message: 'Invalid order id.' });
  }
  try {
    const [result] = await pool.query(
      "UPDATE order_groups SET status = 'approved' WHERE id = ? AND status = 'pending'",
      [groupId]
    );
    if (result.affectedRows === 0) {
      return res.status(409).json({ message: 'Order was already handled or does not exist.' });
    }
    await pool.query("UPDATE orders SET status = 'approved' WHERE order_group_id = ?", [groupId]);
    res.json({ message: 'Order approved' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT reject an order group (admin only) -- restocks every item since the
// customer never received the goods.
router.put('/order-groups/:id/reject', authenticateToken, authorizeRoles('admin', 'super_admin', 'employee'), async (req, res) => {
  const groupId = Number(req.params.id);
  if (!Number.isFinite(groupId) || groupId <= 0) {
    return res.status(400).json({ message: 'Invalid order id.' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [groupRows] = await conn.query('SELECT * FROM order_groups WHERE id = ? FOR UPDATE', [groupId]);
    if (!groupRows.length) {
      throw Object.assign(new Error('Order not found.'), { statusCode: 404 });
    }
    if (groupRows[0].status !== 'pending') {
      throw Object.assign(new Error('Order was already handled.'), { statusCode: 409 });
    }

    const [orderRows] = await conn.query('SELECT * FROM orders WHERE order_group_id = ?', [groupId]);
    for (const order of orderRows) {
      if (order.product_id) {
        await conn.query('UPDATE products SET stock = stock + ? WHERE id = ?', [order.quantity, order.product_id]);
      }
    }
    await conn.query("UPDATE orders SET status = 'rejected' WHERE order_group_id = ?", [groupId]);
    await conn.query("UPDATE order_groups SET status = 'rejected' WHERE id = ?", [groupId]);

    await conn.commit();
    res.json({ message: 'Order rejected' });
  } catch (err) {
    await conn.rollback();
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({ message: statusCode === 500 ? 'Server error' : err.message });
  } finally {
    conn.release();
  }
});

module.exports = router;
