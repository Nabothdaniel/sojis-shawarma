<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

require __DIR__ . '/../src/bootstrap.php';
require __DIR__ . '/../src/Core/Database.php';

try {
    $db = \BamzySMS\Core\Database::getInstance()->getConnection();
    $stmt = $db->query("SELECT 1 FROM system_events LIMIT 1");
    echo "system_events table exists in proper DB.\n";
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
