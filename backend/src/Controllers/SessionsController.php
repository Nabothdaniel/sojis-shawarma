<?php

class SessionsController {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    public function create() {
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data || !isset($data['session_id'])) return json_encode(['error' => 'Missing session ID']);

        try {
            $stmt = $this->db->prepare("INSERT IGNORE INTO sessions (id, device_type, os, browser, city, state, lat, lng, address, pages_viewed, items_viewed) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $data['session_id'],
                $data['device_type'],
                $data['os'],
                $data['browser'],
                $data['city'] ?? '',
                $data['state'] ?? '',
                $data['lat'] ?? 0,
                $data['lng'] ?? 0,
                $data['address'] ?? '',
                json_encode($data['pages_viewed'] ?? []),
                json_encode($data['items_viewed'] ?? [])
            ]);
            return json_encode(['session_id' => $data['session_id']]);
        } catch (PDOException $e) {
            return json_encode(['error' => $e->getMessage()]);
        }
    }

    public function update($id) {
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data) return json_encode(['error' => 'Invalid data']);

        try {
            $updates = [];
            $params = [];

            if (isset($data['page_view'])) {
                $updates[] = "pages_viewed = JSON_ARRAY_APPEND(pages_viewed, '$', ?)";
                $params[] = $data['page_view'];
            }
            if (isset($data['item_view'])) {
                $updates[] = "items_viewed = JSON_ARRAY_APPEND(items_viewed, '$', ?)";
                $params[] = $data['item_view'];
            }
            if (isset($data['orders_placed'])) {
                $updates[] = "orders_placed = orders_placed + 1";
            }
            if (isset($data['cart_abandoned'])) {
                $updates[] = "cart_abandoned = ?";
                $params[] = $data['cart_abandoned'];
            }

            if (empty($updates)) return json_encode(['status' => 'no changes']);

            $sql = "UPDATE sessions SET " . implode(", ", $updates) . " WHERE id = ?";
            $params[] = $id;

            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
            
            return json_encode(['status' => 'success']);
        } catch (PDOException $e) {
            return json_encode(['error' => $e->getMessage()]);
        }
    }
}
