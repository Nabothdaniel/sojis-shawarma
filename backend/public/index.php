<?php

require_once __DIR__ . '/../src/Core/Database.php';
require_once __DIR__ . '/../src/Core/Router.php';
require_once __DIR__ . '/../src/Core/Controller.php';

// ─── Load .env ────────────────────────────────────────────────────────────────
$envCandidates = [
    __DIR__ . '/.env',
    __DIR__ . '/../.env',
    __DIR__ . '/../../.env',
];

foreach ($envCandidates as $envFile) {
    if (file_exists($envFile)) {
        foreach (file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
            if (str_starts_with(trim($line), '#')) continue;
            if (!str_contains($line, '=')) continue;
            [$key, $val] = explode('=', $line, 2);
            $_ENV[trim($key)] = trim($val);
            putenv(trim($key) . '=' . trim($val));
        }
        break;
    }
}

// ─── Autoloader ───────────────────────────────────────────────────────────────
spl_autoload_register(function ($class) {
    $prefix   = 'BamzySMS\\';
    $base_dir = __DIR__ . '/../src/';
    $len      = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) return;
    $relative_class = substr($class, $len);
    $file = $base_dir . str_replace('\\', '/', $relative_class) . '.php';
    if (file_exists($file)) require $file;
});

use BamzySMS\Core\Router;

if (!function_exists('env_or_default')) {
    function env_or_default(string $key, $default = null) {
        $fromEnv = $_ENV[$key] ?? getenv($key);
        return ($fromEnv !== false && $fromEnv !== null && $fromEnv !== '') ? $fromEnv : $default;
    }
}

function determine_cors_origin(): string {
    $allowed = env_or_default('CORS_ALLOWED_ORIGINS', '*');
    if ($allowed === '*') {
        return '*';
    }

    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    $list = array_map('trim', explode(',', (string)$allowed));
    if ($origin && in_array($origin, $list, true)) {
        return $origin;
    }

    // Fallback to first configured origin.
    return $list[0] ?? '*';
}

// ─── CORS ─────────────────────────────────────────────────────────────────────
header("Access-Control-Allow-Origin: " . determine_cors_origin());
header("Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Vary: Origin");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

// ─── Routes ───────────────────────────────────────────────────────────────────
$router = new Router();

// Auth
$router->add('POST', '/api/auth/login',          'AuthController',        'login');
$router->add('POST', '/api/auth/register',        'AuthController',        'register');
$router->add('POST', '/api/auth/send-otp',        'AuthController',        'sendOtp');
$router->add('POST', '/api/auth/verify-otp',      'AuthController',        'verifyOtp');
$router->add('POST', '/api/auth/reset-password',  'AuthController',        'resetPassword');

// User
$router->add('GET',  '/api/user/profile',         'UserController',        'getProfile');
$router->add('GET',  '/api/user/balance',         'UserController',        'getBalance');
$router->add('POST', '/api/user/update-pin',      'UserController',        'updatePin');
$router->add('POST', '/api/user/verify-pin',      'UserController',        'verifyPin');
$router->add('GET',  '/api/transactions',         'TransactionController', 'getHistory');
$router->add('POST', '/api/purchase',             'TransactionController', 'purchase');

// Services & Countries (live from SMSBower)
$router->add('GET',  '/api/services',             'ServiceController',     'getServices');
$router->add('GET',  '/api/countries',            'ServiceController',     'getCountries');
$router->add('GET',  '/api/prices',               'ServiceController',     'getPrices');
$router->add('GET',  '/api/available',            'ServiceController',     'getAvailable');

// SMS / Activations
$router->add('POST', '/api/sms/buy',              'SMSController',         'buy');
$router->add('POST', '/api/sms/reveal',           'SMSController',         'getPlainNumber');
$router->add('GET',  '/api/sms/purchases',        'SMSController',         'getPurchases');
$router->add('GET',  '/api/sms/status',           'SMSController',         'getStatus');
$router->add('POST', '/api/sms/set-status',       'SMSController',         'setActivationStatus');
$router->add('POST', '/api/sms/hide',             'SMSController',         'hide');

// Admin
$router->add('GET',  '/api/admin/provider-balance', 'AdminController', 'getProviderBalance');
$router->add('GET',  '/api/admin/users',            'AdminController', 'getAllUsers');
$router->add('POST', '/api/admin/user/balance',     'AdminController', 'updateUserBalance');
$router->add('GET',  '/api/admin/settings',         'AdminController', 'getSettings');
$router->add('POST', '/api/admin/settings',        'AdminController', 'updateSettings');
$router->add('GET',  '/api/admin/logs',             'AdminController', 'getSystemLogs');
$router->add('GET',  '/api/admin/pricing/overrides', 'AdminController', 'getPricingOverrides');
$router->add('POST', '/api/admin/pricing/update',    'AdminController', 'updatePricingOverride');
$router->add('DELETE','/api/admin/pricing/delete',   'AdminController', 'deletePricingOverride');
$router->add('GET',  '/api/admin/setup-master',     'AdminController', 'setupMasterAdmin');

// Utils
$router->add('GET',  '/api/utils/server-ip',      'UtilsController',       'getServerIp');

$router->resolve();
