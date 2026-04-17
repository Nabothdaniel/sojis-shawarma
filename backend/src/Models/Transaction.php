<?php

namespace BamzySMS\Models;

use BamzySMS\Core\Database;
use PDO;

class Transaction {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    /**
     * Create a transaction record and update the user's balance atomically.
     *
     * @param string|null $externalRef  Provider-issued transaction ID (e.g. PaymentPoint's
     *                                   transaction_id). When set, the UNIQUE constraint on
     *                                   external_ref ensures a duplicate webhook cannot credit
     *                                   the wallet twice — the second INSERT will throw a
     *                                   duplicate-key error which we catch and return false.
     * @return bool  true = processed, false = insufficient balance OR duplicate (already done)
     */
    public function create($userId, $amount, $type, $description, ?string $externalRef = null) {
        $this->db->beginTransaction();
        try {
            // 1. If debit, check for sufficient balance first (row-level lock)
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
            $sqlUser  = "UPDATE users SET balance = balance $operator ? WHERE id = ?";
            $stmtUser = $this->db->prepare($sqlUser);
            $stmtUser->execute([$amount, $userId]);

            // 3. Create transaction record (external_ref UNIQUE = idempotency guard)
            $sqlTx  = "INSERT INTO transactions (user_id, amount, type, description, external_ref) VALUES (?, ?, ?, ?, ?)";
            $stmtTx = $this->db->prepare($sqlTx);
            $stmtTx->execute([$userId, $amount, $type, $description, $externalRef]);

            $this->db->commit();
            return true;
        } catch (\Exception $e) {
            $this->db->rollBack();
            // Duplicate external_ref — this exact transaction was already processed
            if ($e->getCode() == 23000 || str_contains($e->getMessage(), 'Duplicate entry')) {
                return false;
            }
            throw $e;
        }
    }

    /**
     * Credit a user's balance without opening a new DB transaction.
     * Call this only from within an already-open beginTransaction() block
     * (e.g., the refund flow in ActivationService::setStatus()).
     * Avoids nested-transaction issues while still keeping the credit
     * and the status update in the same atomic unit.
     */
    public function createCredit(int $userId, float $amount, string $description): void {
        $stmt = $this->db->prepare(
            "UPDATE users SET balance = balance + ? WHERE id = ?"
        );
        $stmt->execute([$amount, $userId]);

        $stmt2 = $this->db->prepare(
            "INSERT INTO transactions (user_id, amount, type, description) VALUES (?, ?, 'credit', ?)"
        );
        $stmt2->execute([$userId, $amount, $description]);
    }

    public function getByUser($userId) {
        $sql = "SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$userId]);
        return $stmt->fetchAll();
    }
}
