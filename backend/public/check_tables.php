<?php
require_once __DIR__ . '/../src/bootstrap.php';
$db = BamzySMS\Core\Database::getInstance()->getConnection();
try {
    $db->query("SELECT 1 FROM virtual_accounts LIMIT 1");
    echo "VIRTUAL_ACCOUNTS_EXISTS\n";
} catch (Exception $e) {
    echo "VIRTUAL_ACCOUNTS_MISSING: " . $e->getMessage() . "\n";
}

try {
    $db->query("SELECT 1 FROM system_events LIMIT 1");
    echo "SYSTEM_EVENTS_EXISTS\n";
} catch (Exception $e) {
    echo "SYSTEM_EVENTS_MISSING: " . $e->getMessage() . "\n";
}

try {
    $db->query("SELECT 1 FROM transactions LIMIT 1");
    echo "TRANSACTIONS_EXISTS\n";
} catch (Exception $e) {
    echo "TRANSACTIONS_MISSING: " . $e->getMessage() . "\n";
}
