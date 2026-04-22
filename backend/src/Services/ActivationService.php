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
     *
     * Security model:
     *  - Balance is checked with a FOR UPDATE row-lock INSIDE the debit transaction,
     *    so no concurrent request can deduct the same funds between our check and write.
     *  - The API call (getNumberV2) happens BEFORE the DB transaction. If the debit
     *    subsequently fails, we immediately cancel the activation with the provider (status 8).
     */
    public function buyNumber(int $userId, string $serviceCode, string $serviceName, int $countryId, string $countryName): array {
        // 1. Get available tiers (read-only, no lock needed here)
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

        // 2. Do a quick pre-flight balance check (non-locking) to give a helpful
        //    error early without hitting the provider API.
        $basePrice       = $tiers[0]['price'];
        $lowestCharge    = PricingHelper::calculatePrice($basePrice, $serviceCode, $countryId);
        $user            = $this->userModel->findById($userId);
        if (!$user) throw new Exception("User not found.");
        if ((float)$user['balance'] < $lowestCharge) {
            throw new Exception("Insufficient balance. Needs ₦" . number_format($lowestCharge, 2) . ".");
        }

        // 3. Retry Loop — try up to 3 cheapest tiers
        $maxTiers           = array_slice($tiers, 0, 3);
        $result             = null;
        $error              = "Internal Purchase Error";
        $lastAttemptedPrice = 0;

        foreach ($maxTiers as $tier) {
            $rawPrice = $tier['price'];
            if ($rawPrice > $basePrice * 1.3) break;

            try {
                $result             = $this->sms->getNumberV2($serviceCode, $countryId, $rawPrice);
                $lastAttemptedPrice = $rawPrice;
                break;
            } catch (\Throwable $e) {
                $error = $e->getMessage();
                if (str_contains($error, 'out of stock') || str_contains($error, 'NO_NUMBERS')) {
                    continue;
                }
                throw $e;
            }
        }

        if (!$result) throw new Exception($error);

        // 4. Atomically debit — the Transaction model uses FOR UPDATE inside its own
        //    transaction, so the actual balance check + debit is race-condition-free.
        $activationId   = (int)$result['activationId'];
        $phoneNumber    = (string)$result['phoneNumber'];
        $activationCost = (float)($result['activationCost'] ?? $lastAttemptedPrice);
        $finalCharge    = PricingHelper::calculatePrice($activationCost, $serviceCode, $countryId);

        if (!$this->transactionModel->create($userId, $finalCharge, 'debit', "SMS Purchase: $serviceName ($countryName)")) {
            // Debit failed (insufficient balance after lock) — cancel the activation
            // so the provider releases the number and we don't leak it.
            try { $this->sms->setStatus($activationId, 8); } catch (\Throwable $e) {}
            throw new Exception("Insufficient balance. Please top up your wallet.");
        }

        // 5. Record the purchase and activate
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

        if ($status === 8 || $status === 7) {
            $this->reconcileCancelledActivation($userId, $activationId);
        }

        return $this->sms->setStatus($activationId, $status);
    }

    /**
     * Reconcile a cancelled activation and refund the user's wallet exactly once.
     * Returns true only when a fresh refund was actually processed.
     */
    public function reconcileCancelledActivation(int $userId, int $activationId): bool {
        $purchase = $this->purchaseModel->findByActivationId($activationId);

        if (!$purchase || $purchase['status'] === 'cancelled') {
            return false;
        }

        $refundAmount = (float)$purchase['activation_cost'];
        if ($refundAmount <= 0) {
            return false;
        }

        $this->db->beginTransaction();
        try {
            // Mark as cancelled first so duplicate requests cannot double-refund.
            $rowsAffected = $this->purchaseModel->updateStatusIfNot(
                $purchase['id'], 'cancelled', 'cancelled'
            );

            if ($rowsAffected <= 0) {
                $this->db->rollBack();
                \BamzySMS\Core\Logger::info('REFUND_SKIPPED_DUPLICATE', [
                    'activation_id' => $activationId,
                ], $userId);
                return false;
            }

            $this->transactionModel->createCredit(
                $userId,
                $refundAmount,
                "Refund: Order #{$activationId} cancelled"
            );

            $this->db->commit();
            \BamzySMS\Core\Logger::info('REFUND_PROCESSED', [
                'activation_id' => $activationId,
                'amount'        => $refundAmount
            ], $userId);

            return true;
        } catch (\Exception $e) {
            $this->db->rollBack();
            \BamzySMS\Core\Logger::error('REFUND_FAILED', [
                'activation_id' => $activationId,
                'error'         => $e->getMessage()
            ], $userId);
            return false;
        }
    }
}
