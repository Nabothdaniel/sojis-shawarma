<?php

/**
 * BamzySMS - Main Entry Point
 */
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

$base = file_exists(__DIR__ . '/src/bootstrap.php') ? __DIR__ : __DIR__ . '/..';
require_once $base . '/src/bootstrap.php';

// Load routes
$router = require_once $base . '/routes/api.php';

// Resolve request
$router->resolve();
