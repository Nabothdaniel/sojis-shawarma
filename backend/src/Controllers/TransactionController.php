<?php

namespace BamzySMS\Controllers;

use BamzySMS\Core\Controller;
use BamzySMS\Models\Transaction;
use BamzySMS\Middleware\AuthMiddleware;

class TransactionController extends Controller {
    private $transactionModel;

    public function __construct() {
        $this->transactionModel = new Transaction();
    }

    public function purchase() {
        $userId = AuthMiddleware::handle();
        $data = $this->getPostData();
        
        $amount = (float)($data['amount'] ?? 0);
        $description = $data['description'] ?? 'Service purchase';

        if ($amount <= 0) {
            return $this->json(['status' => 'error', 'message' => 'Invalid amount'], 400);
        }

        try {
            $this->transactionModel->create($userId, $amount, 'debit', $description);
            return $this->json(['status' => 'success', 'message' => 'Purchase successful']);
        } catch (\Exception $e) {
            return $this->json(['status' => 'error', 'message' => 'Transaction failed: ' . $e->getMessage()], 500);
        }
    }

    public function getHistory() {
        $userId = AuthMiddleware::handle();
        $history = $this->transactionModel->getByUser($userId);
        return $this->json(['status' => 'success', 'data' => $history]);
    }
}
