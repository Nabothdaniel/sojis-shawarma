<?php

namespace BamzySMS\Controllers;

use BamzySMS\Core\Controller;
use BamzySMS\Middleware\AuthMiddleware;
use BamzySMS\Services\ActivationService;
use BamzySMS\Services\SmsBowerClient;
use BamzySMS\Models\SMSPurchase;
use BamzySMS\Models\User;
use BamzySMS\Models\SystemEvent;

class SMSController extends Controller {
    private ActivationService $activationService;
    private SmsBowerClient $sms;
    private $purchaseModel;
    private $userModel;
    private $eventModel;

    public function __construct() {
        $this->activationService = new ActivationService();
        $this->sms               = new SmsBowerClient();
        $this->purchaseModel     = new SMSPurchase();
        $this->userModel         = new User();
        $this->eventModel        = new SystemEvent();
    }

    // ─── POST /api/sms/buy ────────────────────────────────────────────────────

    public function buy() {
        $userId = AuthMiddleware::handle();
        $data   = $this->getPostData();

        $serviceCode = trim($data['serviceCode'] ?? '');
        $countryId   = (int)($data['countryId']   ?? -1);
        $countryName = trim($data['countryName']  ?? '');
        $serviceName = trim($data['serviceName']  ?? '');
        $pin         = trim($data['pin']          ?? '');
        $quantity    = (int)($data['quantity']    ?? 1);

        if ($quantity < 1) $quantity = 1;
        if ($quantity > 20) {
            return $this->json(['status' => 'error', 'message' => 'Maximum 20 numbers per bulk order.'], 400);
        }

        if (!$serviceCode || $countryId < 0 || !$pin) {
            return $this->json(['status' => 'error', 'message' => 'Required fields missing.'], 400);
        }

        // Verify PIN
        if (!$this->userModel->verifyPin($userId, $pin)) {
            return $this->json(['status' => 'error', 'message' => 'Invalid transaction PIN.'], 401);
        }

        $successful = [];
        $failed     = [];
        $lastError  = 'Purchase failed';

        for ($i = 0; $i < $quantity; $i++) {
            try {
                $res = $this->activationService->buyNumber($userId, $serviceCode, $serviceName, $countryId, $countryName);
                $successful[] = [
                    'id'           => $res['id'],
                    'activationId' => $res['activationId'],
                    'phoneNumber'  => $res['phoneNumber'],
                    'price'        => $res['finalCharge']
                ];
            } catch (\Throwable $e) {
                $failed[] = $e->getMessage();
                $lastError = $e->getMessage();
                // If the first one fails and it's something like "Insufficient balance", don't keep trying
                if (str_contains($lastError, 'balance') || str_contains($lastError, 'available')) {
                    break;
                }
            }
        }

        if (empty($successful)) {
            return $this->json(['status' => 'error', 'message' => $lastError], 422);
        }

        // Log balance update for real-time reactivity
        $updatedUser = $this->userModel->findById($userId);
        $this->eventModel->log($userId, 'balance_updated', [
            'new_balance' => $updatedUser['balance'],
            'message'     => 'Balance updated after purchase'
        ]);

        return $this->json([
            'status'  => 'success',
            'message' => count($successful) . " number(s) purchased successfully!",
            'data'    => [
                'count'      => count($successful),
                'items'      => $successful,
                'failedCount'=> count($failed),
                'errors'     => array_unique($failed)
            ],
        ]);
    }

    // ─── GET /api/sms/purchases ───────────────────────────────────────────────

    public function getPurchases() {
        $userId = AuthMiddleware::handle();
        $limit  = isset($_GET['limit']) ? (int)$_GET['limit'] : 20;
        $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;

        $purchases = $this->purchaseModel->getByUserPaginated($userId, $limit, $offset);
        $total     = $this->purchaseModel->countByUser($userId);

        // Mask sensitive data for the list view
        foreach ($purchases as &$p) {
            if (!empty($p['phone_number'])) {
                $p['phone_masked'] = substr($p['phone_number'], 0, 4) . '****' . substr($p['phone_number'], -2);
                $p['phone_number'] = $p['phone_masked']; // Overwrite to ensure frontend shows masked by default
            }
            if (!empty($p['otp_code'])) {
                $p['otp_code'] = '****';
            }
        }

        return $this->json([
            'status' => 'success',
            'data'   => $purchases,
            'meta'   => [
                'total'  => $total,
                'limit'  => $limit,
                'offset' => $offset,
                'hasMore'=> ($offset + $limit) < $total
            ]
        ]);
    }

    /**
     * POST /api/sms/hide
     */
    public function hide() {
        $userId = AuthMiddleware::handle();
        $data   = $this->getPostData();
        $id     = (int)($data['id'] ?? 0);

        if (!$id) return $this->json(['status' => 'error', 'message' => 'ID required'], 400);

        if ($this->purchaseModel->hidePurchase($id, $userId)) {
            return $this->json(['status' => 'success', 'message' => 'Purchase hidden.']);
        }
        return $this->json(['status' => 'error', 'message' => 'Failed to hide purchase.'], 500);
    }

    // ─── GET /api/sms/status?id=123 ───────────────────────────────────────────

    public function getStatus() {
        $userId = AuthMiddleware::handle();
        $activationId = (int)($_GET['id'] ?? 0);
        if (!$activationId) return $this->json(['status' => 'error', 'message' => 'id required.'], 400);

        try {
            $status = $this->sms->getStatus($activationId);
            
            // Persist status and code if received or cancelled
            if ($status['status'] === 'OK' && $status['code']) {
                $purchase = $this->purchaseModel->getByActivationId($activationId, $userId);
                if ($purchase) {
                    $this->purchaseModel->updateStatus($purchase['id'], 'received', $status['code']);
                    // Log event for real-time UI notification
                    $this->eventModel->log($userId, 'notification', [
                        'type'    => 'success',
                        'message' => "OTP Received: " . $status['code']
                    ]);
                }
            } elseif ($status['status'] === 'CANCEL') {
                $purchase = $this->purchaseModel->getByActivationId($activationId, $userId);
                if ($purchase) {
                    $this->purchaseModel->updateStatus($purchase['id'], 'cancelled', null);
                }
            }

            return $this->json(['status' => 'success', 'data' => [
                'smsStatus' => $status['status'],
                'code'      => $status['code'] ?? null
            ]]);
        } catch (\Throwable $e) {
            return $this->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }

    // ─── POST /api/sms/reveal ─────────────────────────────────────────────────

    public function getPlainNumber() {
        $userId = AuthMiddleware::handle();
        $data   = $this->getPostData();
        $activationId = (int)($data['activationId'] ?? 0);
        $pin          = trim($data['pin'] ?? '');

        if (!$activationId) {
            return $this->json(['status' => 'error', 'message' => 'Required fields missing.'], 400);
        }

        // 1. Fetch purchase (PIN verification removed as per user request)

        // 2. Fetch purchase using database ID
        $purchase = $this->purchaseModel->getById($activationId, $userId);
        if (!$purchase) {
            return $this->json(['status' => 'error', 'message' => 'Activation not found.'], 404);
        }

        return $this->json([
            'status' => 'success',
            'data' => [
                'phoneNumber' => $purchase['phone_number'],
                'otpCode'     => $purchase['otp_code'] ?? ''
            ]
        ]);
    }

    // ─── POST /api/sms/set-status ─────────────────────────────────────────────

    public function setActivationStatus() {
        $userId = AuthMiddleware::handle();
        $data   = $this->getPostData();
        $activationId = (int)($data['activationId'] ?? $data['id'] ?? 0);
        $status       = (int)($data['status'] ?? 0);

        if (!$activationId || !$status) {
            return $this->json(['status' => 'error', 'message' => 'id and status required.'], 400);
        }

        try {
            $resp = $this->activationService->setStatus($userId, $activationId, $status);
            return $this->json(['status' => 'success', 'message' => $resp]);
        } catch (\Throwable $e) {
            return $this->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }
}
