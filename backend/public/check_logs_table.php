<?php
require_once __DIR__ . '/../src/bootstrap.php';
$db = BamzySMS\Core\Database::getInstance()->getConnection();
try {
    $db->query("SELECT 1 FROM system_logs LIMIT 1");
    echo "EXISTS";
} catch (Exception $e) {
    echo "MISSING: " . $e->getMessage();
}
