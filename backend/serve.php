<?php

/**
 * BamzySMS Standalone Server Script
 * Run this in your terminal: php backend/serve.php
 */

$host = 'localhost:8000';
$publicDir = __DIR__ . '/public';

echo "BamzySMS API starting at http://$host\n";
echo "Press Ctrl+C to stop.\n";

// Use the built-in PHP server
passthru("php -S $host -t $publicDir");
