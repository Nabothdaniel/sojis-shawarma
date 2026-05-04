<?php

require_once __DIR__ . '/../Support/Auth.php';

class UserController {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    public function profile() {
        $user = $this->getCurrentUser();
        if (!$user) {
            header("HTTP/1.1 401 Unauthorized");
            return json_encode(['message' => 'Authentication required']);
        }

        if (($user['type'] ?? 'user') === 'admin') {
            $stmt = $this->db->prepare("SELECT id, name, email, role, created_at FROM admins WHERE id = ?");
            $stmt->execute([$user['id']]);
            $profile = $stmt->fetch(PDO::FETCH_ASSOC);
        } else {
            $stmt = $this->db->prepare("SELECT id, name, email, phone, address, role, created_at FROM users WHERE id = ?");
            $stmt->execute([$user['id']]);
            $profile = $stmt->fetch(PDO::FETCH_ASSOC);
        }

        if (!$profile) {
            header("HTTP/1.1 404 Not Found");
            return json_encode(['message' => 'User profile not found']);
        }

        return json_encode([
            'status' => 'success',
            'data' => $profile,
        ]);
    }

    private function getCurrentUser() {
        $token = getBearerToken();
        $payload = $token ? verifyJwt($token) : false;
        return $payload ?: null;
    }
}
