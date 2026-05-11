<?php

function applyCorsHeaders(): void
{
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    $configuredOrigin = trim((string) (getenv('CORS_ORIGIN') ?: ''));
    $allowedOrigins = array_filter([
        $configuredOrigin,
        'http://localhost:3000',
        'http://127.0.0.1:3000',
    ]);

    $allowOrigin = 'http://localhost:3000';

    if ($origin !== '' && in_array($origin, $allowedOrigins, true)) {
        $allowOrigin = $origin;
    } elseif ($configuredOrigin !== '') {
        $allowOrigin = $configuredOrigin;
    }

    header("Access-Control-Allow-Origin: {$allowOrigin}");
    header("Access-Control-Allow-Credentials: true");
    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-Session-ID");
    header("Vary: Origin");
}
