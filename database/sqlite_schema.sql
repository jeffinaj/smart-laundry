-- Smart Laundry System: SQLite schema
-- For development and testing

-- Drop existing tables if they exist
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS services;
DROP TABLE IF EXISTS admin_users;
DROP TABLE IF EXISTS users;

-- Users table
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  password TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Admin users table
CREATE TABLE admin_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'super_admin',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Admins table for new admin auth flow
CREATE TABLE admins (
  admin_id INTEGER PRIMARY KEY AUTOINCREMENT,
  admin_name TEXT NOT NULL,
  admin_email TEXT NOT NULL UNIQUE,
  admin_password TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Services table
CREATE TABLE services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  price REAL DEFAULT 5.50,
  express_multiplier REAL DEFAULT 1.25,
  active INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bookings table (for orders)
CREATE TABLE bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id TEXT NOT NULL UNIQUE,
  user_id INTEGER NOT NULL,
  customer_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  booking_type TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  weight REAL DEFAULT 0.00,
  pickup_date TEXT NOT NULL,
  pickup_address TEXT NOT NULL,
  delivery_type TEXT DEFAULT 'Standard',
  express_delivery INTEGER DEFAULT 0,
  price REAL NOT NULL,
  discount_code TEXT,
  discount_amount REAL DEFAULT 0.00,
  tax_amount REAL DEFAULT 0.00,
  delivery_fee REAL DEFAULT 50.00,
  total_amount REAL,
  final_amount REAL DEFAULT 0.00,
  status TEXT DEFAULT 'Pickup Scheduled',
  payment_status TEXT DEFAULT 'pending',
  special_instructions TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Tracking table
CREATE TABLE tracking (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  current_status TEXT NOT NULL,
  notes TEXT,
  updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES bookings(id)
);

-- Payments table
CREATE TABLE payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  amount REAL NOT NULL,
  payment_method TEXT DEFAULT 'card',
  transaction_id TEXT,
  upi_id TEXT,
  payment_status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Notifications table
CREATE TABLE notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  order_id INTEGER,
  type TEXT DEFAULT 'system',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read INTEGER DEFAULT 0,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (order_id) REFERENCES bookings(id)
);

-- Sample data
INSERT INTO services (name, description, price, express_multiplier) VALUES
('Regular Wash', 'Everyday laundry service for shirts, pants and casual wear.', 250.00, 1.25),
('Delicate Care', 'Gentle cycle for silk, wool, and delicate garments.', 350.00, 1.25),
('Heavy Load', 'Extra cleaning power for heavy fabrics and bedding.', 500.00, 1.25),
('Premium Service', 'Premium treatment with stain removal and expert finishing.', 750.00, 1.25);

INSERT INTO admin_users (name, email, password, role) VALUES
('Administrator', 'admin@smartlaundry.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5YmMxSUaHeW9m', 'super_admin');
INSERT OR IGNORE INTO admins (admin_name, admin_email, admin_password)
VALUES ('Administrator', 'admin@gmail.com', '$2b$12$bdi1m4SRmFBjOziJSCn.Oe.ftZqNM9fv0WmILz4MqP.c7Mz/B9fCC');
