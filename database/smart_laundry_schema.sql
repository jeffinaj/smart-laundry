-- Smart Laundry System: MySQL schema
-- Includes users, admins, orders, payments, services, notifications

CREATE DATABASE IF NOT EXISTS smart_laundry;
USE smart_laundry;

DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS services;
DROP TABLE IF EXISTS admins;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(24) NOT NULL,
  password VARCHAR(255) NOT NULL,
  status ENUM('active', 'inactive', 'blocked') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE admins (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('super_admin', 'manager', 'staff') NOT NULL DEFAULT 'super_admin',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE services (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 5.50,
  express_multiplier DECIMAL(4,2) NOT NULL DEFAULT 1.25,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE orders (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  service_id INT UNSIGNED NOT NULL,
  quantity INT UNSIGNED NOT NULL DEFAULT 1,
  pickup_date DATE NOT NULL,
  pickup_address VARCHAR(255) NOT NULL,
  express_delivery TINYINT(1) NOT NULL DEFAULT 0,
  price DECIMAL(10,2) NOT NULL,
  discount_code VARCHAR(50),
  discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  delivery_fee DECIMAL(10,2) NOT NULL DEFAULT 50.00,
  total_amount DECIMAL(10,2) NOT NULL,
  status ENUM('Pickup Scheduled','Processing','Ready','Delivered','Cancelled') NOT NULL DEFAULT 'Pickup Scheduled',
  payment_status ENUM('pending','completed','failed','refunded') NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX idx_user_status (user_id, status),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE payments (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id INT UNSIGNED NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_method ENUM('card', 'upi', 'cash', 'netbanking', 'wallet') NOT NULL,
  transaction_id VARCHAR(100),
  upi_id VARCHAR(100),
  payment_status ENUM('pending','completed','failed','refunded') NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_order_payment (order_id, payment_status),
  INDEX idx_user_payment (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE notifications (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  order_id INT UNSIGNED NULL,
  type ENUM('order_placed', 'order_update', 'delivery', 'payment', 'promotion', 'system') NOT NULL DEFAULT 'system',
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  read_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX idx_user_unread (user_id, is_read),
  INDEX idx_type_created (type, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sample data
INSERT INTO users (name, email, phone, password) VALUES
('Priya Sharma', 'priya.sharma@example.com', '+919876543210', 'password123'),
('Rahul Verma', 'rahul.verma@example.com', '+919812345678', 'password123'),
('Aditi Singh', 'aditi.singh@example.com', '+919900112233', 'password123');

INSERT INTO admins (name, email, password, role) VALUES
('Administrator', 'admin@smartlaundry.com', 'adminpassword', 'super_admin'),
('Manish Kumar', 'manish.kumar@example.com', 'managerpassword', 'manager');

INSERT INTO services (name, description, price, express_multiplier) VALUES
('Regular Wash', 'Everyday laundry service for shirts, pants and casual wear.', 250.00, 1.25),
('Delicate Care', 'Gentle cycle for silk, wool, and delicate garments.', 350.00, 1.25),
('Heavy Load', 'Extra cleaning power for heavy fabrics and bedding.', 500.00, 1.25),
('Premium Service', 'Premium treatment with stain removal and expert finishing.', 750.00, 1.25);

INSERT INTO orders (user_id, service_id, quantity, pickup_date, pickup_address, express_delivery, price, discount_code, discount_amount, tax_amount, delivery_fee, total_amount, status, payment_status, notes) VALUES
(1, 1, 3, '2026-05-20', 'Flat 4B, Silver Oak Apartments, Pune', 0, 750.00, 'bulk', 75.00, 33.75, 50.00, 758.75, 'Pickup Scheduled', 'pending', 'Please ring the bell on arrival.'),
(2, 3, 2, '2026-05-19', '98 Lotus Street, Bengaluru', 1, 1000.00, NULL, 0.00, 47.50, 50.00, 1303.75, 'Processing', 'completed', 'Include a separate bag for whites.'),
(3, 4, 1, '2026-05-22', '22 Rosewood Lane, Mumbai', 0, 750.00, 'seasonal', 112.50, 31.88, 50.00, 719.38, 'Ready', 'pending', 'Dry clean only items.');

INSERT INTO payments (order_id, user_id, amount, payment_method, transaction_id, upi_id, payment_status, notes) VALUES
(2, 2, 1303.75, 'upi', 'TXN20260515001', 'rahul@upi', 'completed', 'Paid in full via UPI'),
(1, 1, 400.00, 'card', 'TXN20260515002', NULL, 'pending', 'Deposit paid for pending pickup');

INSERT INTO notifications (user_id, order_id, type, title, message, is_read) VALUES
(1, 1, 'order_placed', 'Order confirmed', 'Your order #1 is confirmed and scheduled for pickup on 2026-05-20.', 0),
(2, 2, 'payment', 'Payment received', 'We have received your payment for order #2. Thank you!', 1),
(3, 3, 'order_update', 'Order ready', 'Your order #3 is ready for delivery. Expect arrival soon.', 0);
