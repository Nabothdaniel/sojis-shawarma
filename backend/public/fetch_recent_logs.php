<?php
require_once __DIR__ . '/../src/bootstrap.php';
$db = BamzySMS\Core\Database::getInstance()->getConnection();
try {
    $stmt = $db->query("SELECT * FROM system_logs ORDER BY created_at DESC LIMIT 50");
    $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($logs, JSON_PRETTY_PRINT);
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage();
}
