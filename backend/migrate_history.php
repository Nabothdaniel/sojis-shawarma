<?php
// Autoloader
spl_autoload_register(function ($class) {
    $prefix   = 'BamzySMS\\';
    $base_dir = __DIR__ . '/src/';
    $len      = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) return;
    $relative_class = substr($class, $len);
    $file = $base_dir . str_replace('\\', '/', $relative_class) . '.php';
    if (file_exists($file)) require $file;
});

use BamzySMS\Core\Database;

try {
    echo "Connecting to database...\n";
    $db = Database::getInstance()->getConnection();
    
    echo "Adding 'is_hidden' column...\n";
    $db->exec("ALTER TABLE sms_purchases ADD COLUMN is_hidden BOOLEAN DEFAULT FALSE");
    echo "Column 'is_hidden' added successfully to 'sms_purchases'.\n";
    
} catch (Throwable $e) {
    if (strpos($e->getMessage(), 'Duplicate column name') !== false) {
        echo "Column 'is_hidden' already exists.\n";
    } else {
        echo "FAILED: " . $e->getMessage() . "\n";
        exit(1);
    }
}
