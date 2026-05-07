<?php

require_once __DIR__ . '/../Support/Auth.php';

class FeedbackController {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    public function create() {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $name = trim((string) ($data['name'] ?? ''));
        $email = trim((string) ($data['email'] ?? ''));
        $rating = (int) ($data['rating'] ?? 0);
        $message = trim((string) ($data['message'] ?? ''));
        
        // Attempt to get user if logged in
        $user = $this->getCurrentUser();
        $userId = $user ? $user['id'] : null;

        if ($name === '' || $message === '') {
            header("HTTP/1.1 422 Unprocessable Entity");
            return json_encode(['message' => 'Name and message are required']);
        }

        $stmt = $this->db->prepare("
            INSERT INTO feedbacks (user_id, name, email, rating, message)
            VALUES (?, ?, ?, ?, ?)
        ");

        $stmt->execute([
            $userId,
            $name,
            $email ?: null,
            $rating,
            $message
        ]);

        header("HTTP/1.1 201 Created");
        return json_encode([
            'status' => 'success',
            'message' => 'Feedback submitted successfully'
        ]);
    }

    public function getAll() {
        $user = $this->getCurrentUser();
        if (!$user || ($user['role'] ?? 'user') !== 'admin') {
            header("HTTP/1.1 401 Unauthorized");
            return json_encode(['message' => 'Admin access required']);
        }

        $stmt = $this->db->query("SELECT * FROM feedbacks ORDER BY created_at DESC");
        return json_encode([
            'status' => 'success',
            'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)
        ]);
    }

    private function getCurrentUser() {
        $token = getBearerToken();
        $payload = $token ? verifyJwt($token) : false;
        return $payload ?: null;
    }
}
