<?php

namespace BamzySMS\Controllers;

use BamzySMS\Core\Controller;
use BamzySMS\Models\SMSPurchase;
use BamzySMS\Models\User;
use BamzySMS\Models\Transaction;
use BamzySMS\Middleware\AuthMiddleware;
use BamzySMS\Services\SmsBowerClient;

class SMSController extends Controller {
    private $purchaseModel;
    private $userModel;
    private $transactionModel;
    private SmsBowerClient $sms;

    public function __construct() {
        $this->purchaseModel    = new SMSPurchase();
        $this->userModel        = new User();
        $this->transactionModel = new Transaction();
        $this->sms              = new SmsBowerClient();
    }

    // ─── POST /api/sms/buy ────────────────────────────────────────────────────

    public function buy() {
        $userId = AuthMiddleware::handle();
        $data   = $this->getPostData();

        $serviceCode = trim($data['serviceCode'] ?? '');
        $serviceName = trim($data['serviceName'] ?? '');
        $countryId   = (int)($data['countryId']   ?? -1);
        $countryName = trim($data['countryName']  ?? '');

        if (!$serviceCode || $countryId < 0) {
            return $this->json(['status' => 'error', 'message' => 'serviceCode and countryId are required.'], 400);
        }

        // 1. Fetch system settings for pricing
        $settings     = (new \BamzySMS\Models\Setting())->getAll();
        $multiplier   = (float)($settings['price_markup_multiplier'] ?? 1.5);
        $exchangeRate = (float)($settings['usd_to_ngn_rate'] ?? 1600);

        // 2. Fetch live user record
        $user = $this->userModel->findById($userId);
        if (!$user) return $this->json(['status' => 'error', 'message' => 'User not found.'], 404);

        try {
            // 3. Get cheapest raw price from SMSBower (server-side check)
            $prices      = $this->sms->getPricesV2($serviceCode, $countryId);
            $serviceData = $prices[(string)$countryId][$serviceCode] ?? [];
            if (empty($serviceData)) throw new \Exception("Service not available for this country.");

            $rawPrice = null;
            foreach ($serviceData as $p => $count) {
                if ($count > 0 && ($rawPrice === null || (float)$p < $rawPrice)) $rawPrice = (float)$p;
            }
            if ($rawPrice === null) throw new \Exception("No numbers available for this service.");

            // 4. Calculate final marked-up price in Naira
            $finalPriceNaira = (float)ceil($rawPrice * $multiplier * $exchangeRate);

            // 5. Balance check
            if ((float)$user['balance'] < $finalPriceNaira) {
                return $this->json(['status' => 'error', 'message' => "Insufficient balance. Needs ₦$finalPriceNaira."], 400);
            }

            // 6. Call SMSBower to get a real phone number (using raw max price)
            $result = $this->sms->getNumberV2($serviceCode, $countryId, $rawPrice);

            $activationId   = (int)$result['activationId'];
            $phoneNumber    = (string)$result['phoneNumber'];
            $activationCost = (float)($result['activationCost'] ?? $rawPrice);

            // Re-calculate based on actual cost if it differs
            $finalCharge = (float)ceil($activationCost * $multiplier * $exchangeRate);

            // 7. Deduct balance
            if (!$this->userModel->deductBalance($userId, $finalCharge)) {
                try { $this->sms->setStatus($activationId, 8); } catch (\Throwable $e) {}
                throw new \Exception("Failed to deduct balance");
            }

            // 8. Log transaction & purchase
            $desc = "SMS Purchase: $serviceName ($countryName)";
            $this->transactionModel->create($userId, $finalCharge, 'debit', $desc);
            
            $purchaseId = $this->purchaseModel->create(
                $userId,
                $activationId,
                $serviceCode,
                $serviceName,
                $countryName,
                $phoneNumber,
                $finalCharge
            );

            // 9. Notify SMSBower ready (status = 1)
            try { $this->sms->setStatus($activationId, 1); } catch (\Throwable $e) {}

            return $this->json([
                'status'  => 'success',
                'message' => 'Number purchased successfully!',
                'data'    => [
                    'id'            => $purchaseId,
                    'activationId'  => $activationId,
                    'phoneNumber'   => $phoneNumber,
                    'serviceName'   => $serviceName,
                    'countryName'   => $countryName,
                    'price'         => $finalCharge,
                    'newBalance'    => round((float)$user['balance'] - $finalCharge, 2),
                    'smsStatus'     => 'WAIT_CODE',
                ],
            ]);

        } catch (\Throwable $e) {
            return $this->json(['status' => 'error', 'message' => $e->getMessage()], 422);
        }
    }

    // ─── GET /api/sms/purchases ───────────────────────────────────────────────

    public function getPurchases() {
        $userId    = AuthMiddleware::handle();
        $purchases = $this->purchaseModel->getByUser($userId);
        return $this->json(['status' => 'success', 'data' => $purchases]);
    }

    // ─── GET /api/sms/status?id=123 ───────────────────────────────────────────

    public function getStatus() {
        $userId       = AuthMiddleware::handle();
        $activationId = (int)($_GET['id'] ?? 0);

        if (!$activationId) {
            return $this->json(['status' => 'error', 'message' => 'Activation ID required.'], 400);
        }

        // Verify this activation belongs to the user
        $purchase = $this->purchaseModel->getByActivationId($activationId, $userId);
        if (!$purchase) {
            return $this->json(['status' => 'error', 'message' => 'Activation not found.'], 404);
        }

        try {
            $result = $this->sms->getStatus($activationId);

            // If OTP received, persist it
            if (in_array($result['status'], ['OK', 'WAIT_RETRY']) && $result['code']) {
                $dbStatus = $result['status'] === 'OK' ? 'received' : 'pending';
                $this->purchaseModel->updateStatus($purchase['id'], $dbStatus, $result['code']);
            }

            if ($result['status'] === 'CANCEL') {
                $this->purchaseModel->updateStatus($purchase['id'], 'cancelled', null);
            }

            return $this->json([
                'status' => 'success',
                'data'   => [
                    'smsStatus' => $result['status'],
                    'code'      => $result['code'],
                ],
            ]);
        } catch (\Throwable $e) {
            return $this->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }

    // ─── POST /api/sms/set-status ─────────────────────────────────────────────

    public function setActivationStatus() {
        $userId = AuthMiddleware::handle();
        $data   = $this->getPostData();

        $activationId = (int)($data['activationId'] ?? 0);
        $statusCode   = (int)($data['status']       ?? 0);

        if (!$activationId || !in_array($statusCode, [1, 3, 6, 8])) {
            return $this->json(['status' => 'error', 'message' => 'Invalid activationId or status.'], 400);
        }

        $purchase = $this->purchaseModel->getByActivationId($activationId, $userId);
        if (!$purchase) {
            return $this->json(['status' => 'error', 'message' => 'Activation not found.'], 404);
        }

        try {
            $response = $this->sms->setStatus($activationId, $statusCode);

            // Update local DB based on action
            if ($statusCode === 8) {
                $this->purchaseModel->updateStatus($purchase['id'], 'cancelled', null);
            } elseif ($statusCode === 6) {
                $this->purchaseModel->updateStatus($purchase['id'], 'completed', $purchase['otp_code']);
            }

            return $this->json([
                'status'   => 'success',
                'response' => $response,
            ]);
        } catch (\Throwable $e) {
            return $this->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }
}
