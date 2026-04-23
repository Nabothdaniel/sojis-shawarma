<?php

class AnalyticsController {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    public function getSummary() {
        $data = [];
        
        // Orders & Revenue
        $ranges = ['TODAY' => 'CURDATE()', 'WEEK' => 'DATE_SUB(CURDATE(), INTERVAL 7 DAY)', 'MONTH' => 'DATE_SUB(CURDATE(), INTERVAL 30 DAY)'];
        
        foreach ($ranges as $label => $interval) {
            $sql = "SELECT COUNT(*) as count, SUM(total) as revenue FROM orders WHERE created_at >= $interval";
            $res = $this->db->query($sql)->fetch();
            $data['orders_' . strtolower($label)] = $res['count'];
            $data['revenue_' . strtolower($label)] = $res['revenue'] ?? 0;
        }

        // Top Products
        $data['top_products'] = $this->db->query("
            SELECT name, COUNT(*) as count 
            FROM orders, JSON_TABLE(items, '$[*]' COLUMNS(name VARCHAR(255) PATH '$.name')) as jt 
            GROUP BY name ORDER BY count DESC LIMIT 5
        ")->fetchAll();

        // Order Status Breakdown
        $data['status_breakdown'] = $this->db->query("SELECT status, COUNT(*) as count FROM orders GROUP BY status")->fetchAll();

        // Abandonment Rate
        $sessions = $this->db->query("SELECT COUNT(*) as total, SUM(cart_abandoned) as abandoned FROM sessions")->fetch();
        $data['abandonment_rate'] = $sessions['total'] > 0 ? ($sessions['abandoned'] / $sessions['total']) * 100 : 0;

        return json_encode($data);
    }

    public function getSessions() {
        $data = [];
        $data['total'] = $this->db->query("SELECT COUNT(*) FROM sessions")->fetchColumn();
        $data['devices'] = $this->db->query("SELECT device_type, COUNT(*) as count FROM sessions GROUP BY device_type")->fetchAll();
        $data['recent'] = $this->db->query("SELECT * FROM sessions ORDER BY last_visit DESC LIMIT 50")->fetchAll();
        
        return json_encode($data);
    }
}
