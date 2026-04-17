<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

chdir(__DIR__ . '/..');

// Hardcode connection to LOCALHOST to fix the user's local dev environment
$dsn = "mysql:host=localhost;dbname=bamzy_db;charset=utf8mb4";
$user = "root"; // Default xampp/local user
$pass = "";     // Default xampp/local pass

try {
    $db = new \PDO($dsn, $user, $pass, [
        \PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION
    ]);
    
    echo "Connected to LOCAL Database (bamzy_db).\n";

    // 1. Reset negative balances
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

    // 2. Add CHECK constraint if not exists
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
    echo "System events table ensured.\n";

    try {
        $db->exec("ALTER TABLE users ADD CONSTRAINT chk_balance_non_negative CHECK (balance >= 0)");
        echo "CHECK constraint added.\n";
    } catch (\Exception $e) {
        echo "CHECK constraint note: " . $e->getMessage() . "\n";
    }
    
    // Also ensure external_ref exists in transactions (from previous migration 006)
    try {
        $db->exec("ALTER TABLE transactions ADD COLUMN external_ref VARCHAR(255) NULL UNIQUE");
        echo "external_ref constraint added.\n";
    } catch (\Exception $e) {
        echo "external_ref note: " . $e->getMessage() . "\n";
    }
    
    echo "All critical fixes applied to LOCAL DB.\n";

} catch (\Exception $e) {
    echo "Fatal Error: " . $e->getMessage() . "\n";
}
