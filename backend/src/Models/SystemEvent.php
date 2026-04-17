<?php
namespace BamzySMS\Models;

use BamzySMS\Core\Database;
use PDO;

class SystemEvent {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    /**
     * Log a new system event for real-time delivery.
     */
    public function log($userId, $type, $payload = []) {
        $sql = "INSERT INTO system_events (user_id, event_type, payload) VALUES (?, ?, ?)";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([
            $userId,
            $type,
            json_encode($payload)
        ]);
    }

    /**
     * Get undelivered events for a user and mark them as delivered.
     */
    public function getPending($userId) {
        $sql = "SELECT * FROM system_events WHERE user_id = ? AND is_delivered = 0 ORDER BY created_at ASC";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$userId]);
        $events = $stmt->fetchAll(PDO::FETCH_ASSOC);

        if (!empty($events)) {
            $ids = array_column($events, 'id');
            $placeholders = implode(',', array_fill(0, count($ids), '?'));
            $sqlMark = "UPDATE system_events SET is_delivered = 1 WHERE id IN ($placeholders)";
            $stmtMark = $this->db->prepare($sqlMark);
            $stmtMark->execute($ids);
        }

        return $events;
    }

    /**
     * Get unread count for a user.
     */
    public function getUnreadCount($userId) {
        $sql = "SELECT COUNT(*) FROM system_events WHERE user_id = ? AND is_read = 0";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$userId]);
        return (int) $stmt->fetchColumn();
    }

    /**
     * Get recent notifications for the dropdown.
     */
    public function getRecent($userId, $limit = 20) {
        $sql = "SELECT * FROM system_events WHERE user_id = ? ORDER BY created_at DESC LIMIT " . (int)$limit;
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$userId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Mark notifications as read.
     */
    public function markAsRead($userId, $eventId = null) {
        if ($eventId) {
            $sql = "UPDATE system_events SET is_read = 1 WHERE user_id = ? AND id = ?";
            $stmt = $this->db->prepare($sql);
            return $stmt->execute([$userId, $eventId]);
        } else {
            $sql = "UPDATE system_events SET is_read = 1 WHERE user_id = ? AND is_read = 0";
            $stmt = $this->db->prepare($sql);
            return $stmt->execute([$userId]);
        }
    }
}
