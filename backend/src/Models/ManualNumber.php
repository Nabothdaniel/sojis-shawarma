<?php

namespace BamzySMS\Models;

use BamzySMS\Core\Database;
use BamzySMS\Core\EncryptionHelper;
use PDO;
use RuntimeException;

class ManualNumber {
    private $db;
    private string $encryptionKey;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
        $this->encryptionKey = $_ENV['PLATFORM_ENCRYPTION_KEY'] ?? 'BAMZY-DEFAULT-KEY-2026';
    }

    public function normalizePhoneNumber(string $phoneNumber): string {
        return preg_replace('/[^\d+]/', '', trim($phoneNumber));
    }

    public function create(array $data): int {
        $stmt = $this->db->prepare("
            INSERT INTO manual_numbers
                (phone_number, country_id, country_name, service_code, service_name, cost_price, sell_price, notes, otp_code_encrypted, upload_batch, uploaded_by, status)
            VALUES
                (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'available')
        ");

        $stmt->execute([
            $this->normalizePhoneNumber($data['phone_number'] ?? ''),
            (int)($data['country_id'] ?? 0),
            trim((string)($data['country_name'] ?? '')),
            trim((string)($data['service_code'] ?? 'tg')),
            trim((string)($data['service_name'] ?? 'Telegram')),
            (float)($data['cost_price'] ?? 0),
            (float)($data['sell_price'] ?? 0),
            trim((string)($data['notes'] ?? '')) ?: null,
            $this->encryptOtp($data['otp_code'] ?? null),
            trim((string)($data['upload_batch'] ?? '')) ?: null,
            (int)$data['uploaded_by'],
        ]);

        return (int)$this->db->lastInsertId();
    }

    public function getAdminPaginated(int $page, int $limit, string $search = '', string $status = ''): array {
        $offset = ($page - 1) * $limit;
        $where = [];
        $params = [];

        if ($search !== '') {
            $where[] = "(phone_number LIKE ? OR country_name LIKE ? OR service_name LIKE ?)";
            $term = "%{$search}%";
            $params[] = $term;
            $params[] = $term;
            $params[] = $term;
        }

        if ($status !== '') {
            $where[] = "status = ?";
            $params[] = $status;
        }

        $whereClause = $where ? " WHERE " . implode(" AND ", $where) : "";

        $stmtCount = $this->db->prepare("SELECT COUNT(*) FROM manual_numbers" . $whereClause);
        $stmtCount->execute($params);
        $total = (int)$stmtCount->fetchColumn();

        $stmt = $this->db->prepare("
            SELECT mn.*, u.username AS uploaded_by_username, buyer.username AS sold_to_username
            FROM manual_numbers mn
            JOIN users u ON u.id = mn.uploaded_by
            LEFT JOIN users buyer ON buyer.id = mn.sold_to
            {$whereClause}
            ORDER BY mn.created_at DESC
            LIMIT {$limit} OFFSET {$offset}
        ");
        $stmt->execute($params);

        return [
            'data' => array_map(function (array $row) {
                $row['has_otp'] = !empty($row['otp_code_encrypted']);
                unset($row['otp_code_encrypted']);
                return $row;
            }, $stmt->fetchAll(PDO::FETCH_ASSOC)),
            'total' => $total,
            'page' => $page,
            'limit' => $limit,
            'pages' => (int)ceil($total / max(1, $limit)),
        ];
    }

    public function getAvailableTelegram(string $search = '', int $limit = 100): array {
        $params = ['tg'];
        $where = ["service_code = ?", "status = 'available'"];

        if ($search !== '') {
            $where[] = "(phone_number LIKE ? OR country_name LIKE ?)";
            $term = "%{$search}%";
            $params[] = $term;
            $params[] = $term;
        }

        $whereClause = "WHERE " . implode(" AND ", $where);
        $stmt = $this->db->prepare("
            SELECT id, phone_number, country_id, country_name, service_code, service_name, sell_price, notes, created_at
            FROM manual_numbers
            {$whereClause}
            ORDER BY created_at DESC
            LIMIT " . (int)$limit
        );
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getOwnedByUser(int $userId, string $serviceCode = 'tg'): array {
        $stmt = $this->db->prepare("
            SELECT id, phone_number, country_id, country_name, service_code, service_name, sell_price, notes, otp_code_encrypted, sold_at, created_at
            FROM manual_numbers
            WHERE sold_to = ? AND service_code = ?
            ORDER BY sold_at DESC, created_at DESC
        ");
        $stmt->execute([$userId, $serviceCode]);
        return array_map(function (array $row) {
            $row['otp_code'] = $this->decryptOtp($row['otp_code_encrypted'] ?? null);
            unset($row['otp_code_encrypted']);
            return $row;
        }, $stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    public function purchase(int $numberId, int $userId): array {
        $this->db->beginTransaction();

        try {
            $stmtNumber = $this->db->prepare("
                SELECT * FROM manual_numbers
                WHERE id = ?
                FOR UPDATE
            ");
            $stmtNumber->execute([$numberId]);
            $number = $stmtNumber->fetch(PDO::FETCH_ASSOC);

            if (!$number) {
                throw new RuntimeException('Selected number was not found.');
            }

            if ($number['status'] !== 'available') {
                throw new RuntimeException('This number has already been sold.');
            }

            $stmtUser = $this->db->prepare("
                SELECT balance FROM users
                WHERE id = ?
                FOR UPDATE
            ");
            $stmtUser->execute([$userId]);
            $user = $stmtUser->fetch(PDO::FETCH_ASSOC);

            if (!$user) {
                throw new RuntimeException('User not found.');
            }

            $price = (float)$number['sell_price'];
            $balance = (float)$user['balance'];
            if ($balance < $price) {
                throw new RuntimeException('Insufficient balance for this number.');
            }

            $stmtDebit = $this->db->prepare("UPDATE users SET balance = balance - ? WHERE id = ?");
            $stmtDebit->execute([$price, $userId]);

            $stmtTx = $this->db->prepare("
                INSERT INTO transactions (user_id, amount, type, description)
                VALUES (?, ?, 'debit', ?)
            ");
            $stmtTx->execute([
                $userId,
                $price,
                "Manual Number Purchase: {$number['service_name']} ({$number['country_name']})"
            ]);

            $stmtSold = $this->db->prepare("
                UPDATE manual_numbers
                SET status = 'sold', sold_to = ?, sold_at = NOW()
                WHERE id = ? AND status = 'available'
            ");
            $stmtSold->execute([$userId, $numberId]);

            if ($stmtSold->rowCount() <= 0) {
                throw new RuntimeException('This number is no longer available.');
            }

            $this->db->commit();

            return [
                'id' => (int)$number['id'],
                'phone_number' => $number['phone_number'],
                'country_name' => $number['country_name'],
                'service_name' => $number['service_name'],
                'sell_price' => $price,
                'otp_code' => $this->decryptOtp($number['otp_code_encrypted'] ?? null),
                'new_balance' => $balance - $price,
            ];
        } catch (\Throwable $e) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }
            throw $e;
        }
    }

    public function updateOtpCode(int $numberId, string $otpCode): bool {
        $stmt = $this->db->prepare("
            UPDATE manual_numbers
            SET otp_code_encrypted = ?
            WHERE id = ?
        ");
        return $stmt->execute([$this->encryptOtp($otpCode), $numberId]);
    }

    public function findOwnedByUser(int $numberId, int $userId): ?array {
        $stmt = $this->db->prepare("
            SELECT * FROM manual_numbers
            WHERE id = ? AND sold_to = ?
            LIMIT 1
        ");
        $stmt->execute([$numberId, $userId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    public function getById(int $numberId): ?array {
        $stmt = $this->db->prepare("
            SELECT * FROM manual_numbers
            WHERE id = ?
            LIMIT 1
        ");
        $stmt->execute([$numberId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    public function createCancellationRequest(int $numberId, int $userId, string $reason): int {
        $existing = $this->db->prepare("
            SELECT id FROM manual_number_cancellation_requests
            WHERE manual_number_id = ? AND user_id = ? AND status = 'pending'
            LIMIT 1
        ");
        $existing->execute([$numberId, $userId]);
        $existingId = $existing->fetchColumn();
        if ($existingId) {
            return (int)$existingId;
        }

        $stmt = $this->db->prepare("
            INSERT INTO manual_number_cancellation_requests
                (manual_number_id, user_id, reason, status)
            VALUES (?, ?, ?, 'pending')
        ");
        $stmt->execute([$numberId, $userId, trim($reason)]);
        return (int)$this->db->lastInsertId();
    }

    public function getCancellationRequests(int $page, int $limit, string $status = ''): array {
        $offset = ($page - 1) * $limit;
        $params = [];
        $where = '';

        if ($status !== '') {
            $where = " WHERE r.status = ?";
            $params[] = $status;
        }

        $count = $this->db->prepare("SELECT COUNT(*) FROM manual_number_cancellation_requests r" . $where);
        $count->execute($params);
        $total = (int)$count->fetchColumn();

        $stmt = $this->db->prepare("
            SELECT r.*, mn.phone_number, mn.country_name, u.username
            FROM manual_number_cancellation_requests r
            JOIN manual_numbers mn ON mn.id = r.manual_number_id
            JOIN users u ON u.id = r.user_id
            {$where}
            ORDER BY r.created_at DESC
            LIMIT {$limit} OFFSET {$offset}
        ");
        $stmt->execute($params);

        return [
            'data' => $stmt->fetchAll(PDO::FETCH_ASSOC),
            'total' => $total,
            'page' => $page,
            'limit' => $limit,
            'pages' => (int)ceil($total / max(1, $limit)),
        ];
    }

    private function encryptOtp(?string $otpCode): ?string {
        $otpCode = is_string($otpCode) ? trim($otpCode) : '';
        if ($otpCode === '') {
            return null;
        }
        return EncryptionHelper::encrypt($otpCode, $this->encryptionKey);
    }

    private function decryptOtp(?string $encryptedOtp): string {
        if (!$encryptedOtp) {
            return '';
        }
        return (string)EncryptionHelper::decrypt($encryptedOtp, $this->encryptionKey);
    }
}
