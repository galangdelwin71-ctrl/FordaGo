const pool = require('./db');

async function runMigrations() {
  const conn = await pool.getConnection();

  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        first_name VARCHAR(80) DEFAULT NULL,
        last_name VARCHAR(80) DEFAULT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'user') NOT NULL DEFAULT 'user',
        phone VARCHAR(20) DEFAULT NULL,
        gender ENUM('male','female','other') DEFAULT NULL,
        profile_image LONGTEXT DEFAULT NULL,
        membership_type ENUM('daily','premium') NOT NULL DEFAULT 'premium',
        membership_status ENUM('pending','active') NOT NULL DEFAULT 'pending',
        payment_method ENUM('cash','gcash') NOT NULL DEFAULT 'cash',
        membership_expiry DATE DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT DEFAULT NULL,
        title VARCHAR(255) NOT NULL DEFAULT 'Notice',
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    const alters = [
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20) DEFAULT NULL",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name VARCHAR(80) DEFAULT NULL",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name VARCHAR(80) DEFAULT NULL",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS gender ENUM('male','female','other') DEFAULT NULL",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image LONGTEXT DEFAULT NULL",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS membership_type ENUM('daily','premium') NOT NULL DEFAULT 'premium'",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS membership_status ENUM('pending','active') NOT NULL DEFAULT 'pending'",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS payment_method ENUM('cash','gcash') NOT NULL DEFAULT 'cash'",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS membership_expiry DATE DEFAULT NULL",
      "ALTER TABLE notifications ADD COLUMN IF NOT EXISTS title VARCHAR(255) NOT NULL DEFAULT 'Notice'",
    ];

    for (const sql of alters) {
      await conn.query(sql);
    }

    // Products table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        brand VARCHAR(255) DEFAULT NULL,
        price DECIMAL(10,2) NOT NULL DEFAULT 0,
        stock INT NOT NULL DEFAULT 0,
        image_url LONGTEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add image_url if table already exists without it
    await conn.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url LONGTEXT DEFAULT NULL`);

    // Orders table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        product_id INT DEFAULT NULL,
        quantity INT NOT NULL DEFAULT 1,
        total DECIMAL(10,2) NOT NULL DEFAULT 0,
        status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS attendance (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        check_in_time DATETIME DEFAULT CURRENT_TIMESTAMP,
        membership_type ENUM('daily','premium') NOT NULL DEFAULT 'premium',
        payment_status ENUM('pending','paid') NOT NULL DEFAULT 'paid',
        confirmed_by INT DEFAULT NULL,
        confirmed_at DATETIME DEFAULT NULL,
        notes TEXT DEFAULT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS equipment (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100) DEFAULT NULL,
        icon VARCHAR(100) DEFAULT NULL,
        status ENUM('available','unavailable','maintenance') NOT NULL DEFAULT 'available',
        image_url MEDIUMTEXT DEFAULT NULL,
        description TEXT DEFAULT NULL,
        weight_scale VARCHAR(255) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await conn.query(`
      ALTER TABLE equipment
      MODIFY COLUMN status ENUM('available','unavailable','maintenance') NOT NULL DEFAULT 'available'
    `);

    await conn.query(`
      ALTER TABLE equipment
      ADD COLUMN IF NOT EXISTS image_url MEDIUMTEXT DEFAULT NULL
    `);

    await conn.query(`
      ALTER TABLE equipment
      ADD COLUMN IF NOT EXISTS description TEXT DEFAULT NULL
    `);

    await conn.query(`
      ALTER TABLE equipment
      ADD COLUMN IF NOT EXISTS weight_scale VARCHAR(255) DEFAULT NULL
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS equipment_scan_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        equipment_id INT DEFAULT NULL,
        equipment_code VARCHAR(120) DEFAULT NULL,
        equipment_name VARCHAR(255) NOT NULL,
        raw_qr TEXT DEFAULT NULL,
        scanned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE SET NULL
      )
    `);

    await conn.query(`ALTER TABLE equipment ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
    await conn.query(`ALTER TABLE equipment ADD COLUMN IF NOT EXISTS image_url MEDIUMTEXT DEFAULT NULL`);
    await conn.query(`ALTER TABLE equipment ADD COLUMN IF NOT EXISTS description TEXT DEFAULT NULL`);
    await conn.query(`ALTER TABLE equipment ADD COLUMN IF NOT EXISTS weight_scale VARCHAR(255) DEFAULT NULL`);

    // Expand role ENUM to include super_admin and employee
    await conn.query(`
      ALTER TABLE users MODIFY COLUMN role ENUM('admin','user','super_admin','employee') NOT NULL DEFAULT 'user'
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        date DATE NOT NULL,
        time TIME DEFAULT NULL,
        location VARCHAR(255) DEFAULT NULL,
        coach VARCHAR(100) DEFAULT NULL
      )
    `);

    // ── Order Groups (a single "checkout" / cart purchase) ──────────────
    // One row per checkout. Each `orders` row now belongs to exactly one
    // order_group -- this lets a member add several products to a cart and
    // pay/cancel/track them together as a single transaction, while the
    // admin side can show one packed card per checkout instead of one row
    // per line item.
    await conn.query(`
      CREATE TABLE IF NOT EXISTS order_groups (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        payment_method ENUM('cash','gcash') NOT NULL DEFAULT 'cash',
        total DECIMAL(10,2) NOT NULL DEFAULT 0,
        status ENUM('pending','approved','rejected','cancelled') NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Extend `orders` to reference its checkout group, record the payment
    // method actually chosen (previously never persisted -- the frontend
    // just assumed "cash" for every historical order), and allow
    // 'completed' / 'cancelled' statuses which the app already expects.
    await conn.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_group_id INT DEFAULT NULL`);
    await conn.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method ENUM('cash','gcash') NOT NULL DEFAULT 'cash'`);
    await conn.query(`
      ALTER TABLE orders
      MODIFY COLUMN status ENUM('pending','approved','rejected','completed','cancelled') NOT NULL DEFAULT 'pending'
    `);

    // Add the FK separately and swallow "already exists" so this stays
    // idempotent across repeated boots (MySQL has no ADD CONSTRAINT IF NOT
    // EXISTS syntax).
    try {
      await conn.query(`
        ALTER TABLE orders
        ADD CONSTRAINT fk_orders_order_group
        FOREIGN KEY (order_group_id) REFERENCES order_groups(id) ON DELETE CASCADE
      `);
    } catch (fkError) {
      if (fkError.code !== 'ER_DUP_KEYNAME' && fkError.code !== 'ER_FK_DUP_NAME' && !/Duplicate/i.test(fkError.message || '')) {
        throw fkError;
      }
    }

    // Backfill: every order placed before this feature existed has
    // order_group_id = NULL. Wrap each one in its own single-item group so
    // the rest of the app can always assume "an order belongs to a group"
    // with no special-casing. After the first pass there are no more NULL
    // rows left, so this is safe to leave in the startup migration
    // permanently (idempotent).
    const [legacyOrders] = await conn.query(
      `SELECT id, user_id, total, status, created_at FROM orders WHERE order_group_id IS NULL`
    );
    for (const legacyOrder of legacyOrders) {
      const backfillStatus = ['approved', 'rejected', 'cancelled'].includes(legacyOrder.status)
        ? legacyOrder.status
        : 'pending';
      const [groupResult] = await conn.query(
        `INSERT INTO order_groups (user_id, payment_method, total, status, created_at) VALUES (?, 'cash', ?, ?, ?)`,
        [legacyOrder.user_id, legacyOrder.total, backfillStatus, legacyOrder.created_at]
      );
      await conn.query(`UPDATE orders SET order_group_id = ? WHERE id = ?`, [groupResult.insertId, legacyOrder.id]);
    }

    // Forgot-password one-time codes (email or SMS delivery)
    await conn.query(`
      CREATE TABLE IF NOT EXISTS password_resets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        channel ENUM('email','sms') NOT NULL,
        destination VARCHAR(150) NOT NULL,
        code_hash VARCHAR(128) NOT NULL,
        expires_at DATETIME NOT NULL,
        attempts INT NOT NULL DEFAULT 0,
        verified_at DATETIME DEFAULT NULL,
        password_changed_at DATETIME DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
  } finally {
    conn.release();
  }
}

module.exports = { runMigrations };

if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('All migrations done.');
      process.exit(0);
    })
    .catch((error) => {
      console.error(error.message);
      process.exit(1);
    });
}
