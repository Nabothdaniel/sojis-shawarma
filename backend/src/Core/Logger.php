<?php

namespace BamzySMS\Core;

class Logger {
    /**
     * Log a system event to the database.
     * 
     * @param string $action  High-level action (e.g., 'NETWORK_TIMEOUT', 'PURCHASE_FAILURE')
     * @param mixed  $details Array or string of details
     * @param int|null $userId Optional user ID associated with the event
     */
    public static function log(string $action, $details, ?int $userId = null) {
        try {
            $db = Database::getInstance()->getConnection();
            $stmt = $db->prepare("
                INSERT INTO system_logs (user_id, action, details, created_at)
                VALUES (?, ?, ?, CURRENT_TIMESTAMP)
            ");
            
            $detailsEncoded = is_array($details) || is_object($details) 
                ? json_encode($details) 
                : (string)$details;

            $stmt->execute([$userId, $action, $detailsEncoded]);
        } catch (\Throwable $e) {
            // Fallback to error_log if database logging fails
            error_log("Logging failed: " . $e->getMessage());
        }
    }

    public static function info(string $action, $details, ?int $userId = null) {
        self::log("INFO_$action", $details, $userId);
    }

    public static function warn(string $action, $details, ?int $userId = null) {
        self::log("WARN_$action", $details, $userId);
    }

    public static function error(string $action, $details, ?int $userId = null) {
        self::log("ERROR_$action", $details, $userId);
    }
}
