<?php
require_once __DIR__ . '/../src/bootstrap.php';
use BamzySMS\Core\Database;

$db = Database::getInstance()->getConnection();
$stmt = $db->prepare("SELECT id, username, role, password FROM users WHERE username = ?");
$stmt->execute(['admin']);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if ($user) {
    echo "User Found: " . $user['username'] . " (ID: " . $user['id'] . ")\n";
    echo "Role: " . $user['role'] . "\n";
    echo "Hash: " . $user['password'] . "\n";
    
    $password = 'Admin@12345!';
    if (password_verify($password, $user['password'])) {
        echo "VERIFICATION SUCCESS: Password matches hash.\n";
    } else {
        echo "VERIFICATION FAILED: Password Does NOT match hash.\n";
    }
} else {
    echo "User 'admin' NOT found in database.\n";
}
