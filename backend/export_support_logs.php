<?php
/**
 * Export Access Denied Logs for Support
 * Run: php backend/export_support_logs.php
 */

$logFile = __DIR__ . '/storage/logs/sms_bower.log';
$exportFile = __DIR__ . '/storage/logs/support_pack.txt';

if (!file_exists($logFile)) {
    die("No log file found at $logFile\n");
}

$lines = file($logFile);
$relevant = [];
$capture = false;
$currentEntry = [];

foreach ($lines as $line) {
    if (str_contains($line, 'OUTBOUND REQUEST:')) {
        $capture = true;
        $currentEntry = [$line];
    } elseif ($capture) {
        $currentEntry[] = $line;
        if (str_contains($line, 'EXTRACTED ERROR:') || str_contains($line, 'ACCESS_DENIED') || str_contains($line, 'No access')) {
            $relevant[] = implode("", $currentEntry);
            $capture = false;
        } elseif (str_contains($line, 'RAW RESPONSE:')) {
            // Keep looking if it's not an error yet
        }
    }
}

if (empty($relevant)) {
    echo "No 'access denied' entries found in logs.\n";
} else {
    $report = "--- AGGREGATED SUPPORT LOGS ---\n";
    $report .= "Generated: " . date('Y-m-d H:i:s') . "\n\n";
    $report .= implode("\n--------------------------\n", $relevant);
    
    file_put_contents($exportFile, $report);
    echo "Exported " . count($relevant) . " entries to $exportFile\n";
}
