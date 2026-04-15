<?php

namespace BamzySMS\Controllers;

use BamzySMS\Core\Controller;
use BamzySMS\Middleware\AuthMiddleware;
use BamzySMS\Models\User;
use BamzySMS\Models\Setting;
use BamzySMS\Models\Transaction;
use BamzySMS\Services\SmsBowerClient;
use BamzySMS\Core\Database;

class AdminController extends Controller {
    private $userModel;
    private $settingModel;
    private $transactionModel;
    private $smsClient;
    private $db;

    public function __construct() {
        $this->userModel        = new User();
        $this->settingModel     = new Setting();
        $this->transactionModel = new Transaction();
        $this->smsClient        = new SmsBowerClient();
        $this->db               = Database::getInstance()->getConnection();
        $this->ensureTables();
    }

    private function ensureTables() {
        $sql = "CREATE TABLE IF NOT EXISTS service_overrides (
            id INT AUTO_INCREMENT PRIMARY KEY,
            service_code VARCHAR(50) NOT NULL,
            country_id INT DEFAULT 0,
            multiplier DECIMAL(10, 2) DEFAULT NULL,
            fixed_price DECIMAL(15, 2) DEFAULT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY service_country (service_code, country_id)
        )";
        $this->db->exec($sql);

        $sqlLogs = "CREATE TABLE IF NOT EXISTS system_logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NULL,
            action VARCHAR(100) NOT NULL,
            details TEXT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
        )";
        $this->db->exec($sqlLogs);
    }

    /**
     * Check if the authenticated user is an admin.
     */
    private function checkAdmin($userId) {
        $user = $this->userModel->findById($userId);
        if (!$user) {
            http_response_code(401);
            echo json_encode(['status' => 'error', 'message' => 'Unauthorized. Session invalid.']);
            exit;
        }
        if ($user['role'] !== 'admin') {
            http_response_code(403);
            echo json_encode(['status' => 'error', 'message' => "Forbidden. Admin role required. Current role: " . ($user['role'] ?? 'unknown')]);
            exit;
        }
        return $user;
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
     * GET /api/admin/users
     */
    public function getAllUsers() {
        $userId = AuthMiddleware::handle();
        $this->checkAdmin($userId);
        
        $users = $this->userModel->getAllUsers();
        return $this->json(['status' => 'success', 'data' => $users]);
    }

    /**
     * POST /api/admin/user/balance
     */
    public function updateUserBalance() {
        $userId = AuthMiddleware::handle();
        $this->checkAdmin($userId);
        
        $data = $this->getPostData();
        $targetUserId = (int)($data['userId'] ?? 0);
        $newBalance   = (float)($data['balance'] ?? 0);

        if (!$targetUserId) {
            return $this->json(['status' => 'error', 'message' => 'User ID required.'], 400);
        }

        $targetUser = $this->userModel->findById($targetUserId);
        if (!$targetUser) {
            return $this->json(['status' => 'error', 'message' => 'User not found.'], 404);
        }

        $oldBalance = (float)$targetUser['balance'];
        if ($this->userModel->updateBalance($targetUserId, $newBalance)) {
            // Log transaction
            $diff = $newBalance - $oldBalance;
            $desc = "Admin Adjustment: Set from ₦$oldBalance to ₦$newBalance";
            $this->transactionModel->create($targetUserId, abs($diff), $diff >= 0 ? 'credit' : 'debit', $desc);

            return $this->json(['status' => 'success', 'message' => 'Balance updated.']);
        }

        return $this->json(['status' => 'error', 'message' => 'Failed to update balance.'], 500);
    }

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

    // ─── PRICING OVERRIDES ────────────────────────────────────────────────────

    /**
     * GET /api/admin/pricing/overrides
     */
    public function getPricingOverrides() {
        $userId = AuthMiddleware::handle();
        $this->checkAdmin($userId);
        
        try {
            $stmt = $this->db->prepare("SELECT * FROM service_overrides");
            $stmt->execute();
            return $this->json([
                'status' => 'success',
                'data' => $stmt->fetchAll(\PDO::FETCH_ASSOC)
            ]);
        } catch (\PDOException $e) {
            // If table doesn't exist, create it and return empty
            if ($e->getCode() == '42S02') {
                $this->db->exec("CREATE TABLE IF NOT EXISTS service_overrides (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    service_code VARCHAR(50) NOT NULL UNIQUE,
                    multiplier DECIMAL(10, 2) DEFAULT NULL,
                    fixed_price DECIMAL(15, 2) DEFAULT NULL,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                )");
                return $this->json(['status' => 'success', 'data' => []]);
            }
            throw $e;
        }
    }

    /**
     * POST /api/admin/pricing/update
     */
    public function updatePricingOverride() {
        $userId = AuthMiddleware::handle();
        $this->checkAdmin($userId);
        
        $data = $this->getPostData();
        $serviceCode = trim($data['serviceCode'] ?? '');
        $countryId   = (int)($data['countryId'] ?? 0);
        $multiplier  = isset($data['multiplier']) ? (float)$data['multiplier'] : null;
        $fixedPrice  = isset($data['fixedPrice']) ? (float)$data['fixedPrice'] : null;

        if (!$serviceCode) {
            return $this->json(['status' => 'error', 'message' => 'serviceCode is required.'], 400);
        }

        try {
            $stmt = $this->db->prepare("
                INSERT INTO service_overrides (service_code, country_id, multiplier, fixed_price)
                VALUES (:code, :country, :mult, :fixed)
                ON DUPLICATE KEY UPDATE multiplier = :mult2, fixed_price = :fixed2
            ");
            $stmt->execute([
                'code'    => $serviceCode,
                'country' => $countryId,
                'mult'    => $multiplier,
                'fixed'   => $fixedPrice,
                'mult2'   => $multiplier,
                'fixed2'  => $fixedPrice
            ]);

            return $this->json(['status' => 'success', 'message' => "Override updated for $serviceCode (Country: $countryId)"]);
        } catch (\Throwable $e) {
            return $this->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * DELETE /api/admin/pricing/delete
     */
    public function bulkUpdatePricingOverrides() {
        $userId = AuthMiddleware::handle();
        $this->checkAdmin($userId);

        $json = file_get_contents('php://input');
        $data = json_decode($json, true);

        if (!isset($data['overrides']) || !is_array($data['overrides'])) {
            return $this->json(['status' => 'error', 'message' => 'Overrides array required.'], 400);
        }

        $countryId = isset($data['countryId']) ? (int)$data['countryId'] : 0;
        
        try {
            $this->db->beginTransaction();
            $stmt = $this->db->prepare("
                INSERT INTO service_overrides (service_code, country_id, fixed_price)
                VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE fixed_price = ?
            ");

            foreach ($data['overrides'] as $ov) {
                $code = $ov['serviceCode'];
                $price = $ov['fixedPrice'];
                $stmt->execute([$code, $countryId, $price, $price]);
            }

            $this->db->commit();
            return $this->json(['status' => 'success', 'message' => count($data['overrides']) . ' overrides persisted successfully.']);
        } catch (\Exception $e) {
            $this->db->rollBack();
            return $this->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }

    public function deletePricingOverride() {
        $userId = AuthMiddleware::handle();
        $this->checkAdmin($userId);
        
        $serviceCode = $_GET['serviceCode'] ?? '';
        $countryId   = (int)($_GET['countryId'] ?? 0);

        if (!$serviceCode) {
            return $this->json(['status' => 'error', 'message' => 'serviceCode is required.'], 400);
        }

        $stmt = $this->db->prepare("DELETE FROM service_overrides WHERE service_code = ? AND country_id = ?");
        $stmt->execute([$serviceCode, $countryId]);

        return $this->json(['status' => 'success', 'message' => "Override deleted for $serviceCode (Country: $countryId)"]);
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
     * GET /api/admin/pricing/services
     * Returns paginated list of services with their overrides.
     */
    public function getPaginatedServices() {
        $userId = AuthMiddleware::handle();
        $this->checkAdmin($userId);

        $page      = isset($_GET['page']) ? (int)$_GET['page'] : 1;
        $limit     = isset($_GET['limit']) ? (int)$_GET['limit'] : 20;
        $search    = isset($_GET['search']) ? trim($_GET['search']) : '';
        $countryId = isset($_GET['countryId']) ? (int)$_GET['countryId'] : 0;
        $offset    = ($page - 1) * $limit;

        // 1. Get all services (with fallback)
        try {
            $services = $this->smsClient->getServicesList();
        } catch (\Exception $e) {
            $fallback = require __DIR__ . '/../../config/fallback_data.php';
            $services = $fallback['services'] ?? [];
        }

        try {
            // 2. Get overrides for this specific country AND global overrides
            $stmt = $this->db->prepare("SELECT * FROM service_overrides WHERE country_id = ? OR country_id = 0");
            $stmt->execute([$countryId]);
            $overrides = $stmt->fetchAll(\PDO::FETCH_ASSOC);
            
            $overrideMap = [];
            foreach ($overrides as $o) {
                $code = $o['service_code'];
                if (!isset($overrideMap[$code]) || $o['country_id'] != 0) {
                    $overrideMap[$code] = $o;
                }
            }

            // 3. Filter
            if ($search !== '') {
                $services = array_filter($services, function($s) use ($search) {
                    return stripos($s['name'], $search) !== false || stripos($s['code'], $search) !== false;
                });
            }

            $totalCount = count($services);

            // 4. Sort
            usort($services, fn($a, $b) => strcmp($a['name'], $b['name']));

            // 5. Paginate
            $paginated = array_slice($services, $offset, $limit);

            // 6. Enrichment
            $settings = (new \BamzySMS\Models\Setting())->getAll();
            $rate     = (float)($settings['usd_to_ngn_rate'] ?? 1600);
            
            $realPrices = [];
            if ($countryId > 0) {
                try { $realPrices = $this->smsClient->getPricesV2(null, $countryId); } catch (\Exception $e) {}
            }

            foreach ($paginated as &$s) {
                $s['override'] = $overrideMap[$s['code']] ?? null;
                $costUsd = 0.2;
                if (isset($realPrices[$s['code']])) {
                    $prices = array_keys($realPrices[$s['code']]);
                    if (!empty($prices)) $costUsd = (float) min($prices);
                }
                $s['base_cost_ngn'] = round($costUsd * $rate, 2); 
                $s['inventory']     = isset($realPrices[$s['code']]) ? array_sum($realPrices[$s['code']]) : 0;
            }

            return $this->json([
                'status' => 'success',
                'data' => $paginated,
                'pagination' => [
                    'total' => $totalCount,
                    'page' => $page,
                    'limit' => $limit,
                    'pages' => ceil($totalCount / $limit)
                ]
            ]);
        } catch (\PDOException $e) {
            // Likely a missing column (country_id)
            if (str_contains($e->getMessage(), 'Unknown column \'country_id\'')) {
                return $this->json(['status' => 'error', 'message' => 'Database out of sync. Please run migrations.', 'error_code' => 'MIGRATION_REQUIRED'], 500);
            }
            throw $e;
        }
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

        // 3. User growth (optional but nice)
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
     * SETUP: /api/admin/setup-master?key=BAMZY-INITIAL-2026
     * This is a one-time setup route.
     */
    public function setupMasterAdmin() {
        $key = $_GET['key'] ?? '';
        if ($key !== 'BAMZY-INITIAL-2026') {
            return $this->json(['status' => 'error', 'message' => 'Invalid setup key.'], 403);
        }

        // Check if any admin already exists
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

    /**
     * GET /api/admin/promote-me
     * Temporary route to promote current user to admin.
     */
    /**
     * GET /api/admin/provider/status
     * Performs a fast heartbeat check to see if SMSBower is reachable.
     */
    public function getProviderStatus() {
        $userId = AuthMiddleware::handle();
        $this->checkAdmin($userId);
        
        try {
            // Use a specific heartbeat check or just getBalance
            $balance = $this->smsClient->getBalance();
            return $this->json([
                'status' => 'success',
                'provider' => 'online',
                'latency' => 'good'
            ]);
        } catch (\Throwable $e) {
            $isTimeout = str_contains($e->getMessage(), 'slow to respond') || str_contains($e->getMessage(), 'timeout');
            return $this->json([
                'status' => 'success', // Request succeeded, but provider is down
                'provider' => 'offline',
                'error' => $e->getMessage(),
                'type' => $isTimeout ? 'timeout' : 'error'
            ]);
        }
    }

    public function promoteToAdmin() {
        $userId = AuthMiddleware::handle();
        if (!$userId) return $this->json(['status' => 'error', 'message' => 'Not logged in'], 401);

        $stmt = $this->db->prepare("UPDATE users SET role = 'admin' WHERE id = ?");
        $stmt->execute([$userId]);

        return $this->json(['status' => 'success', 'message' => 'Account promoted to Admin. Please refresh the page.']);
    }

    public function getCountries() {
        $userId = AuthMiddleware::handle();
        $this->checkAdmin($userId);
        
        try {
            $countries = $this->smsClient->getCountries();
            return $this->json(['status' => 'success', 'data' => $countries]);
        } catch (\Exception $e) {
            return $this->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }

    public function runMigrations() {
        $userId = AuthMiddleware::handle();
        $this->checkAdmin($userId);

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
}
