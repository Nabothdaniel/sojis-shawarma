<?php

namespace BamzySMS\Models;

use BamzySMS\Core\Database;
use PDO;

class Transaction {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    public function create($userId, $amount, $type, $description) {
        $this->db->beginTransaction();
        try {
            // Update user balance
            $operator = $type === 'credit' ? '+' : '-';
            $sqlUser = "UPDATE users SET balance = balance $operator ? WHERE id = ?";
            $stmtUser = $this->db->prepare($sqlUser);
            $stmtUser->execute([$amount, $userId]);

            // Create transaction record
            $sqlTx = "INSERT INTO transactions (user_id, amount, type, description) VALUES (?, ?, ?, ?)";
            $stmtTx = $this->db->prepare($sqlTx);
            $stmtTx->execute([$userId, $amount, $type, $description]);

            $this->db->commit();
            return true;
        } catch (\Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    public function getByUser($userId) {
        $sql = "SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$userId]);
        return $stmt->fetchAll();
    }
}
