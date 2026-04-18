<?php
/**
 * BamzySMS Migration Watcher
 * Polls the migrations directory and auto-runs migrate.php on changes.
 */

$migrationsPath = __DIR__ . '/backend/migrations';
$migrateScript = __DIR__ . '/migrate.php';
$phpBinary = (file_exists('/opt/lampp/bin/php')) ? '/opt/lampp/bin/php' : 'php';

echo "👀 BamzySMS Migration Watcher Started...\n";
echo "Watching: $migrationsPath\n";
echo "Press Ctrl+C to stop.\n\n";

// Get initial state
$lastCount = count(glob($migrationsPath . '/*.sql'));

while (true) {
    clearstatcache();
    $currentFiles = glob($migrationsPath . '/*.sql');
    $currentCount = count($currentFiles);

    if ($currentCount !== $lastCount) {
        echo "\n🔔 Change detected! (" . date('H:i:s') . ")\n";
        echo "Running migrations...\n";
        
        $output = [];
        $returnVar = 0;
        exec("$phpBinary $migrateScript", $output, $returnVar);
        
        echo implode("\n", $output) . "\n";
        
        $lastCount = $currentCount;
        echo "------------------------------------------\n";
        echo "👀 Still watching...\n";
    }

    sleep(2); // Poll every 2 seconds
}
