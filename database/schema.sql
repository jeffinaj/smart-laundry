-- Smart Laundry Management System schema
CREATE DATABASE IF NOT EXISTS smart_laundry_db;
USE smart_laundry_db;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(24) NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admin_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admins (
  admin_id INT AUTO_INCREMENT PRIMARY KEY,
  admin_name VARCHAR(100) NOT NULL,
  admin_email VARCHAR(255) NOT NULL UNIQUE,
  admin_password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id VARCHAR(24) NOT NULL UNIQUE,
  user_id INT NOT NULL,
  customer_name VARCHAR(100) NOT NULL,
  phone_number VARCHAR(24) NOT NULL,
  booking_type VARCHAR(100) NOT NULL,
  quantity INT NOT NULL,
  weight DECIMAL(6,2) NOT NULL DEFAULT 0.00,
  pickup_date DATE NOT NULL,
  pickup_address VARCHAR(255) NOT NULL,
  delivery_type VARCHAR(50) NOT NULL DEFAULT 'Standard',
  express_delivery TINYINT(1) NOT NULL DEFAULT 0,
  price DECIMAL(10,2) NOT NULL,
  discount_code VARCHAR(50),
  discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  delivery_fee DECIMAL(10,2) NOT NULL DEFAULT 50.00,
  total_amount DECIMAL(10,2) NOT NULL,
  final_amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'Pickup Scheduled',
  payment_status VARCHAR(50) DEFAULT 'pending',
  special_instructions TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tracking (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  current_status VARCHAR(100) NOT NULL,
  notes TEXT,
  updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES bookings(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  user_id INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  transaction_id VARCHAR(100),
  upi_id VARCHAR(100),
  payment_status VARCHAR(50) DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES bookings(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS services (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 5.50,
  express_multiplier DECIMAL(4,2) NOT NULL DEFAULT 1.25,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  order_id INT,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (order_id) REFERENCES bookings(id) ON DELETE SET NULL,
  INDEX idx_user_unread (user_id, is_read),
  INDEX idx_created (created_at DESC)
);

INSERT INTO admin_users (name, email, password)
SELECT 'Admin', 'admin@smartlaundry.com', '$2b$12$3Mc90sL6xM4xUbssJZl/6uSEi0IuOKrv2703LZ5gt7q5wPI9d40FS'
WHERE NOT EXISTS (SELECT 1 FROM admin_users WHERE email = 'admin@smartlaundry.com');

INSERT INTO admins (admin_name, admin_email, admin_password)
SELECT 'Administrator', 'admin@gmail.com', '$2b$12$bdi1m4SRmFBjOziJSCn.Oe.ftZqNM9fv0WmILz4MqP.c7Mz/B9fCC'
WHERE NOT EXISTS (SELECT 1 FROM admins WHERE admin_email = 'admin@gmail.com');

INSERT INTO services (name, description, price, express_multiplier)
SELECT 'Regular Wash', 'Everyday laundry service for shirts, pants and casual wear.', 5.50, 1.25
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Regular Wash');
INSERT INTO services (name, description, price, express_multiplier)
SELECT 'Delicate Care', 'Gentle cycle for silks, wool, and delicate garments.', 7.00, 1.25
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Delicate Care');
INSERT INTO services (name, description, price, express_multiplier)
SELECT 'Heavy Load', 'Extra cleaning power for heavy fabrics and bedding.', 9.00, 1.25
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Heavy Load');
INSERT INTO services (name, description, price, express_multiplier)
SELECT 'Premium Service', 'Premium treatment with stain removal and expert finishing.', 11.50, 1.25
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Premium Service');

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS status VARCHAR(50) NOT NULL DEFAULT 'Pickup Scheduled';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending';

-- Example SQL commands for setup:
-- CREATE DATABASE smart_laundry_db;
-- USE smart_laundry_db;
--
-- CREATE TABLE users (
--   id INT AUTO_INCREMENT PRIMARY KEY,
--   name VARCHAR(100) NOT NULL,
--   email VARCHAR(255) NOT NULL UNIQUE,
--   phone VARCHAR(24) NOT NULL,
--   password VARCHAR(255) NOT NULL,
--   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );
