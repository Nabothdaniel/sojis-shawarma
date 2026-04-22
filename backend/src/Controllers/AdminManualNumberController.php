<?php

namespace BamzySMS\Controllers;

use BamzySMS\Middleware\AuthMiddleware;
use BamzySMS\Models\ManualNumber;
use BamzySMS\Models\User;
use BamzySMS\Models\SystemEvent;

class AdminManualNumberController extends AdminBaseController {
    private ManualNumber $manualNumberModel;
    private User $userHelper;
    private SystemEvent $eventHelper;

    public function __construct() {
        parent::__construct();
        $this->manualNumberModel = new ManualNumber();
        $this->userHelper = new User();
        $this->eventHelper = new SystemEvent();
    }

    public function getPaginatedNumbers() {
        $adminUserId = AuthMiddleware::handle();
        $this->checkAdmin($adminUserId);

        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = max(1, min(100, (int)($_GET['limit'] ?? 20)));
        $search = trim((string)($_GET['search'] ?? ''));
        $status = trim((string)($_GET['status'] ?? ''));

        $result = $this->manualNumberModel->getAdminPaginated($page, $limit, $search, $status);

        return $this->json([
            'status' => 'success',
            'data' => $result['data'],
            'pagination' => [
                'total' => $result['total'],
                'page' => $result['page'],
                'limit' => $result['limit'],
                'pages' => $result['pages'],
            ],
        ]);
    }

    public function createNumber() {
        $adminUserId = AuthMiddleware::handle();
        $this->checkAdmin($adminUserId);

        $data = $this->getPostData();
        $phoneNumber = $this->manualNumberModel->normalizePhoneNumber((string)($data['phone_number'] ?? ''));
        $countryName = trim((string)($data['country_name'] ?? ''));
        $sellPrice = (float)($data['sell_price'] ?? 0);
        $costPrice = max(0, (float)($data['cost_price'] ?? 0));

        if ($phoneNumber === '' || $countryName === '' || $sellPrice <= 0) {
            return $this->json(['status' => 'error', 'message' => 'Phone number, country name, and sell price are required.'], 400);
        }

        try {
            $id = $this->manualNumberModel->create([
                'phone_number' => $phoneNumber,
                'country_id' => (int)($data['country_id'] ?? 0),
                'country_name' => $countryName,
                'service_code' => 'tg',
                'service_name' => 'Telegram',
                'cost_price' => $costPrice,
                'sell_price' => $sellPrice,
                'notes' => trim((string)($data['notes'] ?? '')),
                'otp_code' => trim((string)($data['otp_code'] ?? '')),
                'upload_batch' => trim((string)($data['upload_batch'] ?? '')),
                'uploaded_by' => $adminUserId,
            ]);

            return $this->json([
                'status' => 'success',
                'message' => 'Telegram number uploaded successfully.',
                'data' => ['id' => $id],
            ]);
        } catch (\PDOException $e) {
            $isDuplicate = $e->getCode() === '23000';
            return $this->json([
                'status' => 'error',
                'message' => $isDuplicate ? 'This phone number already exists in inventory.' : 'Failed to upload number.'
            ], $isDuplicate ? 409 : 500);
        }
    }

    public function bulkCreateNumbers() {
        $adminUserId = AuthMiddleware::handle();
        $this->checkAdmin($adminUserId);

        $data = $this->getPostData();
        $rows = $data['rows'] ?? [];

        if (!is_array($rows) || empty($rows)) {
            return $this->json(['status' => 'error', 'message' => 'At least one row is required.'], 400);
        }

        $batch = 'BATCH-' . strtoupper(substr(bin2hex(random_bytes(4)), 0, 8));
        $created = 0;
        $errors = [];

        foreach ($rows as $index => $row) {
            $phoneNumber = $this->manualNumberModel->normalizePhoneNumber((string)($row['phone_number'] ?? ''));
            $countryName = trim((string)($row['country_name'] ?? ''));
            $sellPrice = (float)($row['sell_price'] ?? 0);

            if ($phoneNumber === '' || $countryName === '' || $sellPrice <= 0) {
                $errors[] = [
                    'row' => $index + 1,
                    'message' => 'Phone number, country name, and sell price are required.',
                ];
                continue;
            }

            try {
                $this->manualNumberModel->create([
                    'phone_number' => $phoneNumber,
                    'country_id' => (int)($row['country_id'] ?? 0),
                    'country_name' => $countryName,
                    'service_code' => 'tg',
                    'service_name' => 'Telegram',
                    'cost_price' => max(0, (float)($row['cost_price'] ?? 0)),
                    'sell_price' => $sellPrice,
                    'notes' => trim((string)($row['notes'] ?? '')),
                    'otp_code' => trim((string)($row['otp_code'] ?? '')),
                    'upload_batch' => $batch,
                    'uploaded_by' => $adminUserId,
                ]);
                $created++;
            } catch (\PDOException $e) {
                $errors[] = [
                    'row' => $index + 1,
                    'message' => $e->getCode() === '23000' ? 'Duplicate phone number.' : 'Upload failed.',
                ];
            }
        }

        return $this->json([
            'status' => 'success',
            'message' => "{$created} Telegram number(s) uploaded.",
            'data' => [
                'created' => $created,
                'failed' => count($errors),
                'errors' => $errors,
                'batch' => $batch,
            ],
        ]);
    }

    public function updateOtpCode() {
        $adminUserId = AuthMiddleware::handle();
        $this->checkAdmin($adminUserId);

        $data = $this->getPostData();
        $numberId = (int)($data['numberId'] ?? 0);
        $otpCode = trim((string)($data['otp_code'] ?? ''));

        if ($numberId <= 0) {
            return $this->json(['status' => 'error', 'message' => 'Number ID is required.'], 400);
        }

        if ($this->manualNumberModel->updateOtpCode($numberId, $otpCode)) {
            return $this->json(['status' => 'success', 'message' => $otpCode === '' ? 'OTP cleared.' : 'OTP saved securely.']);
        }

        return $this->json(['status' => 'error', 'message' => 'Failed to update OTP.'], 500);
    }

    public function getCancellationRequests() {
        $adminUserId = AuthMiddleware::handle();
        $this->checkAdmin($adminUserId);

        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = max(1, min(100, (int)($_GET['limit'] ?? 20)));
        $status = trim((string)($_GET['status'] ?? ''));
        $result = $this->manualNumberModel->getCancellationRequests($page, $limit, $status);

        return $this->json([
            'status' => 'success',
            'data' => $result['data'],
            'pagination' => [
                'total' => $result['total'],
                'page' => $result['page'],
                'limit' => $result['limit'],
                'pages' => $result['pages'],
            ],
        ]);
    }
}
