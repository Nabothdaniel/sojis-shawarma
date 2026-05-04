<?php

// Enable error reporting for development
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once __DIR__ . '/../src/Core/Database.php';
require_once __DIR__ . '/../src/Support/Bootstrap.php';

// Basic CORS headers for development
header("Access-Control-Allow-Origin: http://localhost:3000"); // Allow frontend origin
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-Session-ID"); // Added X-Requested-With for broader compatibility

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header("HTTP/1.1 200 OK");
    exit(); // Terminate script after sending preflight headers
}

// Utility to load .env
function loadEnv($path) {
    if (!file_exists($path)) return;
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        list($name, $value) = explode('=', $line, 2);
        $_ENV[trim($name)] = trim($value);
        putenv(trim($name) . '=' . trim($value));
    }
}

loadEnv(__DIR__ . '/../.env');

// Routing
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri = str_replace('/api', '', $uri); // Strip /api prefix
$method = $_SERVER['REQUEST_METHOD'];

// Database Connection
function getDB() {
    try {
        $pdo = Database::getInstance();
        $driver = getenv('DB_DRIVER') ?: 'mysql';
        ensureBackendSchema($pdo, $driver);
        return $pdo;
    } catch (PDOException $e) {
        header('Content-Type: application/json');
        echo json_encode(['error' => 'Database connection failed', 'details' => $e->getMessage()]);
        exit;
    }
}

// Simple Router
$routes = [
    'POST' => [
        '/auth/login' => 'Auth@login',
        '/auth/refresh' => 'Auth@refresh',
        '/auth/logout' => 'Auth@logout',
        '/products' => 'Products@create',
        '/categories' => 'Categories@create',
        '/orders' => 'Orders@create',
        '/orders/(\d+)/confirm-payment' => 'Orders@confirmPayment',
        '/uploads/catalog' => 'Uploads@catalog',
        '/sessions' => 'Sessions@create',
        '/telegram/webhook' => 'Telegram@handle'
    ],
    'GET' => [
        '/' => 'Orders@health',
        '/products' => 'Products@getAll',
        '/categories' => 'Categories@getAll',
        '/orders' => 'Orders@getAll',
        '/orders/(\d+)' => 'Orders@getOne',
        '/analytics/summary' => 'Analytics@getSummary',
        '/analytics/sessions' => 'Analytics@getSessions'
    ],
    'PUT' => [
        '/products/(\d+)' => 'Products@update',
        '/categories/(\d+)' => 'Categories@update',
        '/orders/(\d+)/status' => 'Orders@updateStatus',
        '/sessions/(.+)' => 'Sessions@update'
    ],
    'DELETE' => [
        '/products/(\d+)' => 'Products@delete',
        '/categories/(\d+)' => 'Categories@delete'
    ]
];

$matched = false;
$params = [];

foreach ($routes[$method] ?? [] as $pattern => $handler) {
    if (preg_match("#^$pattern$#", $uri, $matches)) {
        $matched = $handler;
        $params = array_slice($matches, 1);
        break;
    }
}

if ($matched) {
    list($controllerName, $action) = explode('@', $matched);
    $controllerFile = __DIR__ . "/../src/Controllers/{$controllerName}Controller.php";
    
    if (file_exists($controllerFile)) {
        require_once $controllerFile;
        $className = "{$controllerName}Controller";
        $controller = new $className(getDB());
        
        header('Content-Type: application/json');
        echo call_user_func_array([$controller, $action], $params);
    } else {
        header("HTTP/1.1 500 Internal Server Error");
        echo json_encode(['error' => "Controller $controllerName not found"]);
    }
} else {
    header("HTTP/1.1 404 Not Found");
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Route not found', 'uri' => $uri]);
}
