<?php

require_once __DIR__ . '/Core/Database.php';
require_once __DIR__ . '/Core/Router.php';
require_once __DIR__ . '/Core/Controller.php';

// ─── Load .env ────────────────────────────────────────────────────────────────
$envCandidates = [
    __DIR__ . '/../.env',
    __DIR__ . '/../../.env',
    __DIR__ . '/../public/.env',
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
    $base_dir = __DIR__ . '/';
    $len      = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) return;
    $relative_class = substr($class, $len);
    $file = $base_dir . str_replace('\\', '/', $relative_class) . '.php';
    if (file_exists($file)) require $file;
});

if (!function_exists('env_or_default')) {
    function env_or_default(string $key, $default = null) {
        $fromEnv = $_ENV[$key] ?? getenv($key);
        return ($fromEnv !== false && $fromEnv !== null && $fromEnv !== '') ? $fromEnv : $default;
    }
}

function determine_cors_origin(): string {
    $allowed = env_or_default('CORS_ALLOWED_ORIGINS', '*');
    if ($allowed === '*') return '*';

    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    $list = array_map('trim', explode(',', (string)$allowed));
    if ($origin && in_array($origin, $list, true)) {
        return $origin;
    }
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
