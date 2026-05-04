<?php

require_once __DIR__ . '/../Support/Auth.php';

class AuthController {
    private $db;
    private $secret;

    public function __construct($db) {
        $this->db = $db;
        $this->secret = getenv('JWT_SECRET') ?: 'default_secret';
    }

    public function login() {
        $data = json_decode(file_get_contents('php://input'), true);
        $email = $data['email'] ?? '';
        $password = $data['password'] ?? '';
        $ip = $_SERVER['REMOTE_ADDR'];

        // Rate Limiting (Task 2)
        if ($this->isRateLimited($ip, '/auth/login')) {
            header("HTTP/1.1 429 Too Many Requests");
            return json_encode(['message' => 'Too many attempts. Locked for 15 minutes.']);
        }

        $adminStmt = $this->db->prepare("SELECT id, email, name, role, password_hash FROM admins WHERE email = ?");
        $adminStmt->execute([$email]);
        $user = $adminStmt->fetch();
        $userType = 'admin';

        if (!$user) {
            $customerStmt = $this->db->prepare("SELECT id, email, name, phone, address, role, password_hash FROM users WHERE email = ?");
            $customerStmt->execute([$email]);
            $user = $customerStmt->fetch();
            $userType = 'user';
        }

        if ($user && password_verify($password, $user['password_hash'])) {
            $this->resetRateLimit($ip, '/auth/login');
            return json_encode($this->issueAuthPayload($user, $userType));
        } else {
            $this->logAttempt($ip, '/auth/login');
            header("HTTP/1.1 401 Unauthorized");
            return json_encode(['message' => 'Invalid email or password']);
        }
    }

    public function register() {
        $data = json_decode(file_get_contents('php://input'), true);
        $name = trim($data['name'] ?? '');
        $email = strtolower(trim($data['email'] ?? ''));
        $password = $data['password'] ?? '';
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
}
