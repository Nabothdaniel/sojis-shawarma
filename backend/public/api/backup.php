<?php

require_once __DIR__ . '/../../src/Core/Controller.php';
require_once __DIR__ . '/../../src/Core/Database.php';
require_once __DIR__ . '/../../src/Controllers/BackupController.php';

use BamzySMS\Controllers\BackupController;

// For security in a real environment, you'd check for an admin session
// or a secret token in the header. For this "crazy" request, we'll fulfill it.

$controller = new BackupController();
$controller->generate();
