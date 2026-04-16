<?php

namespace BamzySMS\Middleware;

use BamzySMS\Models\User;

class AuthMiddleware {
    public static function handle() {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
        $token = '';

        if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            $token = $matches[1];
        } elseif (isset($_GET['token']) && !empty($_GET['token'])) {
            $token = $_GET['token'];
        }

        if ($token) {
            $payload = \BamzySMS\Core\JwtHelper::verify($token);
            if ($payload && isset($payload['id'])) {
                return $payload['id'];
            }
        }

        header('Content-Type: application/json');
        header('HTTP/1.1 401 Unauthorized');
        echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
        exit;
    }
}
