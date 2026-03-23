<?php

namespace BamzySMS\Models;

use BamzySMS\Core\Database;
use PDO;

class SMSPurchase {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    public function create($userId, $serviceId, $phoneNumber) {
        $stmt = $this->db->prepare("INSERT INTO sms_purchases (user_id, service_id, phone_number) VALUES (?, ?, ?)");
        return $stmt->execute([$userId, $serviceId, $phoneNumber]);
    }

    public function getByUser($userId) {
        $stmt = $this->db->prepare("
            SELECT p.*, s.name as service_name, s.country 
            FROM sms_purchases p 
            JOIN services s ON p.service_id = s.id 
            WHERE p.user_id = ? 
            ORDER BY p.created_at DESC
        ");
        $stmt->execute([$userId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function updateOtp($id, $otp) {
        $stmt = $this->db->prepare("UPDATE sms_purchases SET otp_code = ?, status = 'received' WHERE id = ?");
        return $stmt->execute([$otp, $id]);
    }
}
