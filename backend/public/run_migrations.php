<?php

require_once __DIR__ . '/../src/Core/Database.php';
require_once __DIR__ . '/../src/Core/Migrator.php';

use BamzySMS\Core\Database;
use BamzySMS\Core\Migrator;

header('Content-Type: text/plain');

try {
    $db = Database::getInstance()->getConnection();
    echo "BamzySMS Database Migrator\n";
    echo "==========================\n";
    
    $migrator = new Migrator($db);
    
    // Debug: list applied
    $ref = new ReflectionClass($migrator);
    $method = $ref->getMethod('getAppliedMigrations');
    $method->setAccessible(true);
    $applied = $method->invoke($migrator);
    echo "Applied migrations: " . implode(', ', $applied) . "\n\n";
    
    $results = $migrator->migrate();
    
    if (empty($results)) {
        echo "Database is already up to date.\n";
    } else {
        foreach ($results as $res) {
            echo "[{$res['status']}] {$res['file']}";
            if (isset($res['message'])) {
                echo " - Error: {$res['message']}";
            }
            echo "\n";
        }
        echo "\nDone.\n";
    }
} catch (Throwable $e) {
    echo "CRITICAL ERROR: " . $e->getMessage() . "\n";
}
