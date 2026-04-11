<?php
require_once __DIR__ . '/../src/Core/Database.php';

use BamzySMS\Core\Database;

header('Content-Type: text/plain');

try {
    $db = Database::getInstance()->getConnection();
    echo "Connecting to database...\n";
    
    $dbName = $db->query("SELECT DATABASE()")->fetchColumn();
    echo "Current Database: " . $dbName . "\n";
    
    // Check if column exists first to be safe
    $stmt = $db->query("DESCRIBE sms_purchases");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $columnNames = array_column($columns, 'Field');
    echo "Current columns in sms_purchases:\n";
    print_r($columnNames);
    
    if (!in_array('is_hidden', $columnNames)) {
        echo "Adding 'is_hidden' column...\n";
        $db->exec("ALTER TABLE sms_purchases ADD COLUMN is_hidden BOOLEAN DEFAULT FALSE");
        echo "Column 'is_hidden' added successfully.\n";
    } else {
        echo "Column 'is_hidden' already exists.\n";
    }
} catch (Throwable $e) {
    echo "FAILED: " . $e->getMessage() . "\n";
}
?>
