<?php

namespace BamzySMS\Models;

use BamzySMS\Core\Database;
use PDO;

class Verification {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    public function create($email, $otp, $type = 'signup') {
        $expiresAt = date('Y-m-d H:i:s', strtotime('+15 minutes'));
        
        // Clear previous OTPs for this email/type to keep it clean
        $stmt = $this->db->prepare("DELETE FROM verifications WHERE email = ? AND type = ?");
        $stmt->execute([$email, $type]);

        $stmt = $this->db->prepare("INSERT INTO verifications (email, otp, type, expires_at) VALUES (?, ?, ?, ?)");
        return $stmt->execute([$email, $otp, $type, $expiresAt]);
    }

    public function verify($email, $otp, $type = 'signup', $deleteAfter = true) {
        $stmt = $this->db->prepare("SELECT * FROM verifications WHERE email = ? AND otp = ? AND type = ? AND expires_at > NOW()");
        $stmt->execute([$email, $otp, $type]);
        $verification = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($verification) {
            if ($deleteAfter) {
                $this->db->prepare("DELETE FROM verifications WHERE id = ?")->execute([$verification['id']]);
            }
            return true;
        }

        return false;
    }
}
