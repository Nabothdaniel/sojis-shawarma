<?php
header('Content-Type: text/plain');

function tail($file, $bytes = 5120) {
    if (!file_exists($file)) return "File not found: $file";
    $fp = fopen($file, "r");
    fseek($fp, -$bytes, SEEK_END);
    $data = fread($fp, $bytes);
    fclose($fp);
    return $data;
}

echo "--- SMS BOWER LOG ---\n";
echo tail(__DIR__ . '/../storage/logs/sms_bower.log');
echo "\n\n--- PHP ERROR LOG ---\n";
echo tail(ini_get('error_log')); // Might not work if not set
echo "\n\n--- APACHE/NGINX/SERVER LOG (attempt) ---\n";
// Sometimes it's in a standard place
echo tail('/var/log/apache2/error.log', 1024);
echo tail('/var/log/nginx/error.log', 1024);
