  -- MySQL schema for FordaGO app
CREATE DATABASE IF NOT EXISTS fordago;
USE fordago;

-- Users table

-- Users table (with email)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  first_name VARCHAR(80) DEFAULT NULL,
  last_name VARCHAR(80) DEFAULT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'user') NOT NULL DEFAULT 'user',
  phone VARCHAR(20) DEFAULT NULL,
  gender ENUM('male', 'female', 'other') DEFAULT NULL,
  profile_image LONGTEXT DEFAULT NULL,
  membership_type ENUM('daily', 'premium') NOT NULL DEFAULT 'premium',
  membership_status ENUM('pending', 'active') NOT NULL DEFAULT 'pending',
  payment_method ENUM('cash', 'gcash') NOT NULL DEFAULT 'cash',
  membership_expiry DATE DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Workouts table (for dashboard)
CREATE TABLE IF NOT EXISTS workouts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Schedule table
CREATE TABLE IF NOT EXISTS schedule (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  workout_id INT,
  scheduled_date DATE NOT NULL,
  status ENUM('pending', 'completed', 'cancelled') DEFAULT 'pending',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE SET NULL
);

-- Admin notifications table (example for admin side)
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT DEFAULT NULL,
  title VARCHAR(255) NOT NULL DEFAULT 'Notice',
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  check_in_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  membership_type ENUM('daily', 'premium') NOT NULL DEFAULT 'premium',
  payment_status ENUM('pending', 'paid') NOT NULL DEFAULT 'paid',
  confirmed_by INT DEFAULT NULL,
  confirmed_at DATETIME DEFAULT NULL,
  notes TEXT DEFAULT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Products table (inventory)
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  brand VARCHAR(255) DEFAULT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  stock INT NOT NULL DEFAULT 0,
  image_url LONGTEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Order Groups table (one row per checkout / cart purchase)
CREATE TABLE IF NOT EXISTS order_groups (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  payment_method ENUM('cash','gcash') NOT NULL DEFAULT 'cash',
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  status ENUM('pending','approved','rejected','cancelled') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Orders table (one row per line item; always belongs to an order_group)
CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  product_id INT DEFAULT NULL,
  order_group_id INT DEFAULT NULL,
  quantity INT NOT NULL DEFAULT 1,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  payment_method ENUM('cash','gcash') NOT NULL DEFAULT 'cash',
  status ENUM('pending', 'approved', 'rejected', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
  FOREIGN KEY (order_group_id) REFERENCES order_groups(id) ON DELETE CASCADE
);

-- Equipment table
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
);

-- Equipment scan logs table (who scanned what and when)
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
);

-- Sessions table (class schedule)
CREATE TABLE IF NOT EXISTS sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  time TIME DEFAULT NULL,
  location VARCHAR(255) DEFAULT NULL,
  coach VARCHAR(100) DEFAULT NULL
);
