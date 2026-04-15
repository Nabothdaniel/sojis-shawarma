<?php
$host = 'localhost';
$dbname = 'tiheogwi_bamzy_sms';
$user = 'tiheogwi_bamzy_admin';
$pass = 'tiheogwi_bamzy_admin';

try {
    $db = new PDO("mysql:host=$host;dbname=$dbname", $user, $pass);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    $sql = file_get_contents(__DIR__ . '/migrations/003_add_username_to_users.sql');
    $statements = array_filter(array_map('trim', explode(';', $sql)));

    foreach ($statements as $statement) {
        if ($statement !== '') {
            $db->exec($statement);
            echo "Executed: " . substr($statement, 0, 50) . "...\n";
        }
    }
    
    // Record in migrations table if exists
    $db->exec("CREATE TABLE IF NOT EXISTS migrations (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255) NOT NULL UNIQUE, applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)");
    $stmt = $db->prepare("INSERT IGNORE INTO migrations (name) VALUES (?)");
    $stmt->execute(['003_add_username_to_users.sql']);
    
    echo "Migration successful!\n";
} catch (Exception $e) {
    echo "Migration failed: " . $e->getMessage() . "\n";
}
