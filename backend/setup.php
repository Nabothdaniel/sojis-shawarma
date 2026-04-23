<?php

// Basic .env loader
function loadEnv($path) {
    if (!file_exists($path)) return;
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        list($name, $value) = explode('=', $line, 2);
        putenv(trim($name) . '=' . trim($value));
    }
}

loadEnv(__DIR__ . '/.env');

$host = getenv('DB_HOST') ?: 'localhost';
$dbname = getenv('DB_NAME') ?: 'soji_shawarma';
$user = getenv('DB_USER') ?: 'root';
$pass = getenv('DB_PASS') ?: '';

try {
    $pdo = new PDO("mysql:host=$host", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Create database
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `$dbname` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    $pdo->exec("USE `$dbname`");

    echo "✅ Database `$dbname` ready.\n";

    // Create tables
    $tables = [
        "admins" => "id INT AUTO_INCREMENT PRIMARY KEY, 
                     email VARCHAR(255) UNIQUE NOT NULL, 
                     password_hash VARCHAR(255) NOT NULL, 
                     name VARCHAR(255) NOT NULL, 
                     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
        
        "categories" => "id INT AUTO_INCREMENT PRIMARY KEY, 
                         name VARCHAR(255) NOT NULL, 
                         slug VARCHAR(255) UNIQUE NOT NULL, 
                         image_url TEXT, 
                         active TINYINT(1) DEFAULT 1, 
                         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
        
        "products" => "id INT AUTO_INCREMENT PRIMARY KEY, 
                        category_id INT, 
                        name VARCHAR(255) NOT NULL, 
                        description TEXT, 
                        price DECIMAL(10, 2) NOT NULL, 
                        image_url TEXT, 
                        available TINYINT(1) DEFAULT 1, 
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL",
        
        "sessions" => "id VARCHAR(36) PRIMARY KEY, 
                        device_type VARCHAR(50), 
                        os VARCHAR(50), 
                        browser VARCHAR(50), 
                        city VARCHAR(100), 
                        state VARCHAR(100), 
                        lat DECIMAL(10, 8), 
                        lng DECIMAL(11, 8), 
                        address TEXT, 
                        pages_viewed JSON, 
                        items_viewed JSON, 
                        cart_abandoned TINYINT(1) DEFAULT 0, 
                        orders_placed INT DEFAULT 0, 
                        first_visit TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
                        last_visit TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP",
        
        "orders" => "id INT AUTO_INCREMENT PRIMARY KEY, 
                      session_id VARCHAR(36), 
                      customer_name VARCHAR(255) NOT NULL, 
                      customer_phone VARCHAR(50) NOT NULL, 
                      items JSON NOT NULL, 
                      subtotal DECIMAL(10, 2) NOT NULL, 
                      delivery_fee DECIMAL(10, 2) NOT NULL, 
                      total DECIMAL(10, 2) NOT NULL, 
                      status ENUM('pending', 'confirmed', 'preparing', 'dispatched', 'delivered', 'cancelled') DEFAULT 'pending', 
                      delivery_address TEXT, 
                      lat DECIMAL(10, 8), 
                      lng DECIMAL(11, 8), 
                      notes TEXT, 
                      telegram_message_id VARCHAR(100), 
                      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
                      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                      FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE SET NULL",
        
        "rate_limits" => "ip VARCHAR(45) NOT NULL, 
                          endpoint VARCHAR(255) NOT NULL, 
                          attempts INT DEFAULT 1, 
                          window_start INT NOT NULL, 
                          PRIMARY KEY (ip, endpoint, window_start)",

        "settings" => "key_name VARCHAR(255) PRIMARY KEY,
                        value TEXT,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
    ];

    foreach ($tables as $name => $fields) {
        $pdo->exec("CREATE TABLE IF NOT EXISTS `$name` ($fields)");
        echo "✅ Table `$name` ready.\n";
    }

    // Seed Admin
    $email = 'admin@yourdomain.com';
    $password = 'Admin@123';
    $hash = password_hash($password, PASSWORD_BCRYPT);
    
    $stmt = $pdo->prepare("INSERT IGNORE INTO admins (email, password_hash, name) VALUES (?, ?, ?)");
    $stmt->execute([$email, $hash, 'Soji Admin']);

    echo "\n🚀 SETUP COMPLETE!\n";
    echo "Default Admin: $email\n";
    echo "Default Password: $password\n";
    echo "Please change this password after your first login.\n";

} catch (PDOException $e) {
    die("❌ Error: " . $e->getMessage() . "\n");
}
