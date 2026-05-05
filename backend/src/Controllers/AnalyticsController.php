<?php

require_once __DIR__ . '/../Support/Auth.php';

class AnalyticsController {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    public function getSummary() {
        $user = $this->getCurrentUser();
        if (!$user || ($user['role'] ?? 'user') !== 'admin') {
            header("HTTP/1.1 401 Unauthorized");
            return json_encode(['message' => 'Admin access required']);
        }

        $orders = $this->db->query("SELECT * FROM orders")->fetchAll(PDO::FETCH_ASSOC);
        $today = date('Y-m-d');
        $weekAgo = date('Y-m-d', strtotime('-7 days'));
        $monthAgo = date('Y-m-d', strtotime('-30 days'));

        $ordersToday = 0;
        $revenueToday = 0.0;
        $ordersWeek = 0;
        $revenueWeek = 0.0;
        $ordersMonth = 0;
        $revenueMonth = 0.0;
        $statusBreakdown = [];
        $topProducts = [];

        foreach ($orders as $order) {
            $createdAt = (string) ($order['created_at'] ?? '');
            $createdDay = $createdAt !== '' ? date('Y-m-d', strtotime($createdAt)) : null;
            $total = (float) ($order['total_amount'] ?? $order['total'] ?? 0);
            $status = (string) ($order['status'] ?? 'pending');

            $statusBreakdown[$status] = ($statusBreakdown[$status] ?? 0) + 1;

            if ($createdDay === $today) {
                $ordersToday++;
                $revenueToday += $total;
            }
            if ($createdDay !== null && $createdDay >= $weekAgo) {
                $ordersWeek++;
                $revenueWeek += $total;
            }
            if ($createdDay !== null && $createdDay >= $monthAgo) {
                $ordersMonth++;
                $revenueMonth += $total;
            }

            $items = json_decode((string) ($order['items'] ?? '[]'), true);
            if (!is_array($items)) {
                continue;
            }

            foreach ($items as $item) {
                $name = (string) ($item['name'] ?? 'Item');
                $quantity = (int) ($item['quantity'] ?? 1);
                $topProducts[$name] = ($topProducts[$name] ?? 0) + max(1, $quantity);
            }
        }

        arsort($topProducts);
        $topProductsList = [];
        foreach (array_slice($topProducts, 0, 5, true) as $name => $count) {
            $topProductsList[] = ['name' => $name, 'count' => $count];
        }

        $statusList = [];
        foreach ($statusBreakdown as $status => $count) {
            $statusList[] = ['status' => $status, 'count' => $count];
        }

        return json_encode([
            'status' => 'success',
            'data' => [
                'orders_today' => $ordersToday,
                'revenue_today' => $revenueToday,
                'orders_week' => $ordersWeek,
                'revenue_week' => $revenueWeek,
                'orders_month' => $ordersMonth,
                'revenue_month' => $revenueMonth,
                'top_products' => $topProductsList,
                'status_breakdown' => $statusList,
                'abandonment_rate' => 0,
            ],
        ]);
    }

    public function getSessions() {
        $user = $this->getCurrentUser();
        if (!$user || ($user['role'] ?? 'user') !== 'admin') {
            header("HTTP/1.1 401 Unauthorized");
            return json_encode(['message' => 'Admin access required']);
        }

        $sessions = $this->db->query("SELECT * FROM sessions ORDER BY last_visit DESC")->fetchAll(PDO::FETCH_ASSOC);

        return json_encode([
            'status' => 'success',
            'data' => $sessions,
        ]);
    }

    private function getCurrentUser() {
        $token = getBearerToken();
        $payload = $token ? verifyJwt($token) : false;
        return $payload ?: null;
    }
}
