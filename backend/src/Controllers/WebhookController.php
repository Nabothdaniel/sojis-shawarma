<?php
namespace BamzySMS\Controllers;

use BamzySMS\Core\Controller;
use BamzySMS\Models\User;
use BamzySMS\Models\Transaction;
use BamzySMS\Models\SystemEvent;
use BamzySMS\Services\PaymentPointService;
use BamzySMS\Core\Logger;

class WebhookController extends Controller {
    private $userModel;
    private $transactionModel;
    private $eventModel;

    public function __construct() {
        $this->userModel        = new User();
        $this->transactionModel = new Transaction();
        $this->eventModel       = new SystemEvent();
    }

    /**
     * Custom Internal Webhook (manual top-up via admin panel or scripts)
     * POST /api/webhook/payment
     */
    public function handlePayment() {
        $secret         = env_or_default('WEBHOOK_SECRET', '');
        $incomingSecret = $_SERVER['HTTP_X_WEBHOOK_SECRET'] ?? '';

        if ($secret && $incomingSecret !== $secret) {
            return $this->json(['status' => 'error', 'message' => 'Invalid webhook secret'], 401);
        }

        $data      = $this->getPostData();
        $username  = $data['username']  ?? '';
        $amount    = floatval($data['amount']    ?? 0);
        $reference = $data['reference'] ?? 'Deposit';

        if (!$username || $amount <= 0) {
            return $this->json(['status' => 'error', 'message' => 'Invalid payload'], 400);
        }

        $user = $this->userModel->findByUsername($username);
        if (!$user) {
            return $this->json(['status' => 'error', 'message' => 'User not found'], 404);
        }

        $userId = $user['id'];

        try {
            $this->transactionModel->create($userId, $amount, 'credit', "Wallet Top-up: $reference");

            $updated = $this->userModel->findById($userId);
            $this->eventModel->log($userId, 'balance_updated', [
                'new_balance' => $updated['balance'],
                'message'     => "Top-up of ₦" . number_format($amount, 2) . " was successful!",
            ]);

            return $this->json(['status' => 'success', 'message' => 'Payment processed successfully']);
        } catch (\Exception $e) {
            return $this->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * PaymentPoint Webhook — receives payment notifications when someone sends
     * money to a user's virtual account.
     * POST /api/webhook/paymentpoint
     *
     * Security: HMAC-SHA256 signature check against Paymentpoint-Signature header.
     */
    public function handlePaymentPoint() {
        // ── Step 1: Read raw body (needed for signature check) ────────────────
        $rawPayload = file_get_contents('php://input');

        // ── Step 2: Verify signature ──────────────────────────────────────────
        $signatureHeader = $_SERVER['HTTP_PAYMENTPOINT_SIGNATURE'] ?? '';

        $paymentService = new PaymentPointService();
        if (!$paymentService->verifyWebhookSignature($rawPayload, $signatureHeader)) {
            Logger::warning('PAYMENTPOINT_WEBHOOK_INVALID_SIG', [
                'received_sig' => $signatureHeader,
            ]);
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Invalid signature']);
            exit;
        }

        // ── Step 3: Decode JSON ───────────────────────────────────────────────
        $data = json_decode($rawPayload, true);

        if (json_last_error() !== JSON_ERROR_NONE || !is_array($data)) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Invalid JSON payload']);
            exit;
        }

        // ── Step 4: Validate required fields ─────────────────────────────────
        $notificationStatus = $data['notification_status'] ?? '';
        $transactionId      = $data['transaction_id']      ?? '';
        $amountPaid         = floatval($data['amount_paid']         ?? 0);
        $settlementAmount   = floatval($data['settlement_amount']   ?? 0);
        $transactionStatus  = $data['transaction_status']  ?? '';
        $customer           = $data['customer']            ?? [];
        $receiver           = $data['receiver']            ?? [];
        $timestamp          = $data['timestamp']           ?? '';

        if ($notificationStatus !== 'payment_successful' || $transactionStatus !== 'success') {
            // Acknowledge but don't process
            Logger::info('PAYMENTPOINT_WEBHOOK_IGNORED', [
                'notification_status' => $notificationStatus,
                'transaction_status'  => $transactionStatus,
                'transaction_id'      => $transactionId,
            ]);
            http_response_code(200);
            echo json_encode(['status' => 'ignored', 'message' => 'Non-successful event received']);
            exit;
        }

        if (!$transactionId || $settlementAmount <= 0) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Missing required transaction data']);
            exit;
        }

        // ── Step 5: Idempotency — don't credit the same transaction twice ─────
        // We use the transaction_id as the description lookup. For a real system
        // you would store processed transaction IDs in a separate table.
        $alreadyProcessed = $this->transactionAlreadyProcessed($transactionId);
        if ($alreadyProcessed) {
            Logger::info('PAYMENTPOINT_WEBHOOK_DUPLICATE', ['transaction_id' => $transactionId]);
            http_response_code(200);
            echo json_encode(['status' => 'ignored', 'message' => 'Transaction already processed']);
            exit;
        }

        // ── Step 6: Find the user by their virtual account number ─────────────
        $receiverAccountNumber = $receiver['account_number'] ?? '';
        $user = $this->findUserByVirtualAccount($receiverAccountNumber);

        if (!$user) {
            Logger::warning('PAYMENTPOINT_WEBHOOK_USER_NOT_FOUND', [
                'receiver_account' => $receiverAccountNumber,
                'transaction_id'   => $transactionId,
                'customer_email'   => $customer['email'] ?? 'unknown',
            ]);
            // Still return 200 so PaymentPoint doesn't keep retrying
            http_response_code(200);
            echo json_encode(['status' => 'error', 'message' => 'No matching user for this virtual account']);
            exit;
        }

        $userId = $user['id'];

        // ── Step 7: Credit the user's wallet ─────────────────────────────────
        try {
            // Use settlement_amount (after fee) to credit the user
            $description = "PaymentPoint deposit — Ref: $transactionId";
            $this->transactionModel->create($userId, $settlementAmount, 'credit', $description);

            // Trigger real-time UI update via SSE events
            $updatedUser = $this->userModel->findById($userId);
            $this->eventModel->log($userId, 'balance_updated', [
                'new_balance' => $updatedUser['balance'],
                'message'     => "₦" . number_format($settlementAmount, 2) . " received in your wallet!",
            ]);

            Logger::info('PAYMENTPOINT_WEBHOOK_CREDITED', [
                'user_id'          => $userId,
                'amount_paid'      => $amountPaid,
                'settlement'       => $settlementAmount,
                'transaction_id'   => $transactionId,
                'receiver_account' => $receiverAccountNumber,
            ]);

            http_response_code(200);
            echo json_encode(['status' => 'success', 'message' => 'Wallet credited successfully']);
            exit;

        } catch (\Exception $e) {
            Logger::error('PAYMENTPOINT_WEBHOOK_CREDIT_FAILED', [
                'user_id'        => $userId,
                'transaction_id' => $transactionId,
                'error'          => $e->getMessage(),
            ]);
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => 'Failed to credit wallet']);
            exit;
        }
    }

    // ─── Private Helpers ──────────────────────────────────────────────────────

    /**
     * Look up a user by their PaymentPoint virtual account number.
     * The account number is stored in the `virtual_accounts` table.
     */
    private function findUserByVirtualAccount(string $accountNumber): ?array {
        if (!$accountNumber) return null;

        try {
            $db   = \BamzySMS\Core\Database::getInstance()->getConnection();
            $stmt = $db->prepare("
                SELECT u.id, u.username, u.name, u.balance
                FROM virtual_accounts va
                JOIN users u ON u.id = va.user_id
                WHERE va.account_number = ?
                LIMIT 1
            ");
            $stmt->execute([$accountNumber]);
            $row = $stmt->fetch(\PDO::FETCH_ASSOC);
            return $row ?: null;
        } catch (\PDOException $e) {
            Logger::error('PAYMENTPOINT_VA_LOOKUP_ERROR', ['error' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * Simple idempotency check — ensures a PaymentPoint transaction_id isn't credited twice.
     */
    private function transactionAlreadyProcessed(string $transactionId): bool {
        try {
            $db   = \BamzySMS\Core\Database::getInstance()->getConnection();
            $stmt = $db->prepare("
                SELECT id FROM transactions
                WHERE description LIKE ?
                LIMIT 1
            ");
            $stmt->execute(["%Ref: $transactionId%"]);
            return (bool)$stmt->fetch();
        } catch (\PDOException $e) {
            return false;
        }
    }
}
