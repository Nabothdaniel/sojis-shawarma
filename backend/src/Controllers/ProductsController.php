<?php

require_once __DIR__ . '/../Support/Auth.php';

class ProductsController {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    public function getAll() {
        $stmt = $this->db->query("SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id ORDER BY p.created_at DESC");
        $products = $stmt->fetchAll();

        $orderStats = [];
        $orderRows = $this->db->query("SELECT items, status FROM orders")->fetchAll(PDO::FETCH_ASSOC);
        foreach ($orderRows as $order) {
            if (!in_array($order['status'] ?? 'pending', ['confirmed', 'preparing', 'dispatched', 'delivered'], true)) {
                continue;
            }

            $items = json_decode($order['items'] ?? '[]', true);
            if (!is_array($items)) {
                continue;
            }

            foreach ($items as $item) {
                $productId = (string) ($item['id'] ?? '');
                if ($productId === '') {
                    continue;
                }

                $orderStats[$productId] = ($orderStats[$productId] ?? 0) + (int) ($item['quantity'] ?? 1);
            }
        }

        $reviewStats = [];
        $reviewRows = $this->db->query("SELECT product_id, rating FROM reviews")->fetchAll(PDO::FETCH_ASSOC);
        foreach ($reviewRows as $review) {
            $productId = (string) ($review['product_id'] ?? '');
            if ($productId === '') {
                continue;
            }

            if (!isset($reviewStats[$productId])) {
                $reviewStats[$productId] = ['sum' => 0, 'count' => 0];
            }

            $reviewStats[$productId]['sum'] += (int) ($review['rating'] ?? 0);
            $reviewStats[$productId]['count'] += 1;
        }

        $products = array_map(function ($product) use ($orderStats, $reviewStats) {
            $productId = (string) ($product['id'] ?? '');
            $orderCount = (int) ($orderStats[$productId] ?? 0);
            $reviewCount = (int) ($reviewStats[$productId]['count'] ?? 0);
            $averageRating = $reviewCount > 0
                ? round($reviewStats[$productId]['sum'] / $reviewCount, 1)
                : 0.0;

            $product['order_count'] = $orderCount;
            $product['average_rating'] = $averageRating;
            $product['review_count'] = $reviewCount;
            $product['popular_score'] = round(($orderCount * 0.7) + ($averageRating * max($reviewCount, 1) * 0.3), 1);
            return $product;
        }, $products);

        usort($products, static function ($a, $b) {
            if (($b['popular_score'] ?? 0) === ($a['popular_score'] ?? 0)) {
                return strcmp((string) ($b['created_at'] ?? ''), (string) ($a['created_at'] ?? ''));
            }

            return ($b['popular_score'] ?? 0) <=> ($a['popular_score'] ?? 0);
        });

        return json_encode($products);
    }

    public function create() {
        if (!$this->isAdmin()) {
            header("HTTP/1.1 401 Unauthorized");
            return json_encode(['message' => 'Admin access required']);
        }

        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $this->db->prepare("INSERT INTO products (category_id, name, description, price, image_url, available) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([$data['category_id'], $data['name'], $data['description'], $data['price'], $data['image_url'], $data['available'] ?? 1]);
        return json_encode(['status' => 'success', 'id' => $this->db->lastInsertId()]);
    }

    public function update($id) {
        if (!$this->isAdmin()) {
            header("HTTP/1.1 401 Unauthorized");
            return json_encode(['message' => 'Admin access required']);
        }

        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $this->db->prepare("UPDATE products SET category_id = ?, name = ?, description = ?, price = ?, image_url = ?, available = ? WHERE id = ?");
        $stmt->execute([$data['category_id'], $data['name'], $data['description'], $data['price'], $data['image_url'], $data['available'], $id]);
        return json_encode(['status' => 'success']);
    }

    public function delete($id) {
        if (!$this->isAdmin()) {
            header("HTTP/1.1 401 Unauthorized");
            return json_encode(['message' => 'Admin access required']);
        }

        $stmt = $this->db->prepare("DELETE FROM products WHERE id = ?");
        $stmt->execute([$id]);
        return json_encode(['status' => 'success']);
    }

    private function isAdmin(): bool {
        $token = getBearerToken();
        $payload = $token ? verifyJwt($token) : false;
        return (bool) $payload && (($payload['role'] ?? 'user') === 'admin');
    }
}
