<?php
/**
 * BamzySMS CLI Migration Runner
 * Usage: php migrate.php
 */

require_once __DIR__ . '/backend/src/Core/Database.php';
require_once __DIR__ . '/backend/src/Core/Migrator.php';

use BamzySMS\Core\Database;
use BamzySMS\Core\Migrator;

// ─── Manual .env Loader for CLI ─────────────────────────────────────────────
$envFile = __DIR__ . '/.env';
if (file_exists($envFile)) {
    foreach (file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        if (str_starts_with(trim($line), '#')) continue;
        if (!str_contains($line, '=')) continue;
        [$key, $val] = explode('=', $line, 2);
        $_ENV[trim($key)] = trim($val, " \t\n\r\0\x0B\"'");
        putenv(trim($key) . '=' . $_ENV[trim($key)]);
    }
}

echo "\n🚀 BamzySMS Migration Runner\n";
echo "============================\n";

try {
    $db = Database::getInstance()->getConnection();
    $migrator = new Migrator($db);
    
    echo "Checking for new migrations...\n";
    $results = $migrator->migrate();
    
    if (empty($results)) {
        echo "✅ Database is already up to date.\n";
    } else {
        foreach ($results as $res) {
            if ($res['status'] === 'success') {
                echo " ✅ Applied: {$res['file']}\n";
            } else {
                echo " ❌ Failed: {$res['file']}\n";
                echo "    Error: {$res['message']}\n";
                exit(1);
            }
        }
        echo "\n🎉 All migrations applied successfully!\n";
    }
} catch (Throwable $e) {
    echo " 🛑 CRITICAL ERROR: " . $e->getMessage() . "\n";
    exit(1);
}

echo "\n";
