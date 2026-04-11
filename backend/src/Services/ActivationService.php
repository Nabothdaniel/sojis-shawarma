<?php

namespace BamzySMS\Services;

use BamzySMS\Core\Database;
use BamzySMS\Core\PricingHelper;
use BamzySMS\Models\SMSPurchase;
use BamzySMS\Models\User;
use BamzySMS\Models\Transaction;
use Exception;

class ActivationService {
    private SmsBowerClient $sms;
    private $userModel;
    private $purchaseModel;
    private $transactionModel;
    private $db;

    public function __construct() {
        $this->sms              = new SmsBowerClient();
        $this->userModel        = new User();
        $this->purchaseModel    = new SMSPurchase();
        $this->transactionModel = new Transaction();
        $this->db               = Database::getInstance()->getConnection();
    }

    /**
     * Executes the purchase flow with intelligent retries.
     */
    public function buyNumber(int $userId, string $serviceCode, string $serviceName, int $countryId, string $countryName): array {
        $user = $this->userModel->findById($userId);
        if (!$user) throw new Exception("User not found.");

        // 1. Get available tiers
        $prices      = $this->sms->getPricesV2($serviceCode, $countryId);
        $serviceData = $prices[(string)$countryId][$serviceCode] ?? [];
        if (empty($serviceData)) throw new Exception("Service not available for this country.");

        $tiers = [];
        foreach ($serviceData as $p => $count) {
            if ((int)$count > 0) {
                $tiers[] = ['price' => (float)$p, 'count' => (int)$count];
            }
        }
        usort($tiers, fn($a, $b) => $a['price'] <=> $b['price']);

        if (empty($tiers)) throw new Exception("No numbers available for this service.");

        // 2. Retry Loop
        $success   = false;
        $result    = null;
        $error     = "Internal Purchase Error";
        $basePrice = $tiers[0]['price'];
        $maxTiers  = array_slice($tiers, 0, 3);

        $lastAttemptedPrice = 0;

        foreach ($maxTiers as $tier) {
            $rawPrice = $tier['price'];
            if ($rawPrice > $basePrice * 1.3) break;

            $finalPriceNaira = PricingHelper::calculatePrice($rawPrice, $serviceCode);
            if ((float)$user['balance'] < $finalPriceNaira) {
                $error = "Insufficient balance. Needs ₦" . number_format($finalPriceNaira) . ".";
                break;
            }

            try {
                $result = $this->sms->getNumberV2($serviceCode, $countryId, $rawPrice);
                $lastAttemptedPrice = $rawPrice;
                $success = true;
                break;
            } catch (\Throwable $e) {
                $error = $e->getMessage();
                if (str_contains($error, 'out of stock') || str_contains($error, 'NO_NUMBERS')) {
                    continue;
                }
                throw $e;
            }
        }

        if (!$success) throw new Exception($error);

        // 3. Finalize
        $activationId   = (int)$result['activationId'];
        $phoneNumber    = (string)$result['phoneNumber'];
        $activationCost = (float)($result['activationCost'] ?? $lastAttemptedPrice);
        $finalCharge    = PricingHelper::calculatePrice($activationCost, $serviceCode);

        if (!$this->userModel->deductBalance($userId, $finalCharge)) {
            try { $this->sms->setStatus($activationId, 8); } catch (\Throwable $e) {}
            throw new Exception("Failed to deduct balance");
        }

        $this->transactionModel->create($userId, $finalCharge, 'debit', "SMS Purchase: $serviceName ($countryName)");
        
        $purchaseId = $this->purchaseModel->create(
            $userId, $activationId, $serviceCode, $serviceName, $countryName, $phoneNumber, $finalCharge
        );

        try { $this->sms->setStatus($activationId, 1); } catch (\Throwable $e) {}

        return [
            'id'           => $purchaseId,
            'activationId' => $activationId,
            'phoneNumber'  => $phoneNumber,
            'finalCharge'  => $finalCharge
        ];
    }

    /**
     * Update activation status and handle refunds if needed.
     */
    public function setStatus(int $userId, int $activationId, int $status): string {
        // Logging for Admin Audit
        $this->logAction($userId, $activationId, "SET_STATUS:$status");

        return $this->sms->setStatus($activationId, $status);
    }

    private function logAction(int $userId, int $activationId, string $action): void {
        try {
            $stmt = $this->db->prepare("INSERT INTO system_logs (user_id, action, details) VALUES (?, ?, ?)");
            $stmt->execute([$userId, 'activation_action', json_encode(['id' => $activationId, 'action' => $action])]);
        } catch (\Throwable $e) {
            // Silently fail if log table doesn't exist yet, or handle appropriately
        }
    }
}
