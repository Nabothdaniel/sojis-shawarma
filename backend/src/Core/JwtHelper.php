<?php

namespace BamzySMS\Core;

class JwtHelper {
    private static function getSecret(): string {
        $secret = getenv('JWT_SECRET') ?: $_ENV['JWT_SECRET'] ?? 'fallback_secret_for_bamzy_sms_dev';
        return $secret;
    }

    public static function generate(array $payload, int $expiry = 86400): string {
        $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
        
        $payload['iat'] = time();
        $payload['exp'] = time() + $expiry;
        $payloadStr = json_encode($payload);

        $base64UrlHeader = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
        $base64UrlPayload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payloadStr));

        $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, self::getSecret(), true);
        $base64UrlSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));

        return $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
    }

    public static function verify(string $jwt): ?array {
        $tokenParts = explode('.', $jwt);
        if (count($tokenParts) !== 3) return null;

        $header = $tokenParts[0];
        $payload = $tokenParts[1];
        $signatureProvided = $tokenParts[2];

        // Check if token is expired
        $payloadData = json_decode(base64_decode(str_replace(['-', '_'], ['+', '/'], $payload)), true);
        if (!$payloadData || (isset($payloadData['exp']) && $payloadData['exp'] < time())) {
            return null;
        }

        // Verify Signature
        $signatureCheck = hash_hmac('sha256', $header . "." . $payload, self::getSecret(), true);
        $base64UrlSignatureCheck = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signatureCheck));

        if ($base64UrlSignatureCheck !== $signatureProvided) {
            return null;
        }

        return $payloadData;
    }
}
