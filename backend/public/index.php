<?php

require_once __DIR__ . '/../src/Core/Database.php';
require_once __DIR__ . '/../src/Core/Router.php';
require_once __DIR__ . '/../src/Core/Controller.php';

// Simple autoloader for our project structure
spl_autoload_register(function ($class) {
    $prefix = 'BamzySMS\\';
    $base_dir = __DIR__ . '/../src/';

    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) {
        return;
    }

    $relative_class = substr($class, $len);
    $file = $base_dir . str_replace('\\', '/', $relative_class) . '.php';

    if (file_exists($file)) {
        require $file;
    }
});

use BamzySMS\Core\Router;

// Handle CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

$router = new Router();

// Routes
$router->add('POST', '/api/auth/login', 'AuthController', 'login');
$router->add('POST', '/api/auth/register', 'AuthController', 'register');
$router->add('POST', '/api/auth/send-otp', 'AuthController', 'sendOtp');
$router->add('POST', '/api/auth/verify-otp', 'AuthController', 'verifyOtp');
$router->add('POST', '/api/auth/reset-password', 'AuthController', 'resetPassword');
$router->add('GET', '/api/user/profile', 'UserController', 'getProfile');
$router->add('GET', '/api/user/balance', 'UserController', 'getBalance');
$router->add('GET', '/api/services', 'ServiceController', 'getServices');
$router->add('POST', '/api/purchase', 'TransactionController', 'purchase');
$router->add('GET', '/api/transactions', 'TransactionController', 'getHistory');
$router->add('POST', '/api/sms/buy', 'SMSController', 'buy');
$router->add('GET', '/api/sms/purchases', 'SMSController', 'getPurchases');

$router->resolve();
