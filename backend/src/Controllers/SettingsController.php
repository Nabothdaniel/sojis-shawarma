<?php

require_once __DIR__ . '/../Support/Auth.php';

class SettingsController {
    private PDO $db;

    public function __construct($db) {
        $this->db = $db;
    }

    public function getPaymentSettings() {
        return json_encode([
            'status' => 'success',
            'data' => $this->fetchSettings([
                'payment_account_name',
                'payment_account_number',
                'payment_bank_name',
                'payment_note',
                'support_whatsapp',
                'pickup_address',
                'pickup_instructions',
            ]),
        ]);
    }

    public function getAdminSettings() {
        if (!$this->isAdmin()) {
            header("HTTP/1.1 401 Unauthorized");
            return json_encode(['message' => 'Admin access required']);
        }

        return json_encode([
            'status' => 'success',
            'data' => $this->fetchSettings([
                'payment_account_name',
                'payment_account_number',
                'payment_bank_name',
                'payment_note',
                'support_whatsapp',
                'pickup_address',
                'pickup_instructions',
            ]),
        ]);
    }

    public function updateAdminSettings() {
        if (!$this->isAdmin()) {
            header("HTTP/1.1 401 Unauthorized");
            return json_encode(['message' => 'Admin access required']);
        }

        $data = json_decode(file_get_contents('php://input'), true) ?: [];
        $allowedKeys = [
            'payment_account_name',
            'payment_account_number',
            'payment_bank_name',
            'payment_note',
            'support_whatsapp',
            'pickup_address',
            'pickup_instructions',
        ];

        $select = $this->db->prepare("SELECT key_name FROM settings WHERE key_name = ?");
        $insert = $this->db->prepare("INSERT INTO settings (key_name, value) VALUES (?, ?)");
        $update = $this->db->prepare("UPDATE settings SET value = ? WHERE key_name = ?");

        foreach ($allowedKeys as $key) {
            if (!array_key_exists($key, $data)) {
                continue;
            }

            $value = trim((string) $data[$key]);
            $select->execute([$key]);
            if ($select->fetch(PDO::FETCH_ASSOC)) {
                $update->execute([$value, $key]);
                continue;
            }

            $insert->execute([$key, $value]);
        }

        return json_encode([
            'status' => 'success',
            'message' => 'Store settings updated',
            'data' => $this->fetchSettings($allowedKeys),
        ]);
    }

    private function fetchSettings(array $keys): array {
        $stmt = $this->db->query("SELECT key_name, value FROM settings");
        $rows = $stmt ? $stmt->fetchAll(PDO::FETCH_ASSOC) : [];
        $map = [];

        foreach ($rows as $row) {
            $map[(string) $row['key_name']] = (string) ($row['value'] ?? '');
        }

        $settings = [];
        foreach ($keys as $key) {
            $settings[$key] = $map[$key] ?? '';
        }

        return $settings;
    }

    private function isAdmin(): bool {
        $token = getBearerToken();
        $payload = $token ? verifyJwt($token) : false;
        return (bool) $payload && (($payload['role'] ?? 'user') === 'admin');
    }
}
