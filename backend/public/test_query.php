<?php
require_once __DIR__ . '/../src/bootstrap.php';
use BamzySMS\Core\Database;

header('Content-Type: text/plain');

try {
    $db = Database::getInstance()->getConnection();
    echo "[+] Database Connected\n";
    
    $query = "SELECT id, username, name, phone, balance, role, recovery_key_saved, (recovery_key IS NOT NULL) as has_recovery_key, whatsapp_notifications, whatsapp_number, created_at FROM users ORDER BY id DESC";
    echo "[+] Running Query: $query\n";
    
    $stmt = $db->query($query);
    if (!$stmt) {
        $error = $db->errorInfo();
        echo "[ERROR] Query failed: " . print_r($error, true) . "\n";
    } else {
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo "[OK] Found " . count($users) . " users.\n";
        if (count($users) > 0) {
            echo "[*] Sample First User Data:\n";
            print_r($users[0]);
        }
    }
} catch (\Exception $e) {
    echo "[EXCEPTION] " . $e->getMessage() . "\n";
    echo $e->getTraceAsString();
}
