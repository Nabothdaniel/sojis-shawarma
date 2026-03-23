<?php

namespace BamzySMS\Middleware;

use BamzySMS\Models\User;

class AuthMiddleware {
    public static function handle() {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? '';

        if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            $token = $matches[1];
            $userModel = new User();
            $userId = $userModel->verifyToken($token);

            if ($userId) {
                return $userId;
            }
        }

        header('Content-Type: application/json');
        header('HTTP/1.1 401 Unauthorized');
        echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
        exit;
    }
}
