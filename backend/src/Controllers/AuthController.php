<?php

require_once __DIR__ . '/../Support/Auth.php';
require_once __DIR__ . '/../Support/Crypto.php';

class AuthController {
    private $db;
    private $secret;

    public function __construct($db) {
        $this->db = $db;
        $this->secret = getenv('JWT_SECRET') ?: 'default_secret';
    }

    public function login() {
        $data = json_decode(file_get_contents('php://input'), true);
        $identifier = trim((string) ($data['identifier'] ?? $data['email'] ?? $data['username'] ?? ''));
        $password = decryptSensitiveInput($data['password'] ?? '');
        $ip = $_SERVER['REMOTE_ADDR'];

        // Rate Limiting (Task 2)
        if ($this->isRateLimited($ip, '/auth/login')) {
            header("HTTP/1.1 429 Too Many Requests");
            return json_encode(['message' => 'Too many attempts. Locked for 15 minutes.']);
        }

        $user = $this->findAdminForLogin($identifier);
        $userType = 'admin';

        if (!$user) {
            $user = $this->findUserForLogin($identifier);
            $userType = 'user';
        }

        if ($user && password_verify($password, $user['password_hash'])) {
            if ($userType === 'user') {
                $this->attachOrdersToUser((int) $user['id'], (string) ($user['phone'] ?? ''));
            }
            $this->resetRateLimit($ip, '/auth/login');
            return json_encode($this->issueAuthPayload($user, $userType));
        } else {
            $this->logAttempt($ip, '/auth/login');
            header("HTTP/1.1 401 Unauthorized");
            return json_encode(['message' => 'Invalid login details or password']);
        }
    }

    public function resetPassword() {
        $data = json_decode(file_get_contents('php://input'), true);
        $accountType = strtolower(trim((string) ($data['account_type'] ?? 'user')));
        $identifier = trim((string) ($data['identifier'] ?? $data['email'] ?? $data['username'] ?? ''));
        $phone = trim((string) ($data['phone'] ?? $data['whatsapp_number'] ?? ''));
        $newPassword = decryptSensitiveInput($data['new_password'] ?? '');

        if ($identifier === '' || $newPassword === '') {
            header("HTTP/1.1 422 Unprocessable Entity");
            return json_encode(['message' => 'Identifier and new password are required']);
        }

        if (strlen($newPassword) < 6) {
            header("HTTP/1.1 422 Unprocessable Entity");
            return json_encode(['message' => 'Password must be at least 6 characters']);
        }

        if ($accountType === 'admin') {
            $admin = $this->findAdminForLogin($identifier);
            if (!$admin) {
                header("HTTP/1.1 404 Not Found");
                return json_encode(['message' => 'Admin account not found']);
            }

            $stmt = $this->db->prepare("UPDATE admins SET password_hash = ? WHERE id = ?");
            $stmt->execute([password_hash($newPassword, PASSWORD_BCRYPT), $admin['id']]);

            return json_encode([
                'status' => 'success',
                'message' => 'Admin password updated successfully',
            ]);
        }

        if ($phone === '') {
            header("HTTP/1.1 422 Unprocessable Entity");
            return json_encode(['message' => 'WhatsApp or phone number is required for user password reset']);
        }

        $user = $this->findUserForPasswordReset($identifier, $phone);
        if (!$user) {
            header("HTTP/1.1 404 Not Found");
            return json_encode(['message' => 'No user matched that name/email and WhatsApp number']);
        }

        $stmt = $this->db->prepare("UPDATE users SET password_hash = ? WHERE id = ?");
        $stmt->execute([password_hash($newPassword, PASSWORD_BCRYPT), $user['id']]);

        return json_encode([
            'status' => 'success',
            'message' => 'Password updated successfully. You can log in now.',
        ]);
    }

    public function register() {
        $data = json_decode(file_get_contents('php://input'), true);
        $name = trim($data['name'] ?? '');
        $email = strtolower(trim($data['email'] ?? ''));
        $password = decryptSensitiveInput($data['password'] ?? '');
        $phone = trim($data['phone'] ?? '');
        $address = trim($data['address'] ?? '');

        if ($name === '' || $email === '' || $password === '') {
            header("HTTP/1.1 422 Unprocessable Entity");
            return json_encode(['message' => 'Name, email, and password are required']);
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            header("HTTP/1.1 422 Unprocessable Entity");
            return json_encode(['message' => 'Please provide a valid email address']);
        }

        if (strlen($password) < 6) {
            header("HTTP/1.1 422 Unprocessable Entity");
            return json_encode(['message' => 'Password must be at least 6 characters']);
        }

        $stmt = $this->db->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$email]);
        if ($stmt->fetch()) {
            header("HTTP/1.1 409 Conflict");
            return json_encode(['message' => 'An account with this email already exists']);
        }

        $insert = $this->db->prepare("
            INSERT INTO users (name, email, phone, address, password_hash, role)
            VALUES (?, ?, ?, ?, ?, 'user')
        ");
        $insert->execute([
            $name,
            $email,
            $phone ?: null,
            $address ?: null,
            password_hash($password, PASSWORD_BCRYPT),
        ]);

        $userId = (int) $this->db->lastInsertId();
        $stmt = $this->db->prepare("SELECT id, email, name, phone, address, role FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch();

        $this->attachOrdersToUser($userId, $phone);

        header("HTTP/1.1 201 Created");
        return json_encode($this->issueAuthPayload($user, 'user'));
    }

    public function refresh() {
        $token = $_COOKIE['refresh_token'] ?? '';
        $payload = verifyJwt($token);
        
        if ($payload) {
            $newAccessToken = generateJwt([
                'id' => $payload['id'],
                'email' => $payload['email'] ?? '',
                'role' => $payload['role'] ?? 'user',
                'type' => $payload['type'] ?? 'user',
            ], 900);
            return json_encode(['token' => $newAccessToken]);
        }
        
        header("HTTP/1.1 401 Unauthorized");
        return json_encode(['message' => 'Invalid refresh token']);
    }

    public function logout() {
        setcookie('refresh_token', '', [
            'expires' => time() - 3600,
            'path' => '/',
            'httponly' => true,
            'secure' => !in_array($_SERVER['HTTP_HOST'] ?? '', ['localhost', '127.0.0.1', 'localhost:3000', 'localhost:8000'], true),
            'samesite' => 'Lax',
        ]);
        return json_encode(['status' => 'success']);
    }

    public function getBiometricChallenge() {
        $data = json_decode(file_get_contents('php://input'), true);
        $userId = $data['userId'] ?? null;
        
        // In a real app, store this challenge in session/cache associated with user
        $challenge = base64_encode(random_bytes(32));
        return json_encode(['challenge' => $challenge]);
    }

    public function registerBiometric() {
        $token = getBearerToken();
        $payload = verifyJwt($token);
        if (!$payload) {
            header("HTTP/1.1 401 Unauthorized");
            return json_encode(['message' => 'Unauthorized']);
        }

        $data = json_decode(file_get_contents('php://input'), true);
        $credentialId = $data['credentialId'] ?? null;
        $publicKey = $data['publicKey'] ?? null;

        if (!$credentialId || !$publicKey) {
            header("HTTP/1.1 400 Bad Request");
            return json_encode(['message' => 'Missing credential data']);
        }

        $stmt = $this->db->prepare("UPDATE users SET biometric_id = ?, biometric_key = ? WHERE id = ?");
        $stmt->execute([$credentialId, $publicKey, $payload['id']]);

        return json_encode(['status' => 'success', 'message' => 'Biometrics registered successfully']);
    }

    public function getBiometricLoginChallenge() {
        $challenge = base64_encode(random_bytes(32));
        // Find all users who have biometrics enabled on this device (simplified for demo: all who have biometrics)
        $stmt = $this->db->query("SELECT biometric_id FROM users WHERE biometric_id IS NOT NULL");
        $ids = $stmt->fetchAll(PDO::FETCH_COLUMN);

        return json_encode([
            'challenge' => $challenge,
            'allowedIds' => $ids
        ]);
    }

    public function verifyBiometric() {
        $data = json_decode(file_get_contents('php://input'), true);
        $credentialId = $data['credentialId'] ?? null;

        if (!$credentialId) {
            header("HTTP/1.1 400 Bad Request");
            return json_encode(['message' => 'Missing credential id']);
        }

        $stmt = $this->db->prepare("SELECT * FROM users WHERE biometric_id = ? LIMIT 1");
        $stmt->execute([$credentialId]);
        $user = $stmt->fetch();

        if (!$user) {
            header("HTTP/1.1 401 Unauthorized");
            return json_encode(['message' => 'Biometric not recognized']);
        }

        // In a real app, verify b64 signature using biometric_key (public key)
        // For demo purposes, we trust the device after match of credentialId
        return json_encode($this->issueAuthPayload($user, 'user'));
    }
    
    public function removeBiometric() {
        $token = getBearerToken();
        $payload = verifyJwt($token);
        if (!$payload) {
            header("HTTP/1.1 401 Unauthorized");
            return json_encode(['message' => 'Unauthorized']);
        }

        $stmt = $this->db->prepare("UPDATE users SET biometric_id = NULL, biometric_key = NULL WHERE id = ?");
        $stmt->execute([$payload['id']]);

        return json_encode(['status' => 'success', 'message' => 'Biometrics removed successfully']);
    }

    private function issueAuthPayload(array $user, string $userType): array {
        $payload = [
            'id' => (int) $user['id'],
            'email' => $user['email'],
            'role' => $user['role'] ?? $userType,
            'type' => $userType,
        ];

        $accessToken = generateJwt($payload, 900);
        $refreshToken = generateJwt($payload, 604800);

        setcookie('refresh_token', $refreshToken, [
            'expires' => time() + 604800,
            'path' => '/',
            'httponly' => true,
            'secure' => !in_array($_SERVER['HTTP_HOST'] ?? '', ['localhost', '127.0.0.1', 'localhost:3000', 'localhost:8000'], true),
            'samesite' => 'Lax'
        ]);

        $responseUser = [
            'id' => (string) $user['id'],
            'email' => $user['email'],
            'name' => $user['name'],
            'username' => $user['username'] ?? null,
            'role' => $user['role'] ?? $userType,
        ];

        if ($userType === 'user') {
            $responseUser['phone'] = $user['phone'] ?? null;
            $responseUser['address'] = $user['address'] ?? null;
        }

        return [
            'status' => 'success',
            'token' => $accessToken,
            'user' => $responseUser,
        ];
    }

    private function isRateLimited($ip, $endpoint) {
        $window = time() - 900; // 15 mins
        $stmt = $this->db->prepare("SELECT attempts FROM rate_limits WHERE ip = ? AND endpoint = ? AND window_start > ?");
        $stmt->execute([$ip, $endpoint, $window]);
        $row = $stmt->fetch();
        return ($row && $row['attempts'] >= 5);
    }

    private function logAttempt($ip, $endpoint) {
        $window = time();
        $driver = $this->db->getAttribute(PDO::ATTR_DRIVER_NAME);

        if ($driver === 'sqlite') {
            $stmt = $this->db->prepare("INSERT INTO rate_limits (ip, endpoint, attempts, window_start)
                                        VALUES (?, ?, 1, ?)
                                        ON CONFLICT(ip, endpoint) DO UPDATE SET attempts = attempts + 1, window_start = excluded.window_start");
            $stmt->execute([$ip, $endpoint, $window]);
            return;
        }

        $stmt = $this->db->prepare("INSERT INTO rate_limits (ip, endpoint, attempts, window_start)
                                    VALUES (?, ?, 1, ?)
                                    ON DUPLICATE KEY UPDATE attempts = attempts + 1, window_start = VALUES(window_start)");
        $stmt->execute([$ip, $endpoint, $window]);
    }

    private function resetRateLimit($ip, $endpoint) {
        $stmt = $this->db->prepare("DELETE FROM rate_limits WHERE ip = ? AND endpoint = ?");
        $stmt->execute([$ip, $endpoint]);
    }

    private function findAdminForLogin(string $identifier) {
        if ($identifier === '') {
            return false;
        }

        $normalized = strtolower($identifier);
        $hasUsername = $this->columnExists('admins', 'username');

        if ($hasUsername) {
            $stmt = $this->db->prepare("
                SELECT id, email, username, name, role, password_hash
                FROM admins
                WHERE LOWER(email) = ? OR LOWER(username) = ?
                LIMIT 1
            ");
            $stmt->execute([$normalized, $normalized]);
            return $stmt->fetch();
        }

        $stmt = $this->db->prepare("
            SELECT id, email, name, role, password_hash
            FROM admins
            WHERE LOWER(email) = ?
            LIMIT 1
        ");
        $stmt->execute([$normalized]);
        return $stmt->fetch();
    }

    private function findUserForLogin(string $identifier) {
        if ($identifier === '') {
            return false;
        }

        $normalized = strtolower($identifier);
        $phone = $this->normalizePhone($identifier);

        if (filter_var($identifier, FILTER_VALIDATE_EMAIL)) {
            $stmt = $this->db->prepare("
                SELECT id, email, name, phone, address, role, password_hash
                FROM users
                WHERE LOWER(email) = ?
                LIMIT 1
            ");
            $stmt->execute([$normalized]);
            return $stmt->fetch();
        }

        if ($phone !== '') {
            $stmt = $this->db->prepare("
                SELECT id, email, name, phone, address, role, password_hash
                FROM users
                WHERE phone IS NOT NULL
            ");
            $stmt->execute();
            while ($user = $stmt->fetch()) {
                if ($this->normalizePhone((string) ($user['phone'] ?? '')) === $phone) {
                    return $user;
                }
            }
        }

        return false;
    }

    private function findUserForPasswordReset(string $identifier, string $phone) {
        $normalizedIdentifier = strtolower($identifier);
        $normalizedPhone = $this->normalizePhone($phone);

        $stmt = $this->db->prepare("
            SELECT id, email, name, phone, address, role, password_hash
            FROM users
            WHERE LOWER(email) = ? OR LOWER(name) = ?
        ");
        $stmt->execute([$normalizedIdentifier, $normalizedIdentifier]);

        while ($user = $stmt->fetch()) {
            if ($this->normalizePhone((string) ($user['phone'] ?? '')) === $normalizedPhone) {
                return $user;
            }
        }

        return false;
    }

    private function normalizePhone(string $phone): string {
        return preg_replace('/\D+/', '', $phone) ?? '';
    }

    private function attachOrdersToUser(int $userId, string $phone): void {
        $normalizedPhone = $this->normalizePhone($phone);
        if ($userId <= 0 || $normalizedPhone === '') {
            return;
        }

        $stmt = $this->db->prepare("
            SELECT id, customer_phone
            FROM orders
            WHERE (user_id IS NULL OR user_id = 0)
        ");
        $stmt->execute();

        $matchingOrderIds = [];
        while ($order = $stmt->fetch(PDO::FETCH_ASSOC)) {
            if ($this->normalizePhone((string) ($order['customer_phone'] ?? '')) === $normalizedPhone) {
                $matchingOrderIds[] = (int) $order['id'];
            }
        }

        if ($matchingOrderIds === []) {
            return;
        }

        $update = $this->db->prepare("UPDATE orders SET user_id = ? WHERE id = ?");
        foreach ($matchingOrderIds as $orderId) {
            $update->execute([$userId, $orderId]);
        }
    }

    private function columnExists(string $table, string $column): bool {
        $driver = $this->db->getAttribute(PDO::ATTR_DRIVER_NAME);

        if ($driver === 'sqlite') {
            $rows = $this->db->query("PRAGMA table_info($table)")->fetchAll(PDO::FETCH_ASSOC);
            foreach ($rows as $row) {
                if (($row['name'] ?? null) === $column) {
                    return true;
                }
            }
            return false;
        }

        $stmt = $this->db->prepare("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = ? AND COLUMN_NAME = ? AND TABLE_SCHEMA = ?");
        $stmt->execute([$table, $column, getenv('DB_NAME') ?: 'soji_shawarma']);
        return (bool) $stmt->fetch();
    }
}
