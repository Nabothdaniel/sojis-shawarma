<?php

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

        $stmt = $this->db->prepare("SELECT * FROM admins WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if ($user && password_verify($password, $user['password_hash'])) {
            $this->resetRateLimit($ip, '/auth/login');
            
            $accessToken = $this->generateJWT(['id' => $user['id'], 'email' => $user['email']], 900); // 15 mins
            $refreshToken = $this->generateJWT(['id' => $user['id']], 604800); // 7 days

            setcookie('refresh_token', $refreshToken, [
                'expires' => time() + 604800,
                'path' => '/',
                'httponly' => true,
                'secure' => true,
                'samesite' => 'Strict'
            ]);

            return json_encode([
                'status' => 'success',
                'token' => $accessToken,
                'user' => [
                    'id' => $user['id'],
                    'email' => $user['email'],
                    'name' => $user['name'],
                    'role' => $user['role'] ?? 'admin'
                ]
            ]);
        } else {
            $this->logAttempt($ip, '/auth/login');
            header("HTTP/1.1 401 Unauthorized");
            return json_encode(['message' => 'Invalid email or password']);
        }
    }

    public function refresh() {
        $token = $_COOKIE['refresh_token'] ?? '';
        $payload = $this->verifyJWT($token);
        
        if ($payload) {
            $newAccessToken = $this->generateJWT(['id' => $payload['id']], 900);
            return json_encode(['token' => $newAccessToken]);
        }
        
        header("HTTP/1.1 401 Unauthorized");
        return json_encode(['message' => 'Invalid refresh token']);
    }

    public function logout() {
        setcookie('refresh_token', '', time() - 3600, '/', '', true, true);
        return json_encode(['status' => 'success']);
    }

    private function generateJWT($payload, $expiry) {
        $header = base64_encode(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
        $payload['exp'] = time() + $expiry;
        $payload = base64_encode(json_encode($payload));
        $signature = hash_hmac('sha256', "$header.$payload", $this->secret, true);
        $signature = base64_encode($signature);
        return "$header.$payload.$signature";
    }

    private function verifyJWT($token) {
        $parts = explode('.', $token);
        if (count($parts) !== 3) return false;
        
        list($header, $payload, $signature) = $parts;
        $validSignature = base64_encode(hash_hmac('sha256', "$header.$payload", $this->secret, true));
        
        if ($signature !== $validSignature) return false;
        
        $data = json_decode(base64_decode($payload), true);
        if ($data['exp'] < time()) return false;
        
        return $data;
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
