<?php

function decryptSensitiveInput($value) {
    if (!is_string($value) || $value === '') {
        return $value;
    }

    $keyText = getenv('NEXT_PUBLIC_ENCRYPTION_KEY') ?: getenv('ENCRYPTION_KEY') ?: 'BAMZY-DEFAULT-KEY-2026';
    $key = hash('sha256', $keyText, true);
    $decoded = base64_decode($value, true);

    if ($decoded === false || strlen($decoded) <= 16) {
        return $value;
    }

    $iv = substr($decoded, 0, 16);
    $ciphertext = substr($decoded, 16);

    $decrypted = openssl_decrypt(
        $ciphertext,
        'AES-256-CBC',
        $key,
        OPENSSL_RAW_DATA,
        $iv
    );

    return $decrypted === false ? $value : $decrypted;
}
