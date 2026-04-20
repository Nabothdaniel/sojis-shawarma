<?php
require_once __DIR__ . '/../src/bootstrap.php';
$db = BamzySMS\Core\Database::getInstance()->getConnection();
try {
    $stmt = $db->query("SELECT * FROM migrations");
    $migrations = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($migrations);
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage();
}
