<?php

function getJwtSecret() {
    return getenv('JWT_SECRET') ?: 'default_secret';
}

function generateJwt(array $payload, int $expiry) {
    $header = base64_encode(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
    $payload['exp'] = time() + $expiry;
    $encodedPayload = base64_encode(json_encode($payload));
    $signature = base64_encode(hash_hmac('sha256', "$header.$encodedPayload", getJwtSecret(), true));

    return "$header.$encodedPayload.$signature";
}

function verifyJwt(string $token) {
    if (!$token) {
        return false;
    }

    $parts = explode('.', $token);
    if (count($parts) !== 3) {
        return false;
    }

    [$header, $payload, $signature] = $parts;
    $validSignature = base64_encode(hash_hmac('sha256', "$header.$payload", getJwtSecret(), true));

    if (!hash_equals($validSignature, $signature)) {
        return false;
    }

    $data = json_decode(base64_decode($payload), true);
    if (!is_array($data) || (($data['exp'] ?? 0) < time())) {
        return false;
    }

    return $data;
}

function getBearerToken() {
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['Authorization'] ?? '';
    if (!$header && function_exists('getallheaders')) {
        $headers = getallheaders();
        $header = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    }

    if (preg_match('/Bearer\s+(.*)$/i', $header, $matches)) {
        return trim($matches[1]);
    }

    return null;
}
