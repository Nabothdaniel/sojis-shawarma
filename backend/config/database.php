<?php

if (!function_exists('env_or_default')) {
    function env_or_default(string $key, $default = null) {
        $fromEnv = $_ENV[$key] ?? getenv($key);
        return ($fromEnv !== false && $fromEnv !== null && $fromEnv !== '') ? $fromEnv : $default;
    }
}

return [
    'host' => env_or_default('DB_HOST', 'localhost'),
    'dbname' => env_or_default('DB_NAME', 'bamzy_db'),
    'user' => env_or_default('DB_USER', 'root'),
    'pass' => env_or_default('DB_PASS', ''),
    'charset' => env_or_default('DB_CHARSET', 'utf8mb4'),
];
