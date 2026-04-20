<?php
require_once __DIR__ . '/../src/bootstrap.php';
$db = BamzySMS\Core\Database::getInstance()->getConnection();
try {
    $stmt = $db->query("DESCRIBE users");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($columns);
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage();
}
