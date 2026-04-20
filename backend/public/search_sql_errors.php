<?php
require_once __DIR__ . '/../src/bootstrap.php';
$db = BamzySMS\Core\Database::getInstance()->getConnection();
try {
    $stmt = $db->query("SELECT * FROM system_logs WHERE details LIKE '%SQLSTATE%' OR details LIKE '%Column not found%' ORDER BY created_at DESC LIMIT 10");
    $errors = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($errors, JSON_PRETTY_PRINT);
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage();
}
