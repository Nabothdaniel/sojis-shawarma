<?php
namespace BamzySMS\Services;
require_once __DIR__ . '/src/Core/Database.php';
require_once __DIR__ . '/src/Services/SmsBowerClient.php';

// Load .env manually for this script
$envContent = file_get_contents(__DIR__ . '/.env');
if (preg_match('/SMSBOWER_API_KEY=(.*)/', $envContent, $matches)) {
    $key = trim($matches[1]);
    putenv("SMSBOWER_API_KEY=$key");
    $_ENV['SMSBOWER_API_KEY'] = $key;
}

$client = new SmsBowerClient();
echo "Testing with Key: " . substr($key, 0, 4) . "...\n";

try {
    $services = $client->getServicesList();
    echo "Found " . count($services) . " services.\n";
    echo "Sample: " . json_encode(array_slice($services, 0, 3)) . "\n";
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
