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
            service_code VARCHAR(50) NOT NULL UNIQUE,
            multiplier DECIMAL(10, 2) DEFAULT NULL,
            fixed_price DECIMAL(15, 2) DEFAULT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
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
        if (!$user || $user['role'] !== 'admin') {
            http_response_code(403);
            echo json_encode(['status' => 'error', 'message' => 'Unauthorized. Admin access required.']);
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
        
        $stmt = $this->db->prepare("SELECT * FROM service_overrides");
        $stmt->execute();
        return $this->json([
            'status' => 'success',
            'data' => $stmt->fetchAll(\PDO::FETCH_ASSOC)
        ]);
    }

    /**
     * POST /api/admin/pricing/update
     */
    public function updatePricingOverride() {
        $userId = AuthMiddleware::handle();
        $this->checkAdmin($userId);
        
        $data = $this->getPostData();
        $serviceCode = trim($data['serviceCode'] ?? '');
        $multiplier  = isset($data['multiplier']) ? (float)$data['multiplier'] : null;
        $fixedPrice  = isset($data['fixedPrice']) ? (float)$data['fixedPrice'] : null;

        if (!$serviceCode) {
            return $this->json(['status' => 'error', 'message' => 'serviceCode is required.'], 400);
        }

        try {
            $stmt = $this->db->prepare("
                INSERT INTO service_overrides (service_code, multiplier, fixed_price)
                VALUES (:code, :mult, :fixed)
                ON DUPLICATE KEY UPDATE multiplier = :mult2, fixed_price = :fixed2
            ");
            $stmt->execute([
                'code'   => $serviceCode,
                'mult'   => $multiplier,
                'fixed'  => $fixedPrice,
                'mult2'  => $multiplier,
                'fixed2' => $fixedPrice
            ]);

            return $this->json(['status' => 'success', 'message' => "Override updated for $serviceCode"]);
        } catch (\Throwable $e) {
            return $this->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * DELETE /api/admin/pricing/delete
     */
    public function deletePricingOverride() {
        $userId = AuthMiddleware::handle();
        $this->checkAdmin($userId);
        
        $serviceCode = $_GET['serviceCode'] ?? '';
        if (!$serviceCode) {
            return $this->json(['status' => 'error', 'message' => 'serviceCode is required.'], 400);
        }

        $stmt = $this->db->prepare("DELETE FROM service_overrides WHERE service_code = ?");
        $stmt->execute([$serviceCode]);

        return $this->json(['status' => 'success', 'message' => "Override deleted for $serviceCode"]);
    }

    /**
     * GET /api/admin/logs
     */
    public function getSystemLogs() {
        $userId = AuthMiddleware::handle();
        $this->checkAdmin($userId);

        $stmt = $this->db->prepare("
            SELECT l.*, u.name as user_name, u.email as user_email 
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

        $adminEmail = 'admin@bamzysms.com';
        $adminPass  = 'Admin@' . mt_rand(1000, 9999) . '!';
        $hashedPass = password_hash($adminPass, PASSWORD_DEFAULT);

        try {
            $stmt = $this->db->prepare("
                INSERT INTO users (name, email, phone, password, role)
                VALUES (?, ?, ?, ?, ?)
            ");
            $stmt->execute(['Bamzy Admin', $adminEmail, '0000000000', $hashedPass, 'admin']);

            return $this->json([
                'status' => 'success', 
                'message' => 'Master admin created.',
                'credentials' => [
                    'email'    => $adminEmail,
                    'password' => $adminPass,
                    'note'     => 'Please log in and change your password immediately.'
                ]
            ]);
        } catch (\Throwable $e) {
            return $this->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }
}
