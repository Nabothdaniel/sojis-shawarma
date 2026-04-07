<?php
require_once __DIR__ . '/src/Core/Database.php';
require_once __DIR__ . '/src/Services/SmsBowerClient.php';

// Load .env manually
$envFile = __DIR__ . '/.env';
if (file_exists($envFile)) {
    foreach (file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        if (str_starts_with(trim($line), '#')) continue;
        if (!str_contains($line, '=')) continue;
        [$key, $val] = explode('=', $line, 2);
        $_ENV[trim($key)] = trim($val);
        putenv(trim($key) . '=' . trim($val));
    }
}

use BamzySMS\Services\SmsBowerClient;

$client = new SmsBowerClient();

echo "--- Testing getBalance ---\n";
try {
    $balance = $client->getBalance();
    echo "Balance: " . $balance . "\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}

echo "--- Testing getServicesList ---\n";
try {
    $services = $client->getServicesList();
    echo "Success! Found " . count($services) . " services.\n";
} catch (Exception $e) {
    echo "Error getServicesList: " . $e->getMessage() . "\n";
}

echo "--- Testing getCountries ---\n";
try {
    $countries = $client->getCountries();
    echo "Success! Found " . count($countries) . " countries.\n";
} catch (Exception $e) {
    echo "Error getCountries: " . $e->getMessage() . "\n";
}

echo "--- Testing getPrices (for 'go') ---\n";
try {
    $prices = $client->getPrices('go');
    echo "Success! Received price data for 'go'.\n";
} catch (Exception $e) {
    echo "Error getPrices: " . $e->getMessage() . "\n";
}
