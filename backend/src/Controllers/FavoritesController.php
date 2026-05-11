<?php

require_once __DIR__ . '/../Support/Auth.php';

class FavoritesController {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    public function list() {
        $user = $this->getCurrentUser();
        if (!$user) {
            header("HTTP/1.1 401 Unauthorized");
            return json_encode(['message' => 'Authentication required']);
        }

        $stmt = $this->db->prepare("
            SELECT p.*, c.name as category_name 
            FROM products p 
            INNER JOIN favorites f ON p.id = f.product_id 
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE f.user_id = ?
        ");
        $stmt->execute([$user['id']]);
        $favorites = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return json_encode([
            'status' => 'success',
            'data' => $favorites,
        ]);
    }

    public function toggle() {
        $user = $this->getCurrentUser();
        if (!$user) {
            header("HTTP/1.1 401 Unauthorized");
            return json_encode(['message' => 'Authentication required']);
        }

        $input = json_decode(file_get_contents('php://input'), true);
        $productId = $input['product_id'] ?? null;

        if (!$productId) {
            header("HTTP/1.1 400 Bad Request");
            return json_encode(['message' => 'Product ID is required']);
        }

        // Check if exists
        $stmt = $this->db->prepare("SELECT id FROM favorites WHERE user_id = ? AND product_id = ?");
        $stmt->execute([$user['id'], $productId]);
        $existing = $stmt->fetch();

        if ($existing) {
            $stmt = $this->db->prepare("DELETE FROM favorites WHERE user_id = ? AND product_id = ?");
            $stmt->execute([$user['id'], $productId]);
            return json_encode(['status' => 'success', 'action' => 'removed']);
        } else {
            $stmt = $this->db->prepare("INSERT INTO favorites (user_id, product_id) VALUES (?, ?)");
            $stmt->execute([$user['id'], $productId]);
            return json_encode(['status' => 'success', 'action' => 'added']);
        }
    }

    private function getCurrentUser() {
        $token = getBearerToken();
        $payload = $token ? verifyJwt($token) : false;
        return $payload ?: null;
    }
}
