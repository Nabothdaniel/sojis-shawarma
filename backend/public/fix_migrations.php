<?php
require __DIR__ . '/../src/Core/Database.php';
$db = \BamzySMS\Core\Database::getInstance()->getConnection();
$db->exec("DELETE FROM migrations WHERE name = '008_create_system_events.sql'");
echo "Deleted migration 008 from tracker.\n";
