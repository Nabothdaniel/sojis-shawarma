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

            $finalPriceNaira = PricingHelper::calculatePrice($rawPrice, $serviceCode, $countryId);
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
        $finalCharge    = PricingHelper::calculatePrice($activationCost, $serviceCode, $countryId);

        if (!$this->transactionModel->create($userId, $finalCharge, 'debit', "SMS Purchase: $serviceName ($countryName)")) {
            try { $this->sms->setStatus($activationId, 8); } catch (\Throwable $e) {}
            throw new Exception("Insufficient balance or failed to deduct balance");
        }
        
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
        \BamzySMS\Core\Logger::info('ACTIVATION_STATUS_CHANGE', [
            'activation_id' => $activationId,
            'new_status' => $status
        ], $userId);

        // Handle Auto-Reconciliation (Refund)
        // Status 8 = Cancelled (by user or provider) 
        // Status 7 = Cancelled (alternate code)
        if ($status === 8 || $status === 7) {
            $purchase = $this->purchaseModel->findByActivationId($activationId);
            
            if ($purchase && $purchase['status'] !== 'cancelled') {
                $refundAmount = (float)$purchase['activation_cost'];
                
                if ($refundAmount > 0) {
                    $this->db->beginTransaction();
                    try {
                        // 1. Credit user balance
                        $this->userModel->addBalance($userId, $refundAmount);
                        
                        // 2. Log transaction
                        $this->transactionModel->create(
                            $userId, 
                            $refundAmount, 
                            'credit', 
                            "Refund: Order #{$activationId} cancelled"
                        );
                        
                        // 3. Update purchase record
                        $this->purchaseModel->updateStatus($purchase['id'], 'cancelled');
                        
                        $this->db->commit();
                        \BamzySMS\Core\Logger::info('REFUND_PROCESSED', [
                            'activation_id' => $activationId,
                            'amount' => $refundAmount
                        ], $userId);
                    } catch (\Exception $e) {
                        $this->db->rollBack();
                        \BamzySMS\Core\Logger::error('REFUND_FAILED', [
                            'activation_id' => $activationId,
                            'error' => $e->getMessage()
                        ], $userId);
                    }
                }
            }
        }

        return $this->sms->setStatus($activationId, $status);
    }
}
