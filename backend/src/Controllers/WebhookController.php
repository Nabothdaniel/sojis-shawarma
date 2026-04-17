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
            Logger::error('PAYMENTPOINT_WEBHOOK_INVALID_SIG', [
                'received_sig' => $signatureHeader,
                'payload_size' => strlen($rawPayload),
                'ip'           => $_SERVER['REMOTE_ADDR'] ?? 'unknown'
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
            
            // Return 200 to PaymentPoint to stop retries for non-failure events
            http_response_code(200);
            echo json_encode(['status' => 'ignored', 'message' => 'Non-success event acknowledged']);
            exit;
        }

        if (!$transactionId || $settlementAmount <= 0) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Missing required transaction data']);
            exit;
        }

        // ── Step 5: Idempotency — the UNIQUE constraint on transactions.external_ref
        //    ensures only one INSERT succeeds even if two webhooks arrive simultaneously.
        //    We pass $transactionId as the $externalRef; a duplicate will return false.

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
            // Use settlement_amount (after fee) to credit the user.
            // Pass $transactionId as $externalRef — the UNIQUE constraint makes this atomic:
            // if a duplicate webhook fires, the INSERT will fail with a duplicate-key error
            // and create() returns false without crediting the wallet twice.
            $description = "PaymentPoint deposit — Ref: $transactionId";
            $credited = $this->transactionModel->create($userId, $settlementAmount, 'credit', $description, $transactionId);

            if (!$credited) {
                // This means the transaction_id was already inserted — duplicate webhook
                Logger::info('PAYMENTPOINT_WEBHOOK_DUPLICATE', ['transaction_id' => $transactionId]);
                http_response_code(200);
                echo json_encode(['status' => 'ignored', 'message' => 'Transaction already processed']);
                exit;
            }

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

    /**
     * GET /api/webhook/paymentpoint
     * Used for browser testing and diagnostic checks.
     */
    public function checkPaymentPoint() {
        return $this->json([
            'status' => 'active',
            'message' => 'PaymentPoint Webhook endpoint is reachabe. Please use POST for real notifications.',
            'timestamp' => date('Y-m-d H:i:s')
        ]);
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

}
