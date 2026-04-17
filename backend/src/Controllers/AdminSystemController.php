<?php

namespace BamzySMS\Controllers;

use BamzySMS\Middleware\AuthMiddleware;

class AdminSystemController extends AdminBaseController {

    /**
     * GET /api/admin/settings
     */
    public function getSettings() {
        $userId = AuthMiddleware::handle();
        $this->checkAdmin($userId);
        
        $settings = $this->settingModel->getAll();
        return $this->json(['status' => 'success', 'data' => $settings]);
    }

    /**
     * POST /api/admin/settings
     */
    public function updateSettings() {
        $userId = AuthMiddleware::handle();
        $this->checkAdmin($userId);
        
        $data = $this->getPostData();
        if (!is_array($data)) {
            return $this->json(['status' => 'error', 'message' => 'Invalid data.'], 400);
        }

        foreach ($data as $key => $value) {
            $this->settingModel->set((string)$key, (string)$value);
        }

        return $this->json(['status' => 'success', 'message' => 'Settings updated successfully.']);
    }

    /**
     * GET /api/admin/logs
     */
    public function getSystemLogs() {
        $userId = AuthMiddleware::handle();
        $this->checkAdmin($userId);

        $stmt = $this->db->prepare("
            SELECT l.*, u.name as user_name, u.username as user_username
            FROM system_logs l
            LEFT JOIN users u ON l.user_id = u.id
            ORDER BY l.id DESC LIMIT 200
        ");
        $stmt->execute();
        
        return $this->json([
            'status' => 'success',
            'data' => $stmt->fetchAll(\PDO::FETCH_ASSOC)
        ]);
    }

    /**
     * GET /api/admin/analytics
     */
    public function getAnalytics() {
        $userId = AuthMiddleware::handle();
        $this->checkAdmin($userId);

        // 1. Total Stats
        $stmt = $this->db->query("
            SELECT 
                COUNT(*) as total_orders,
                SUM(CASE WHEN status = 'received' THEN activation_cost ELSE 0 END) as total_revenue,
                SUM(CASE WHEN status = 'received' THEN 1 ELSE 0 END) as successful_orders
            FROM sms_purchases
        ");
        $totals = $stmt->fetch(\PDO::FETCH_ASSOC);

        // 2. Last 7 days revenue
        $stmt = $this->db->query("
            SELECT 
                DATE(created_at) as date,
                SUM(activation_cost) as daily_revenue
            FROM sms_purchases
            WHERE status = 'received' AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            GROUP BY DATE(created_at)
            ORDER BY DATE(created_at) ASC
        ");
        $daily = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        // 3. User growth
        $stmt = $this->db->query("SELECT COUNT(*) FROM users WHERE role = 'user'");
        $userCount = $stmt->fetchColumn();

        return $this->json([
            'status' => 'success',
            'data' => [
                'totals' => [
                    'revenue' => (float)($totals['total_revenue'] ?? 0),
                    'orders' => (int)$totals['total_orders'],
                    'success_rate' => $totals['total_orders'] > 0 ? round(($totals['successful_orders'] / $totals['total_orders']) * 100, 1) : 100,
                    'users' => (int)$userCount
                ],
                'daily' => $daily
            ]
        ]);
    }

    /**
     * GET /api/admin/provider-balance
     */
    public function getProviderBalance() {
        $userId = AuthMiddleware::handle();
        $this->checkAdmin($userId);

        try {
            $balance = $this->smsClient->getBalance();
            return $this->json(['status' => 'success', 'balance' => $balance]);
        } catch (\Exception $e) {
            return $this->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * GET /api/admin/provider/status
     */
    public function getProviderStatus() {
        $userId = AuthMiddleware::handle();
        $this->checkAdmin($userId);
        
        try {
            $balance = $this->smsClient->getBalance();
            return $this->json([
                'status' => 'success',
                'provider' => 'online',
                'latency' => 'good'
            ]);
        } catch (\Throwable $e) {
            $isTimeout = str_contains($e->getMessage(), 'slow to respond') || str_contains($e->getMessage(), 'timeout');
            return $this->json([
                'status' => 'success',
                'provider' => 'offline',
                'error' => $e->getMessage(),
                'type' => $isTimeout ? 'timeout' : 'error'
            ]);
        }
    }

    /**
     * GET /api/admin/run-migrations
     * Bypass Auth: /api/admin/run-migrations?key=BAMZY-INITIAL-2026
     */
    public function runMigrations() {
        $key = $_GET['key'] ?? '';
        if ($key !== 'BAMZY-INITIAL-2026') {
            $userId = AuthMiddleware::handle();
            $this->checkAdmin($userId);
        }

        try {
            $migrator = new \BamzySMS\Core\Migrator($this->db);
            $results = $migrator->migrate();
            
            return $this->json([
                'status' => 'success',
                'message' => empty($results) ? 'Database already up to date.' : 'Migrations applied successfully.',
                'results' => $results
            ]);
        } catch (\Throwable $e) {
            return $this->json([
                'status' => 'error',
                'message' => 'Migration failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * SETUP: /api/admin/setup-master?key=BAMZY-INITIAL-2026
     */
    public function setupMasterAdmin() {
        $key = $_GET['key'] ?? '';
        if ($key !== 'BAMZY-INITIAL-2026') {
            return $this->json(['status' => 'error', 'message' => 'Invalid setup key.'], 403);
        }

        $stmt = $this->db->query("SELECT COUNT(*) FROM users WHERE role = 'admin'");
        if ((int)$stmt->fetchColumn() > 0) {
            return $this->json(['status' => 'error', 'message' => 'Admin account already exists.'], 400);
        }

        $adminUsername = 'admin';
        $adminPass  = 'Admin@' . mt_rand(1000, 9999) . '!';
        $hashedPass = password_hash($adminPass, PASSWORD_DEFAULT);

        try {
            $stmt = $this->db->prepare("
                INSERT INTO users (username, name, phone, password, role)
                VALUES (?, ?, ?, ?, ?)
            ");
            $stmt->execute([$adminUsername, 'Bamzy Admin', '0000000000', $hashedPass, 'admin']);

            return $this->json([
                'status' => 'success', 
                'message' => 'Master admin created.',
                'credentials' => [
                    'username' => $adminUsername,
                    'password' => $adminPass,
                    'note'     => 'Please log in and change your password immediately.'
                ]
            ]);
        } catch (\Throwable $e) {
            return $this->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }
}
