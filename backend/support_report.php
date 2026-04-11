<?php
/**
 * BamzySMS Diagnostic Report for Support
 * Run: php backend/support_report.php
 */

require_once __DIR__ . '/src/Core/Database.php';
require_once __DIR__ . '/src/Services/SmsBowerClient.php';

ob_start();

// Helper for masking API Key
function mask_key($key) {
    if (strlen($key) < 8) return $key;
    return substr($key, 0, 4) . '...' . substr($key, -4);
}

// 1. Load Environment
$envFile = __DIR__ . '/.env';
$apiKey = '';
if (file_exists($envFile)) {
    foreach (file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        if (str_starts_with(trim($line), '#')) continue;
        if (!str_contains($line, '=')) continue;
        [$key, $val] = explode('=', $line, 2);
        if (trim($key) === 'SMSBOWER_API_KEY') {
            $apiKey = trim($val);
            putenv("SMSBOWER_API_KEY=$apiKey");
            $_ENV['SMSBOWER_API_KEY'] = $apiKey;
        }
    }
}

// 2. Identify Public IP
echo "--- DIAGNOSTIC REPORT ---\n";
echo "Date: " . date('Y-m-d H:i:s') . "\n";

$ip = 'Unknown';
try {
    $ch = curl_init('https://api.ipify.org');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 5);
    $ip = curl_exec($ch);
    curl_close($ch);
} catch (\Exception $e) {}

echo "Server Public IP: " . ($ip ?: 'Could not determine') . "\n";
echo "API Key (Masked): " . mask_key($apiKey) . "\n";
echo "--------------------------\n\n";

// 3. Perform Test Requests
use BamzySMS\Services\SmsBowerClient;
$client = new SmsBowerClient();

$actions = ['getBalance', 'getServicesList', 'getCountries', 'getPrices'];
$baseUrl = 'https://smsbower.page/stubs/handler_api.php';

$logFile = __DIR__ . '/storage/logs/sms_bower.log';
$initialSize = file_exists($logFile) ? filesize($logFile) : 0;

foreach ($actions as $action) {
    echo "Testing Action: $action\n";
    $params = ['action' => $action, 'api_key' => mask_key($apiKey)];
    if ($action === 'getPrices') $params['service'] = 'go';
    
    echo "Endpoint: $baseUrl\n";
    echo "Payload: " . json_encode($params) . "\n";

    try {
        if ($action === 'getBalance') $client->getBalance();
        if ($action === 'getServicesList') $client->getServicesList();
        if ($action === 'getCountries') $client->getCountries();
        if ($action === 'getPrices') $client->getPrices('go');
        echo "Status: SUCCESS\n";
    } catch (\Exception $e) {
        echo "Status: FAILED\n";
        echo "Error: " . $e->getMessage() . "\n";
    }
    echo "--------------------------\n";
}

echo "\n--- RAW PROVIDER INTERACTION (FOR SUPPORT) ---\n";
if (file_exists($logFile)) {
    clearstatcache();
    $newContent = file_get_contents($logFile, false, null, $initialSize);
    
    // Attempt to pretty-print JSON for better readability
    $newLines = explode("\n", $newContent);
    foreach ($newLines as $line) {
        if (str_contains($line, 'RAW RESPONSE:')) {
            $jsonStart = strpos($line, 'RAW RESPONSE:') + strlen('RAW RESPONSE:');
            $jsonText = trim(substr($line, $jsonStart));
            $decoded = json_decode($jsonText, true);
            if ($decoded !== null) {
                echo substr($line, 0, $jsonStart) . "\n" . json_encode($decoded, JSON_PRETTY_PRINT) . "\n";
                continue;
            }
        }
        echo $line . "\n";
    }
} else {
    echo "[No log data captured]\n";
}
// 4. Finalize Report
$output = ob_get_clean();
echo $output;

$reportFile = __DIR__ . '/storage/logs/diagnostic_report.txt';
file_put_contents($reportFile, $output);

echo "\n----------------------------------------------\n";
echo "REPORT SAVED TO: " . $reportFile . "\n";
echo "Please send this file to SMSBower support.\n";
