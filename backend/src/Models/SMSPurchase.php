<?php

namespace BamzySMS\Models;

use BamzySMS\Core\Database;
use PDO;

class SMSPurchase {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    /**
     * Create a new purchase record.
     * Returns the new row's ID.
     */
    public function create(
        int    $userId,
        int    $activationId,
        string $serviceCode,
        string $serviceName,
        string $countryName,
        string $phoneNumber,
        float  $price
    ): int {
        $stmt = $this->db->prepare("
            INSERT INTO sms_purchases
                (user_id, activation_id, service_code, service_name, country_name, phone_number, activation_cost, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
        ");
        $stmt->execute([$userId, $activationId, $serviceCode, $serviceName, $countryName, $phoneNumber, $price]);
        return (int)$this->db->lastInsertId();
    }

    /**
     * Fetch all purchases for a user, newest first.
     */
    public function getByUser(int $userId): array {
        $stmt = $this->db->prepare("
            SELECT * FROM sms_purchases
            WHERE user_id = ?
            ORDER BY created_at DESC
        ");
        $stmt->execute([$userId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Find a specific activation by activation_id, scoped to a user.
     */
    public function getByActivationId(int $activationId, int $userId): ?array {
        $stmt = $this->db->prepare("
            SELECT * FROM sms_purchases
            WHERE activation_id = ? AND user_id = ?
            LIMIT 1
        ");
        $stmt->execute([$activationId, $userId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    /**
     * Update the status and OTP code of a purchase.
     */
    public function updateStatus(int $id, string $status, ?string $otpCode): bool {
        $stmt = $this->db->prepare("
            UPDATE sms_purchases
            SET status = ?, otp_code = ?
            WHERE id = ?
        ");
        return $stmt->execute([$status, $otpCode, $id]);
    }

    /**
     * Soft-hide a purchase record.
     */
    public function hidePurchase(int $id, int $userId): bool {
        $stmt = $this->db->prepare("
            UPDATE sms_purchases
            SET is_hidden = 1
            WHERE id = ? AND user_id = ?
        ");
        return $stmt->execute([$id, $userId]);
    }

    /**
     * Fetch paginated purchases for a user (excluding hidden ones).
     */
    public function getByUserPaginated(int $userId, int $limit, int $offset): array {
        $stmt = $this->db->prepare("
            SELECT * FROM sms_purchases
            WHERE user_id = ? AND is_hidden = 0
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        ");
        $stmt->execute([$userId, $limit, $offset]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Get total count of non-hidden purchases for pagination meta.
     */
    public function countByUser(int $userId): int {
        $stmt = $this->db->prepare("
            SELECT COUNT(*) FROM sms_purchases
            WHERE user_id = ? AND is_hidden = 0
        ");
        $stmt->execute([$userId]);
        return (int)$stmt->fetchColumn();
    }
}
