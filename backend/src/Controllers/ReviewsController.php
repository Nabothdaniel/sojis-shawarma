<?php

require_once __DIR__ . '/../Support/Auth.php';
require_once __DIR__ . '/../Support/EventStream.php';

class ReviewsController {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    public function create() {
        $user = $this->getCurrentUser();
        if (!$user || ($user['type'] ?? 'user') !== 'user') {
            header("HTTP/1.1 401 Unauthorized");
            return json_encode(['message' => 'Please sign in to leave a review']);
        }

        $data = json_decode(file_get_contents('php://input'), true);
        $orderId = (int) ($data['order_id'] ?? 0);
        $productId = trim((string) ($data['product_id'] ?? ''));
        $rating = (int) ($data['rating'] ?? 0);
        $reviewText = trim((string) ($data['review_text'] ?? ''));

        if ($orderId <= 0 || $productId === '' || $rating < 1 || $rating > 5) {
            header("HTTP/1.1 422 Unprocessable Entity");
            return json_encode(['message' => 'Order, product, and a 1-5 star rating are required']);
        }

        $orderStmt = $this->db->prepare("SELECT * FROM orders WHERE id = ? AND user_id = ?");
        $orderStmt->execute([$orderId, $user['id']]);
        $order = $orderStmt->fetch(PDO::FETCH_ASSOC);

        if (!$order) {
            header("HTTP/1.1 404 Not Found");
            return json_encode(['message' => 'Order not found']);
        }

        if (($order['status'] ?? '') !== 'delivered') {
            header("HTTP/1.1 422 Unprocessable Entity");
            return json_encode(['message' => 'Reviews are available only after delivery']);
        }

        $items = json_decode($order['items'] ?? '[]', true);
        $matchedItem = null;
        foreach ($items as $item) {
            if ((string) ($item['id'] ?? '') === $productId) {
                $matchedItem = $item;
                break;
            }
        }

        if (!$matchedItem) {
            header("HTTP/1.1 422 Unprocessable Entity");
            return json_encode(['message' => 'This product was not part of the selected order']);
        }

        $stmt = $this->db->prepare("
            INSERT INTO reviews (user_id, order_id, product_id, product_name, rating, review_text)
            VALUES (?, ?, ?, ?, ?, ?)
        ");

        try {
            $stmt->execute([
                $user['id'],
                $orderId,
                $productId,
                $matchedItem['name'] ?? 'Product',
                $rating,
                $reviewText ?: null,
            ]);
        } catch (PDOException $e) {
            header("HTTP/1.1 409 Conflict");
            return json_encode(['message' => 'You have already reviewed this item from this order']);
        }

        $reviewId = (int) $this->db->lastInsertId();
        $review = $this->fetchReviewById($reviewId);
        $summary = $this->getProductRatingSummary($productId);

        if ($review !== null) {
            publishEvent('review_created', $review, 'admin');
        }

        publishEvent('product_rating_updated', [
            'product_id' => $productId,
            'product_name' => $matchedItem['name'] ?? 'Product',
            'average_rating' => $summary['average_rating'],
            'review_count' => $summary['review_count'],
        ], 'public');

        header("HTTP/1.1 201 Created");
        return json_encode([
            'status' => 'success',
            'message' => 'Review submitted',
            'data' => [
                'review' => $review,
                'summary' => $summary,
            ],
        ]);
    }

    public function getAll() {
        $user = $this->getCurrentUser();
        if (!$user || ($user['role'] ?? 'user') !== 'admin') {
            header("HTTP/1.1 401 Unauthorized");
            return json_encode(['message' => 'Admin access required']);
        }

        $stmt = $this->db->query("
            SELECT r.*, u.name AS user_name, u.email AS user_email
            FROM reviews r
            LEFT JOIN users u ON u.id = r.user_id
            ORDER BY r.created_at DESC
        ");

        return json_encode([
            'status' => 'success',
            'data' => $stmt->fetchAll(PDO::FETCH_ASSOC),
        ]);
    }

    private function getCurrentUser() {
        $token = getBearerToken();
        $payload = $token ? verifyJwt($token) : false;
        return $payload ?: null;
    }

    private function fetchReviewById(int $reviewId): ?array
    {
        $stmt = $this->db->prepare("
            SELECT r.*, u.name AS user_name, u.email AS user_email
            FROM reviews r
            LEFT JOIN users u ON u.id = r.user_id
            WHERE r.id = ?
            LIMIT 1
        ");
        $stmt->execute([$reviewId]);
        $review = $stmt->fetch(PDO::FETCH_ASSOC);

        return $review ?: null;
    }

    private function getProductRatingSummary(string $productId): array
    {
        $stmt = $this->db->prepare("
            SELECT COUNT(*) AS review_count, ROUND(AVG(rating), 1) AS average_rating
            FROM reviews
            WHERE product_id = ?
        ");
        $stmt->execute([$productId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC) ?: [];

        return [
            'product_id' => $productId,
            'review_count' => (int) ($row['review_count'] ?? 0),
            'average_rating' => round((float) ($row['average_rating'] ?? 0), 1),
        ];
    }
}
