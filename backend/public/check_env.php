<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

require __DIR__ . '/../src/bootstrap.php';

echo "Env var DB_NAME: " . ($_ENV['DB_NAME'] ?? getenv('DB_NAME') ?? 'NOT SET') . "\n";
echo "Env var DB_HOST: " . ($_ENV['DB_HOST'] ?? getenv('DB_HOST') ?? 'NOT SET') . "\n";
$config = require __DIR__ . '/../config/database.php';
print_r($config);

// Try to connect to DB
require __DIR__ . '/../src/Core/Database.php';
try {
    $db = \BamzySMS\Core\Database::getInstance()->getConnection();
    echo "Connected successfully to DB.\n";
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
