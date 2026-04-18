<?php

namespace BamzySMS\Controllers;

use BamzySMS\Core\Controller;
use BamzySMS\Middleware\AuthMiddleware;
use BamzySMS\Services\PaymentPointService;
use BamzySMS\Models\User;
use BamzySMS\Models\Transaction;
use BamzySMS\Models\SystemEvent;
use BamzySMS\Core\Database;

class PaymentController extends Controller {
    private PaymentPointService $paymentService;
    private User $userModel;
    private Transaction $transactionModel;
    private SystemEvent $eventModel;
    private $db;

    public function __construct() {
        $this->paymentService   = new PaymentPointService();
        $this->userModel        = new User();
        $this->transactionModel = new Transaction();
        $this->eventModel       = new SystemEvent();
        $this->db               = Database::getInstance()->getConnection();
    }

    /**
     * GET /api/payment/virtual-account
     * Returns (or creates) the PaymentPoint virtual account for the logged-in user.
     * Accounts are stored in the `virtual_accounts` table so we only call the API once per user.
     */
    public function getVirtualAccount() {
        $userId = AuthMiddleware::handle();
        $user   = $this->userModel->findById($userId);

        if (!$user) {
            return $this->json(['status' => 'error', 'message' => 'User not found'], 404);
        }

        // Check if this user already has a virtual account stored
        try {
            $stmt = $this->db->prepare(
                "SELECT * FROM virtual_accounts WHERE user_id = ? LIMIT 1"
            );
            $stmt->execute([$userId]);
            $existing = $stmt->fetch(\PDO::FETCH_ASSOC);

            if ($existing) {
                // Return the cached account(s)
                $accountsStmt = $this->db->prepare(
                    "SELECT bank_code, account_number, account_name, bank_name, reserved_account_id
                     FROM virtual_accounts WHERE user_id = ?"
                );
                $accountsStmt->execute([$userId]);
                $accounts = $accountsStmt->fetchAll(\PDO::FETCH_ASSOC);

                // Map snake_case database fields to camelCase for the frontend
                $formattedAccounts = [];
                $uniqueBanks = [];

                foreach ($accounts as $row) {
                    $bn = $row['bank_name'] ?? 'Unknown';
                    if (!in_array($bn, $uniqueBanks)) {
                        $uniqueBanks[] = $bn;
                        $formattedAccounts[] = [
                            'bankCode'      => $row['bank_code'],
                            'accountNumber' => $row['account_number'],
                            'accountName'   => $row['account_name'],
                            'bankName'      => $bn,
                            'Reserved_Account_Id' => $row['reserved_account_id']
                        ];
                    }
                }

                return $this->json([
                    'status'       => 'success',
                    'bankAccounts' => $formattedAccounts,
                    'customer'     => [
                        'customer_name'         => $user['name'],
                        'customer_email'        => $user['username'] . '@bamzysms.com',
                        'customer_phone_number' => $user['phone'] ?? '',
                    ]
                ]);
            }
        } catch (\PDOException $e) {
            // Table might not exist yet — fall through to creation
        }

        // Create a new virtual account via PaymentPoint API
        try {
            $customerEmail = $user['username'] . '@bamzysms.com';
            $customerName  = $user['name'] ?? $user['username'];
            $customerPhone = $user['phone'] ?? '08000000000';

            $response = $this->paymentService->createVirtualAccount(
                $customerName,
                $customerEmail,
                $customerPhone
            );

            $bankAccounts = $response['bankAccounts'] ?? [];
            $customer     = $response['customer']     ?? [];

            // Filter to ensure uniqueness by bankName (preventing 2x Palmpay)
            $uniqueBanks = [];
            $filteredAccounts = [];
            foreach ($bankAccounts as $acct) {
                $bn = $acct['bankName'] ?? 'Unknown';
                if (!in_array($bn, $uniqueBanks)) {
                    $uniqueBanks[] = $bn;
                    $filteredAccounts[] = $acct;
                }
            }
            $bankAccounts = $filteredAccounts;

            // Persist the accounts so we don't call the API again
            foreach ($bankAccounts as $acct) {
                try {
                    $insertStmt = $this->db->prepare("
                        INSERT IGNORE INTO virtual_accounts
                            (user_id, bank_code, account_number, account_name, bank_name, reserved_account_id, provider_customer_id)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    ");
                    $insertStmt->execute([
                        $userId,
                        $acct['bankCode']             ?? '',
                        $acct['accountNumber']        ?? '',
                        $acct['accountName']          ?? '',
                        $acct['bankName']             ?? '',
                        $acct['Reserved_Account_Id']  ?? '',
                        $customer['customer_id']      ?? '',
                    ]);
                } catch (\PDOException $e) {
                    // Log but don't crash — the response is still valid
                    error_log('[PaymentController] Failed to persist virtual account: ' . $e->getMessage());
                }
            }

            return $this->json([
                'status'       => 'success',
                'bankAccounts' => $bankAccounts,
                'customer'     => $customer,
            ]);

        } catch (\Exception $e) {
            \BamzySMS\Core\Logger::error('VIRTUAL_ACCOUNT_CREATION_FAILED', $e->getMessage());
            
            if (str_contains($e->getMessage(), "Table") && str_contains($e->getMessage(), "doesn't exist")) {
                return $this->json([
                    'status'  => 'error', 
                    'message' => 'Virtual accounts table is missing. Please run migrations.',
                    'hint'    => 'Visit /api/admin/run-migrations to fix this.'
                ], 500);
            }
            
            return $this->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }
}
