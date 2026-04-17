<?php

namespace BamzySMS\Models;

use BamzySMS\Core\Database;
use PDO;

class User {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    public function create($data) {
        $sql = "INSERT INTO users (username, name, phone, password, referral_code) VALUES (?, ?, ?, ?, ?)";
        $stmt = $this->db->prepare($sql);
        $username = strtolower($data['username'] ?? preg_replace('/[^a-zA-Z0-9]/', '', $data['name'] ?? 'user' . rand(100, 999)));
        $stmt->execute([
            $username,
            $data['name'] ?? $username,
            $data['phone'] ?? null,
            password_hash($data['password'], PASSWORD_DEFAULT),
            'BAMZY' . strtoupper(substr(uniqid(), -6))
        ]);
        return $this->db->lastInsertId();
    }

    public function findByUsername($username) {
        $sql = "SELECT * FROM users WHERE username = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([strtolower(trim((string) $username))]);
        return $stmt->fetch();
    }

    public function findById($id) {
        $sql = "SELECT id, username, name, phone, balance, role, created_at FROM users WHERE id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Update a user's balance directly (admin/manual adjustments).
     * Clamps to 0 — cannot set a negative balance.
     */
    public function updateBalance(int $userId, float $newBalance): bool {
        $newBalance = max(0.00, $newBalance); // hard floor: never go negative
        $stmt = $this->db->prepare("UPDATE users SET balance = ? WHERE id = ?");
        return $stmt->execute([$newBalance, $userId]);
    }

    /**
     * List all users for administrative purposes.
     */
    public function getAllUsers(): array {
        $stmt = $this->db->query("SELECT id, username, name, phone, balance, role, created_at FROM users ORDER BY id DESC");
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function updatePassword($username, $password) {
        $stmt = $this->db->prepare("UPDATE users SET password = ? WHERE username = ?");
        return $stmt->execute([
            password_hash($password, PASSWORD_DEFAULT),
            strtolower(trim((string) $username))
        ]);
    }

    public function deductBalance($userId, $amount) {
        $stmt = $this->db->prepare("UPDATE users SET balance = balance - ? WHERE id = ? AND balance >= ?");
        return $stmt->execute([$amount, $userId, $amount]);
    }

    /**
     * Add to a user's balance (top-ups, refunds).
     * Guards against negative amounts being passed in.
     */
    public function addBalance($userId, $amount) {
        if ((float)$amount <= 0) return false; // never subtract via addBalance
        $stmt = $this->db->prepare("UPDATE users SET balance = balance + ? WHERE id = ?");
        return $stmt->execute([$amount, $userId]);
    }

    public function updateToken($id, $token) {
        $hashedToken = hash('sha256', $token);
        $sql = "UPDATE users SET token = ? WHERE id = ?";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([$hashedToken, $id]);
    }

    public function updatePin($id, $pin) {
        $hashedPin = password_hash($pin, PASSWORD_DEFAULT);
        $sql = "UPDATE users SET transaction_pin = ? WHERE id = ?";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([$hashedPin, $id]);
    }

    public function verifyPin($id, $pin) {
        $sql = "SELECT transaction_pin FROM users WHERE id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$id]);
        $user = $stmt->fetch();
        if (!$user || !$user['transaction_pin']) return false;
        return password_verify($pin, $user['transaction_pin']);
    }

    public function hasPin($id) {
        $sql = "SELECT transaction_pin FROM users WHERE id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$id]);
        $user = $stmt->fetch();
        return !empty($user['transaction_pin']);
    }

    public function verifyToken($token) {
        $hashedToken = hash('sha256', $token);
        $sql = "SELECT id FROM users WHERE token = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$hashedToken]);
        $user = $stmt->fetch();
        return $user ? $user['id'] : null;
    }
}
