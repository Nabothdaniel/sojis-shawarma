<?php

error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once __DIR__ . '/../src/Support/Env.php';
require_once __DIR__ . '/../src/Config/cors.php';
require_once __DIR__ . '/../src/Http/ApiKernel.php';

loadEnv(__DIR__ . '/../.env');
applyCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header("HTTP/1.1 200 OK");
    exit();
}

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri = str_replace('/api', '', $uri);
$method = $_SERVER['REQUEST_METHOD'];

$routes = require __DIR__ . '/../src/Config/routes.php';
$kernel = new ApiKernel($routes);
$kernel->handle($method, $uri);
