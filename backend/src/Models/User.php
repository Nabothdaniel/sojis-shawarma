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
        $sql = "INSERT INTO users (name, email, phone, password, referral_code) VALUES (?, ?, ?, ?, ?)";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            $data['name'],
            $data['email'],
            $data['phone'],
            password_hash($data['password'], PASSWORD_DEFAULT),
            'BAMZY' . strtoupper(substr(uniqid(), -6))
        ]);
        return $this->db->lastInsertId();
    }

    public function findByEmail($email) {
        $sql = "SELECT * FROM users WHERE email = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$email]);
        return $stmt->fetch();
    }

    public function findById($id) {
        $sql = "SELECT id, name, email, phone, balance, sms_units as smsUnits, referral_code as referralCode FROM users WHERE id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$id]);
        return $stmt->fetch();
    }

    public function updatePassword($email, $hashedPassword) {
        $stmt = $this->db->prepare("UPDATE users SET password = ? WHERE email = ?");
        return $stmt->execute([$hashedPassword, $email]);
    }

    public function deductBalance($userId, $amount) {
        $stmt = $this->db->prepare("UPDATE users SET balance = balance - ? WHERE id = ? AND balance >= ?");
        return $stmt->execute([$amount, $userId, $amount]);
    }

    public function updateToken($id, $token) {
        $sql = "UPDATE users SET token = ? WHERE id = ?";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([$token, $id]);
    }

    public function verifyToken($token) {
        $sql = "SELECT id FROM users WHERE token = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$token]);
        $user = $stmt->fetch();
        return $user ? $user['id'] : null;
    }
}
