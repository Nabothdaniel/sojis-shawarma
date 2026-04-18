<?php

namespace BamzySMS\Models;

use BamzySMS\Core\Database;
use PDO;

class Verification {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    public function create($username, $otp, $type = 'signup') {
        $expiresAt = date('Y-m-d H:i:s', strtotime('+15 minutes'));
        
        // Clear previous OTPs for this username/type to keep it clean
        $stmt = $this->db->prepare("DELETE FROM verifications WHERE username = ? AND type = ?");
        $stmt->execute([$username, $type]);

        $stmt = $this->db->prepare("INSERT INTO verifications (username, otp, type, expires_at) VALUES (?, ?, ?, ?)");
        return $stmt->execute([$username, $otp, $type, $expiresAt]);
    }

    public function verify($username, $otp, $type = 'signup', $deleteAfter = true) {
        $stmt = $this->db->prepare("SELECT * FROM verifications WHERE username = ? AND otp = ? AND type = ? AND expires_at > NOW()");
        $stmt->execute([$username, $otp, $type]);
        $verification = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($verification) {
            if ($deleteAfter) {
                $this->db->prepare("DELETE FROM verifications WHERE id = ?")->execute([$verification['id']]);
            }
            return true;
        }

        return false;
    }

    public function getRecentForUser($username) {
        $stmt = $this->db->prepare("SELECT otp, type, created_at, expires_at FROM verifications WHERE username = ? ORDER BY created_at DESC LIMIT 5");
        $stmt->execute([$username]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
