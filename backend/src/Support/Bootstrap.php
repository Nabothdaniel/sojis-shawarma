<?php

function ensureBackendSchema(PDO $db, string $driver): void {
    $statements = $driver === 'sqlite'
        ? [
            "CREATE TABLE IF NOT EXISTS admins (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
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
                customer_name TEXT NOT NULL,
                customer_phone TEXT NOT NULL,
                items TEXT NOT NULL,
                subtotal REAL NOT NULL DEFAULT 0,
                delivery_fee REAL NOT NULL DEFAULT 0,
                total REAL NOT NULL DEFAULT 0,
                total_amount REAL NOT NULL DEFAULT 0,
                status TEXT DEFAULT 'pending',
                payment_status TEXT DEFAULT 'pending',
                delivery_address TEXT,
                lat REAL DEFAULT 0,
                lng REAL DEFAULT 0,
                notes TEXT,
                receipt_path TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
        ]
        : [
            "CREATE TABLE IF NOT EXISTS admins (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
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
                customer_name VARCHAR(255) NOT NULL,
                customer_phone VARCHAR(50) NOT NULL,
                items JSON NOT NULL,
                subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
                delivery_fee DECIMAL(10, 2) NOT NULL DEFAULT 0,
                total DECIMAL(10, 2) NOT NULL DEFAULT 0,
                total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
                status VARCHAR(30) DEFAULT 'pending',
                payment_status VARCHAR(30) DEFAULT 'pending',
                delivery_address TEXT,
                lat DECIMAL(10, 8) DEFAULT 0,
                lng DECIMAL(11, 8) DEFAULT 0,
                notes TEXT,
                receipt_path TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
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
        ];

    foreach ($statements as $statement) {
        $db->exec($statement);
    }

    $columns = [
        'orders' => ['order_ref', 'total_amount', 'payment_status', 'receipt_path', 'updated_at'],
        'admins' => ['role'],
    ];

    foreach ($columns as $table => $requiredColumns) {
        foreach ($requiredColumns as $column) {
            if (!columnExists($db, $driver, $table, $column)) {
                addMissingColumn($db, $driver, $table, $column);
            }
        }
    }

    seedDefaultAdmin($db);
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

    $stmt = $db->prepare("SHOW COLUMNS FROM `$table` LIKE ?");
    $stmt->execute([$column]);
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
        'admins.role' => $driver === 'sqlite'
            ? "ALTER TABLE admins ADD COLUMN role TEXT DEFAULT 'admin'"
            : "ALTER TABLE admins ADD COLUMN role VARCHAR(50) DEFAULT 'admin'",
    ];

    $key = "$table.$column";
    if (isset($definitions[$key])) {
        $db->exec($definitions[$key]);
    }
}

function seedDefaultAdmin(PDO $db): void {
    $email = 'admin@yourdomain.com';
    $password = 'Admin@123';
    $name = 'Soji Admin';
    $hash = password_hash($password, PASSWORD_BCRYPT);

    $stmt = $db->prepare("SELECT id FROM admins WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        return;
    }

    $insert = $db->prepare("INSERT INTO admins (email, password_hash, name, role) VALUES (?, ?, ?, ?)");
    $insert->execute([$email, $hash, $name, 'admin']);
}
