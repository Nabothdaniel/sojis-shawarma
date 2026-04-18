<?php
/**
 * BamzySMS Migration Generator
 * Usage: php make_migration.php "description_of_change"
 */

$migrationsPath = __DIR__ . '/backend/migrations';

if (!is_dir($migrationsPath)) {
    die("❌ Error: Migrations directory not found at $migrationsPath\n");
}

$description = $argv[1] ?? null;

if (!$description) {
    echo "Usage: php make_migration.php \"description_of_change\"\n";
    exit(1);
}

// Clean description
$cleanDesc = strtolower(preg_replace('/[^a-z0-9_]/i', '_', trim($description)));
$cleanDesc = trim($cleanDesc, '_');

// Find the latest migration number
$files = glob($migrationsPath . '/*.sql');
$maxNum = 0;

foreach ($files as $file) {
    $name = basename($file);
    if (preg_match('/^(\d+)/', $name, $matches)) {
        $num = (int)$matches[1];
        if ($num > $maxNum) {
            $maxNum = $num;
        }
    }
}

$nextNum = str_pad($maxNum + 1, 3, '0', STR_PAD_LEFT);
$fileName = "{$nextNum}_{$cleanDesc}.sql";
$fullPath = $migrationsPath . '/' . $fileName;

$boilerplate = "-- Migration: " . ucwords(str_replace('_', ' ', $description)) . "\n"
             . "-- Created: " . date('Y-m-d H:i:s') . "\n\n"
             . "-- Write your SQL here:\n\n";

if (file_put_contents($fullPath, $boilerplate)) {
    echo "\n✅ Created new migration: backend/migrations/$fileName\n\n";
} else {
    echo "❌ Failed to create file at $fullPath\n";
    exit(1);
}
