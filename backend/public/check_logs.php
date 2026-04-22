<?php
require_once __DIR__ . '/../src/bootstrap.php';
use BamzySMS\Core\Database;

$db = Database::getInstance()->getConnection();
$stmt = $db->query("SELECT * FROM system_logs ORDER BY created_at DESC LIMIT 20");
$logs = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "--- RECENT SYSTEM LOGS ---\n";
foreach ($logs as $log) {
    echo "[" . $log['created_at'] . "] [" . $log['level'] . "] " . $log['message'] . "\n";
}
