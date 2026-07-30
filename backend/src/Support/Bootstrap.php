<?php

function ensureBackendSchema(PDO $db, string $driver): void {
    $statements = $driver === 'sqlite'
        ? [
            "CREATE TABLE IF NOT EXISTS admins (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                username TEXT UNIQUE,
                password_hash TEXT NOT NULL,
                name TEXT NOT NULL,
                role TEXT DEFAULT 'admin',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )",
            "CREATE TABLE IF NOT EXISTS sessions (
                id TEXT PRIMARY KEY,
                device_type TEXT,
                os TEXT,
                browser TEXT,
                city TEXT,
                state TEXT,
                lat REAL DEFAULT 0,
                lng REAL DEFAULT 0,
                address TEXT,
                pages_viewed TEXT DEFAULT '[]',
                items_viewed TEXT DEFAULT '[]',
                cart_abandoned INTEGER DEFAULT 0,
                orders_placed INTEGER DEFAULT 0,
                first_visit DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_visit DATETIME DEFAULT CURRENT_TIMESTAMP
            )",
            "CREATE TABLE IF NOT EXISTS orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_ref TEXT UNIQUE,
                session_id TEXT,
                user_id INTEGER,
                customer_name TEXT NOT NULL,
                customer_phone TEXT NOT NULL,
                items TEXT NOT NULL,
                subtotal REAL NOT NULL DEFAULT 0,
                delivery_fee REAL NOT NULL DEFAULT 0,
                total REAL NOT NULL DEFAULT 0,
                total_amount REAL NOT NULL DEFAULT 0,
                status TEXT DEFAULT 'pending',
                payment_status TEXT DEFAULT 'pending',
                order_type TEXT DEFAULT 'delivery',
                payment_method TEXT DEFAULT 'bank_transfer',
                pickup_time TEXT,
                payment_reference TEXT,
                admin_note TEXT,
                payment_submitted_at DATETIME,
                payment_reviewed_at DATETIME,
                payment_reviewed_by INTEGER,
                delivery_address TEXT,
                lat REAL DEFAULT 0,
                lng REAL DEFAULT 0,
                notes TEXT,
                receipt_path TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )",
            "CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                phone TEXT,
                address TEXT,
                password_hash TEXT NOT NULL,
                role TEXT DEFAULT 'user',
                biometric_id TEXT,
                biometric_key TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )",
            "CREATE TABLE IF NOT EXISTS reviews (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                order_id INTEGER NOT NULL,
                product_id TEXT NOT NULL,
                product_name TEXT NOT NULL,
                rating INTEGER NOT NULL,
                review_text TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(order_id, product_id)
            )",
            "CREATE TABLE IF NOT EXISTS rate_limits (
                ip TEXT NOT NULL,
                endpoint TEXT NOT NULL,
                attempts INTEGER DEFAULT 1,
                window_start INTEGER NOT NULL,
                PRIMARY KEY (ip, endpoint)
            )",
            "CREATE TABLE IF NOT EXISTS categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                slug TEXT UNIQUE NOT NULL,
                image_url TEXT,
                active INTEGER DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )",
            "CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                category_id INTEGER,
                name TEXT NOT NULL,
                description TEXT,
                price REAL NOT NULL,
                image_url TEXT,
                available INTEGER DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )",
            "CREATE TABLE IF NOT EXISTS admin_access_settings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                is_enabled INTEGER DEFAULT 0,
                access_key TEXT,
                expires_at DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )",
            "CREATE TABLE IF NOT EXISTS feedbacks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                name TEXT NOT NULL,
                email TEXT,
                rating INTEGER DEFAULT 0,
                message TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )",
            "CREATE TABLE IF NOT EXISTS favorites (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                product_id INTEGER NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, product_id)
            )",
            "CREATE TABLE IF NOT EXISTS settings (
                key_name TEXT PRIMARY KEY,
                value TEXT,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )",
        ]
        : [
            "CREATE TABLE IF NOT EXISTS admins (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                username VARCHAR(255) UNIQUE NULL,
                password_hash VARCHAR(255) NOT NULL,
                name VARCHAR(255) NOT NULL,
                role VARCHAR(50) DEFAULT 'admin',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )",
            "CREATE TABLE IF NOT EXISTS sessions (
                id VARCHAR(64) PRIMARY KEY,
                device_type VARCHAR(50),
                os VARCHAR(50),
                browser VARCHAR(50),
                city VARCHAR(100),
                state VARCHAR(100),
                lat DECIMAL(10, 8) DEFAULT 0,
                lng DECIMAL(11, 8) DEFAULT 0,
                address TEXT,
                pages_viewed JSON,
                items_viewed JSON,
                cart_abandoned TINYINT(1) DEFAULT 0,
                orders_placed INT DEFAULT 0,
                first_visit TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_visit TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )",
            "CREATE TABLE IF NOT EXISTS orders (
                id INT AUTO_INCREMENT PRIMARY KEY,
                order_ref VARCHAR(64) UNIQUE,
                session_id VARCHAR(64) NULL,
                user_id INT NULL,
                customer_name VARCHAR(255) NOT NULL,
                customer_phone VARCHAR(50) NOT NULL,
                items JSON NOT NULL,
                subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
                delivery_fee DECIMAL(10, 2) NOT NULL DEFAULT 0,
                total DECIMAL(10, 2) NOT NULL DEFAULT 0,
                total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
                status VARCHAR(30) DEFAULT 'pending',
                payment_status VARCHAR(30) DEFAULT 'pending',
                order_type VARCHAR(20) DEFAULT 'delivery',
                payment_method VARCHAR(30) DEFAULT 'bank_transfer',
                pickup_time VARCHAR(100) NULL,
                payment_reference VARCHAR(255) NULL,
                admin_note TEXT NULL,
                payment_submitted_at TIMESTAMP NULL,
                payment_reviewed_at TIMESTAMP NULL,
                payment_reviewed_by INT NULL,
                delivery_address TEXT,
                lat DECIMAL(10, 8) DEFAULT 0,
                lng DECIMAL(11, 8) DEFAULT 0,
                notes TEXT,
                receipt_path TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )",
            "CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                phone VARCHAR(50) NULL,
                address TEXT NULL,
                password_hash VARCHAR(255) NOT NULL,
                role VARCHAR(50) DEFAULT 'user',
                biometric_id VARCHAR(255) NULL,
                biometric_key TEXT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )",
            "CREATE TABLE IF NOT EXISTS reviews (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                order_id INT NOT NULL,
                product_id VARCHAR(64) NOT NULL,
                product_name VARCHAR(255) NOT NULL,
                rating TINYINT NOT NULL,
                review_text TEXT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_order_product_review (order_id, product_id)
            )",
            "CREATE TABLE IF NOT EXISTS rate_limits (
                ip VARCHAR(45) NOT NULL,
                endpoint VARCHAR(255) NOT NULL,
                attempts INT DEFAULT 1,
                window_start INT NOT NULL,
                PRIMARY KEY (ip, endpoint)
            )",
            "CREATE TABLE IF NOT EXISTS categories (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                slug VARCHAR(255) UNIQUE NOT NULL,
                image_url TEXT,
                active TINYINT(1) DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )",
            "CREATE TABLE IF NOT EXISTS products (
                id INT AUTO_INCREMENT PRIMARY KEY,
                category_id INT NULL,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                price DECIMAL(10, 2) NOT NULL,
                image_url TEXT,
                available TINYINT(1) DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )",
            "CREATE TABLE IF NOT EXISTS admin_access_settings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                is_enabled TINYINT(1) DEFAULT 0,
                access_key VARCHAR(32) NULL,
                expires_at TIMESTAMP NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )",
            "CREATE TABLE IF NOT EXISTS feedbacks (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NULL,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NULL,
                rating TINYINT DEFAULT 0,
                message TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )",
            "CREATE TABLE IF NOT EXISTS favorites (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                product_id INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_user_product_favorite (user_id, product_id)
            )",
            "CREATE TABLE IF NOT EXISTS settings (
                key_name VARCHAR(255) PRIMARY KEY,
                value TEXT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )",
        ];

    foreach ($statements as $statement) {
        $db->exec($statement);
    }

    $columns = [
        'orders' => ['order_ref', 'total_amount', 'payment_status', 'receipt_path', 'updated_at', 'user_id', 'last_notification_key', 'last_notification_at', 'order_type', 'payment_method', 'pickup_time', 'payment_reference', 'admin_note', 'payment_submitted_at', 'payment_reviewed_at', 'payment_reviewed_by'],
        'admins' => ['username', 'role'],
        'admin_access_settings' => ['is_enabled', 'access_key', 'expires_at', 'updated_at'],
        'users' => ['phone', 'address', 'role', 'biometric_id', 'biometric_key'],
    ];

    foreach ($columns as $table => $requiredColumns) {
        foreach ($requiredColumns as $column) {
            if (!columnExists($db, $driver, $table, $column)) {
                addMissingColumn($db, $driver, $table, $column);
            }
        }
    }

    seedDefaultAdmin($db);
    seedAdminAccessSettings($db);
    seedStoreSettings($db);
}

function columnExists(PDO $db, string $driver, string $table, string $column): bool {
    if ($driver === 'sqlite') {
        $rows = $db->query("PRAGMA table_info($table)")->fetchAll(PDO::FETCH_ASSOC);
        foreach ($rows as $row) {
            if (($row['name'] ?? null) === $column) {
                return true;
            }
        }
        return false;
    }

    $stmt = $db->prepare("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = ? AND COLUMN_NAME = ? AND TABLE_SCHEMA = ?");
    $stmt->execute([$table, $column, getenv('DB_NAME') ?: 'soji_shawarma']);
    return (bool) $stmt->fetch();
}

function addMissingColumn(PDO $db, string $driver, string $table, string $column): void {
    $definitions = [
        'orders.order_ref' => $driver === 'sqlite'
            ? "ALTER TABLE orders ADD COLUMN order_ref TEXT"
            : "ALTER TABLE orders ADD COLUMN order_ref VARCHAR(64) NULL",
        'orders.total_amount' => $driver === 'sqlite'
            ? "ALTER TABLE orders ADD COLUMN total_amount REAL NOT NULL DEFAULT 0"
            : "ALTER TABLE orders ADD COLUMN total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0",
        'orders.payment_status' => $driver === 'sqlite'
            ? "ALTER TABLE orders ADD COLUMN payment_status TEXT DEFAULT 'pending'"
            : "ALTER TABLE orders ADD COLUMN payment_status VARCHAR(30) DEFAULT 'pending'",
        'orders.receipt_path' => $driver === 'sqlite'
            ? "ALTER TABLE orders ADD COLUMN receipt_path TEXT"
            : "ALTER TABLE orders ADD COLUMN receipt_path TEXT NULL",
        'orders.updated_at' => $driver === 'sqlite'
            ? "ALTER TABLE orders ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP"
            : "ALTER TABLE orders ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP",
        'orders.user_id' => $driver === 'sqlite'
            ? "ALTER TABLE orders ADD COLUMN user_id INTEGER"
            : "ALTER TABLE orders ADD COLUMN user_id INT NULL",
        'orders.last_notification_key' => $driver === 'sqlite'
            ? "ALTER TABLE orders ADD COLUMN last_notification_key TEXT"
            : "ALTER TABLE orders ADD COLUMN last_notification_key VARCHAR(255) NULL",
        'orders.last_notification_at' => $driver === 'sqlite'
            ? "ALTER TABLE orders ADD COLUMN last_notification_at DATETIME"
            : "ALTER TABLE orders ADD COLUMN last_notification_at TIMESTAMP NULL",
        'orders.order_type' => $driver === 'sqlite'
            ? "ALTER TABLE orders ADD COLUMN order_type TEXT DEFAULT 'delivery'"
            : "ALTER TABLE orders ADD COLUMN order_type VARCHAR(20) DEFAULT 'delivery'",
        'orders.payment_method' => $driver === 'sqlite'
            ? "ALTER TABLE orders ADD COLUMN payment_method TEXT DEFAULT 'bank_transfer'"
            : "ALTER TABLE orders ADD COLUMN payment_method VARCHAR(30) DEFAULT 'bank_transfer'",
        'orders.pickup_time' => $driver === 'sqlite'
            ? "ALTER TABLE orders ADD COLUMN pickup_time TEXT"
            : "ALTER TABLE orders ADD COLUMN pickup_time VARCHAR(100) NULL",
        'orders.payment_reference' => $driver === 'sqlite'
            ? "ALTER TABLE orders ADD COLUMN payment_reference TEXT"
            : "ALTER TABLE orders ADD COLUMN payment_reference VARCHAR(255) NULL",
        'orders.admin_note' => $driver === 'sqlite'
            ? "ALTER TABLE orders ADD COLUMN admin_note TEXT"
            : "ALTER TABLE orders ADD COLUMN admin_note TEXT NULL",
        'orders.payment_submitted_at' => $driver === 'sqlite'
            ? "ALTER TABLE orders ADD COLUMN payment_submitted_at DATETIME"
            : "ALTER TABLE orders ADD COLUMN payment_submitted_at TIMESTAMP NULL",
        'orders.payment_reviewed_at' => $driver === 'sqlite'
            ? "ALTER TABLE orders ADD COLUMN payment_reviewed_at DATETIME"
            : "ALTER TABLE orders ADD COLUMN payment_reviewed_at TIMESTAMP NULL",
        'orders.payment_reviewed_by' => $driver === 'sqlite'
            ? "ALTER TABLE orders ADD COLUMN payment_reviewed_by INTEGER"
            : "ALTER TABLE orders ADD COLUMN payment_reviewed_by INT NULL",
        'admins.username' => $driver === 'sqlite'
            ? "ALTER TABLE admins ADD COLUMN username TEXT"
            : "ALTER TABLE admins ADD COLUMN username VARCHAR(255) NULL",
        'admins.role' => $driver === 'sqlite'
            ? "ALTER TABLE admins ADD COLUMN role TEXT DEFAULT 'admin'"
            : "ALTER TABLE admins ADD COLUMN role VARCHAR(50) DEFAULT 'admin'",
        'admin_access_settings.is_enabled' => $driver === 'sqlite'
            ? "ALTER TABLE admin_access_settings ADD COLUMN is_enabled INTEGER DEFAULT 0"
            : "ALTER TABLE admin_access_settings ADD COLUMN is_enabled TINYINT(1) DEFAULT 0",
        'admin_access_settings.access_key' => $driver === 'sqlite'
            ? "ALTER TABLE admin_access_settings ADD COLUMN access_key TEXT"
            : "ALTER TABLE admin_access_settings ADD COLUMN access_key VARCHAR(32) NULL",
        'admin_access_settings.expires_at' => $driver === 'sqlite'
            ? "ALTER TABLE admin_access_settings ADD COLUMN expires_at DATETIME"
            : "ALTER TABLE admin_access_settings ADD COLUMN expires_at TIMESTAMP NULL",
        'admin_access_settings.updated_at' => $driver === 'sqlite'
            ? "ALTER TABLE admin_access_settings ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP"
            : "ALTER TABLE admin_access_settings ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP",
        'users.phone' => $driver === 'sqlite'
            ? "ALTER TABLE users ADD COLUMN phone TEXT"
            : "ALTER TABLE users ADD COLUMN phone VARCHAR(50) NULL",
        'users.address' => $driver === 'sqlite'
            ? "ALTER TABLE users ADD COLUMN address TEXT"
            : "ALTER TABLE users ADD COLUMN address TEXT NULL",
        'users.role' => $driver === 'sqlite'
            ? "ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'"
            : "ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'user'",
        'users.biometric_id' => $driver === 'sqlite'
            ? "ALTER TABLE users ADD COLUMN biometric_id TEXT"
            : "ALTER TABLE users ADD COLUMN biometric_id VARCHAR(255) NULL",
        'users.biometric_key' => $driver === 'sqlite'
            ? "ALTER TABLE users ADD COLUMN biometric_key TEXT"
            : "ALTER TABLE users ADD COLUMN biometric_key TEXT NULL",
    ];

    $key = "$table.$column";
    if (isset($definitions[$key])) {
        $db->exec($definitions[$key]);
    }
}

function seedDefaultAdmin(PDO $db): void {
    $email = 'admin@yourdomain.com';
    $username = 'admin';
    $password = 'Admin@123';
    $name = 'Soji Admin';
    $hash = password_hash($password, PASSWORD_BCRYPT);

    $stmt = $db->prepare("SELECT id FROM admins WHERE email = ?");
    $stmt->execute([$email]);
    $existing = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($existing) {
        $update = $db->prepare("UPDATE admins SET username = COALESCE(username, ?) WHERE id = ?");
        $update->execute([$username, $existing['id']]);
        return;
    }

    $insert = $db->prepare("INSERT INTO admins (email, username, password_hash, name, role) VALUES (?, ?, ?, ?, ?)");
    $insert->execute([$email, $username, $hash, $name, 'admin']);
}

function seedAdminAccessSettings(PDO $db): void {
    $stmt = $db->query("SELECT id FROM admin_access_settings ORDER BY id ASC LIMIT 1");
    if ($stmt && $stmt->fetch(PDO::FETCH_ASSOC)) {
        return;
    }

    $insert = $db->prepare("INSERT INTO admin_access_settings (is_enabled, access_key, expires_at) VALUES (?, ?, ?)");
    $insert->execute([0, null, null]);
}

function seedStoreSettings(PDO $db): void {
    $defaults = [
        'payment_account_name' => 'Soji Shawarma',
        'payment_account_number' => '0000000000',
        'payment_bank_name' => 'Your Bank',
        'payment_note' => 'Send your transfer receipt after payment so the admin can verify it.',
        'support_whatsapp' => '',
        'pickup_address' => 'Soji Shawarma pickup counter',
        'pickup_instructions' => 'Come with your order number and wait for admin confirmation before pickup.',
    ];

    $select = $db->prepare("SELECT value FROM settings WHERE key_name = ?");
    $insert = $db->prepare("INSERT INTO settings (key_name, value) VALUES (?, ?)");

    foreach ($defaults as $key => $value) {
        $select->execute([$key]);
        if ($select->fetch(PDO::FETCH_ASSOC)) {
            continue;
        }

        $insert->execute([$key, $value]);
    }
}
