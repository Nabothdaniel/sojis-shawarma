<?php

require_once __DIR__ . '/../Support/Auth.php';

class AdminAccessController {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    public function getPublicConfig() {
        $key = trim((string) ($_GET['access'] ?? ''));
        $settings = $this->getSettingsRow(true);
        $basePath = '/admin/login';

        if (!$settings || !(bool) ($settings['is_enabled'] ?? false)) {
            return json_encode([
                'status' => 'success',
                'data' => [
                    'is_enabled' => false,
                    'is_valid' => true,
                    'login_path' => $basePath,
                    'expires_at' => null,
                ],
            ]);
        }

        $isValid = $key !== '' && hash_equals((string) $settings['access_key'], $key);

        return json_encode([
            'status' => 'success',
            'data' => [
                'is_enabled' => true,
                'is_valid' => $isValid,
                'login_path' => $basePath . '?access=' . urlencode((string) $settings['access_key']),
                'expires_at' => $settings['expires_at'] ?? null,
            ],
        ]);
    }

    public function getAdminConfig() {
        $this->requireAdmin();
        $settings = $this->getSettingsRow(true);

        return json_encode([
            'status' => 'success',
            'data' => $this->formatSettings($settings),
        ]);
    }

    public function updateAdminConfig() {
        $this->requireAdmin();

        $data = json_decode(file_get_contents('php://input'), true) ?: [];
        $action = (string) ($data['action'] ?? 'save');
        $enabled = (bool) ($data['is_enabled'] ?? true);
        $customKey = strtoupper(trim((string) ($data['access_key'] ?? '')));

        $settings = $this->getSettingsRow(false);
        $id = (int) ($settings['id'] ?? 0);
        if ($id <= 0) {
            header("HTTP/1.1 500 Internal Server Error");
            return json_encode(['message' => 'Admin access settings were not initialized']);
        }

        if (!$enabled) {
            $stmt = $this->db->prepare("UPDATE admin_access_settings SET is_enabled = 0, access_key = NULL, expires_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?");
            $stmt->execute([$id]);
            return json_encode([
                'status' => 'success',
                'message' => 'Admin access link protection disabled',
                'data' => $this->formatSettings($this->getSettingsRow(false)),
            ]);
        }

        if ($action === 'regenerate') {
            $customKey = $this->generateAccessKey();
        }

        if ($customKey === '') {
            $customKey = $this->generateAccessKey();
        }

        if (!$this->isValidAccessKey($customKey)) {
            header("HTTP/1.1 422 Unprocessable Entity");
            return json_encode(['message' => 'Access key must be exactly 10 letters or numbers']);
        }

        $expiresAt = date('Y-m-d H:i:s', time() + (6 * 60 * 60));
        $stmt = $this->db->prepare("UPDATE admin_access_settings SET is_enabled = 1, access_key = ?, expires_at = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?");
        $stmt->execute([$customKey, $expiresAt, $id]);

        return json_encode([
            'status' => 'success',
            'message' => $action === 'regenerate' ? 'Admin access link regenerated' : 'Admin access link saved',
            'data' => $this->formatSettings($this->getSettingsRow(false)),
        ]);
    }

    private function requireAdmin(): void {
        $user = $this->getCurrentUser();
        if (!$user || ($user['role'] ?? 'user') !== 'admin') {
            header("HTTP/1.1 401 Unauthorized");
            echo json_encode(['message' => 'Admin access required']);
            exit;
        }
    }

    private function getCurrentUser() {
        $token = getBearerToken();
        $payload = $token ? verifyJwt($token) : false;
        return $payload ?: null;
    }

    private function getSettingsRow(bool $rotateIfExpired): ?array {
        $stmt = $this->db->query("SELECT * FROM admin_access_settings ORDER BY id ASC LIMIT 1");
        $settings = $stmt ? $stmt->fetch(PDO::FETCH_ASSOC) : false;
        if (!$settings) {
            return null;
        }

        if (
            $rotateIfExpired &&
            (bool) ($settings['is_enabled'] ?? false) &&
            !empty($settings['expires_at']) &&
            strtotime((string) $settings['expires_at']) <= time()
        ) {
            $newKey = $this->generateAccessKey();
            $newExpiry = date('Y-m-d H:i:s', time() + (6 * 60 * 60));
            $update = $this->db->prepare("UPDATE admin_access_settings SET access_key = ?, expires_at = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?");
            $update->execute([$newKey, $newExpiry, $settings['id']]);
            $settings['access_key'] = $newKey;
            $settings['expires_at'] = $newExpiry;
        }

        return $settings;
    }

    private function formatSettings(?array $settings): array {
        $isEnabled = (bool) ($settings['is_enabled'] ?? false);
        $key = (string) ($settings['access_key'] ?? '');
        $path = $isEnabled && $key !== ''
            ? '/admin/login?access=' . urlencode($key)
            : '/admin/login';

        return [
            'is_enabled' => $isEnabled,
            'access_key' => $key !== '' ? $key : null,
            'login_path' => $path,
            'expires_at' => $settings['expires_at'] ?? null,
            'refresh_hours' => 6,
        ];
    }

    private function generateAccessKey(): string {
        $alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        $key = '';
        $max = strlen($alphabet) - 1;
        for ($i = 0; $i < 10; $i++) {
            $key .= $alphabet[random_int(0, $max)];
        }
        return $key;
    }

    private function isValidAccessKey(string $key): bool {
        return (bool) preg_match('/^[A-Z0-9]{10}$/', $key);
    }
}
