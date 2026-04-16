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
            // 1. If debit, check for sufficient balance first
            if ($type === 'debit') {
                $stmtCheck = $this->db->prepare("SELECT balance FROM users WHERE id = ? FOR UPDATE");
                $stmtCheck->execute([$userId]);
                $user = $stmtCheck->fetch(PDO::FETCH_ASSOC);
                
                if (!$user || (float)$user['balance'] < (float)$amount) {
                    $this->db->rollBack();
                    return false;
                }
            }

            // 2. Update user balance
            $operator = $type === 'credit' ? '+' : '-';
            $sqlUser = "UPDATE users SET balance = balance $operator ? WHERE id = ?";
            $stmtUser = $this->db->prepare($sqlUser);
            $stmtUser->execute([$amount, $userId]);

            // 3. Create transaction record
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
