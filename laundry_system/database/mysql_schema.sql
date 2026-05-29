CREATE DATABASE IF NOT EXISTS laundry_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE laundry_system;

CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    password VARCHAR(128) NOT NULL,
    last_login DATETIME NULL,
    is_superuser BOOLEAN NOT NULL DEFAULT FALSE,
    username VARCHAR(150) NOT NULL UNIQUE,
    first_name VARCHAR(150) NOT NULL,
    last_name VARCHAR(150) NOT NULL,
    email VARCHAR(254) NOT NULL UNIQUE,
    is_staff BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    date_joined DATETIME NOT NULL,
    phone_number VARCHAR(15) DEFAULT NULL,
    hostel_apartment VARCHAR(255) DEFAULT NULL,
    address TEXT,
    city VARCHAR(100),
    profile_image VARCHAR(100),
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    total_bookings INT NOT NULL DEFAULT 0,
    total_spent DECIMAL(10,2) NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    INDEX idx_users_email (email),
    INDEX idx_users_username (username)
);

CREATE TABLE admin_users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    role VARCHAR(50) NOT NULL,
    permissions JSON NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE laundry_types (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    price_per_item DECIMAL(5,2) NOT NULL,
    icon VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL
);

CREATE TABLE delivery_preferences (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    extra_charge DECIMAL(5,2) NOT NULL DEFAULT 0,
    estimated_days INT NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE laundry_bookings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    booking_id VARCHAR(20) NOT NULL UNIQUE,
    user_id BIGINT NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(15) NOT NULL,
    hostel_apartment VARCHAR(255) NOT NULL,
    laundry_type_id BIGINT,
    num_clothes INT NOT NULL,
    delivery_preference_id BIGINT,
    special_instructions TEXT,
    pickup_date DATETIME NOT NULL,
    estimated_delivery DATETIME NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    gst DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) NOT NULL,
    current_stage INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (laundry_type_id) REFERENCES laundry_types(id) ON DELETE SET NULL,
    FOREIGN KEY (delivery_preference_id) REFERENCES delivery_preferences(id) ON DELETE SET NULL,
    INDEX idx_booking_user (user_id),
    INDEX idx_booking_status (status),
    INDEX idx_booking_booking_id (booking_id)
);

CREATE TABLE order_tracking (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    booking_id BIGINT NOT NULL UNIQUE,
    confirmed_at DATETIME,
    pickup_assigned_at DATETIME,
    picked_up_at DATETIME,
    washing_started_at DATETIME,
    drying_started_at DATETIME,
    ready_at DATETIME,
    delivered_at DATETIME,
    pickup_staff VARCHAR(255),
    delivery_staff VARCHAR(255),
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    FOREIGN KEY (booking_id) REFERENCES laundry_bookings(id) ON DELETE CASCADE
);

CREATE TABLE booking_notes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    booking_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME NOT NULL,
    FOREIGN KEY (booking_id) REFERENCES laundry_bookings(id) ON DELETE CASCADE
);

CREATE TABLE payments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    payment_id VARCHAR(50) NOT NULL UNIQUE,
    booking_id BIGINT NOT NULL UNIQUE,
    user_id BIGINT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    tax DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    transaction_id VARCHAR(100),
    receipt_url VARCHAR(255),
    payment_date DATETIME,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    FOREIGN KEY (booking_id) REFERENCES laundry_bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_payment_status (status)
);

CREATE TABLE payment_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    payment_id BIGINT NOT NULL,
    status VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    created_at DATETIME NOT NULL,
    FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE
);

CREATE TABLE notifications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    booking_id BIGINT,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(30) NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at DATETIME,
    icon VARCHAR(50),
    action_url VARCHAR(255),
    created_at DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (booking_id) REFERENCES laundry_bookings(id) ON DELETE SET NULL,
    INDEX idx_notification_user (user_id),
    INDEX idx_notification_read (user_id, is_read)
);
