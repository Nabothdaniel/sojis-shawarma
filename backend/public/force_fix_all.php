<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);
require_once __DIR__ . '/../src/bootstrap.php';
header('Content-Type: text/plain');

$dbsToTry = [];

// 1. Try from .env
$dbsToTry[] = [
    'host' => $_ENV['DB_HOST'] ?? 'localhost',
    'dbname' => $_ENV['DB_NAME'] ?? 'bamzy_db',
    'user' => $_ENV['DB_USER'] ?? 'root',
    'pass' => $_ENV['DB_PASS'] ?? ''
];

// 2. Try strictly localhost bamzy_db (default XAMPP/WAMP)
$dbsToTry[] = [
    'host' => 'localhost',
    'dbname' => 'bamzy_db',
    'user' => 'root',
    'pass' => ''
];

$successes = 0;

foreach ($dbsToTry as $config) {
    try {
        echo "Testing connection to {$config['host']} / {$config['dbname']}...\n";
        $dsn = "mysql:host={$config['host']};dbname={$config['dbname']};charset=utf8mb4";
        $db = new \PDO($dsn, $config['user'], $config['pass'], [
            \PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION
        ]);
        echo "SUCCESS connecting to {$config['dbname']}!\n";
        $successes++;

        // Reset negative balances
        $stmt = $db->query("SELECT id, balance FROM users WHERE balance < 0");
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo "Found " . count($users) . " users with negative balance.\n";
        
        foreach ($users as $u) {
            $amount = abs($u['balance']);
            $db->exec("UPDATE users SET balance = 0.00 WHERE id = " . $u['id']);
            $desc = "Balance correction: removed negative balance of ₦" . number_format($amount, 2);
            $stmt2 = $db->prepare("INSERT INTO transactions (user_id, amount, type, description) VALUES (?, ?, 'credit', ?)");
            $stmt2->execute([$u['id'], $amount, $desc]);
            echo "Fixed user {$u['id']} (-₦$amount)\n";
        }

        // Add System Events
        $db->exec("
            CREATE TABLE IF NOT EXISTS system_events (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                event_type VARCHAR(50) NOT NULL,
                payload TEXT,
                is_delivered BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_user_delivered (user_id, is_delivered)
            )
        ");
        echo "Created system_events table.\n";

        // Constraints
        try {
            $db->exec("ALTER TABLE users ADD CONSTRAINT chk_balance_non_negative CHECK (balance >= 0)");
            echo "Added check constraint.\n";
        } catch (\Exception $e) { }

        try {
            $db->exec("ALTER TABLE transactions ADD COLUMN external_ref VARCHAR(255) NULL UNIQUE");
        } catch (\Exception $e) { }

        echo "Applied fixes to {$config['dbname']}.\n\n";

    } catch (\Exception $e) {
        echo "FAILED to connect or fix {$config['dbname']}: " . $e->getMessage() . "\n\n";
    }
}

if ($successes == 0) {
    echo "CRITICAL: Could not connect to any database! The backend is completely broken because of DB connection limits or wrong credentials.\n";
}
