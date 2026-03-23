<?php

namespace BamzySMS\Controllers;

use BamzySMS\Core\Controller;
use BamzySMS\Models\SMSPurchase;
use BamzySMS\Models\Service;
use BamzySMS\Models\User;
use BamzySMS\Models\Transaction;
use BamzySMS\Middleware\AuthMiddleware;

class SMSController extends Controller {
    private $purchaseModel;
    private $serviceModel;
    private $userModel;
    private $transactionModel;

    public function __construct() {
        $this->purchaseModel = new SMSPurchase();
        $this->serviceModel = new Service();
        $this->userModel = new User();
        $this->transactionModel = new Transaction();
    }

    public function buy() {
        $userId = AuthMiddleware::handle();
        $data = $this->getPostData();
        
        $serviceId = (int)($data['serviceId'] ?? 0);
        $service = $this->serviceModel->findById($serviceId);

        if (!$service) {
            return $this->json(['status' => 'error', 'message' => 'Service not found'], 404);
        }

        $price = (float)$service['price'];
        $user = $this->userModel->findById($userId);

        if ($user['balance'] < $price) {
            return $this->json(['status' => 'error', 'message' => 'Insufficient balance. Please recharge your wallet.'], 400);
        }

        try {
            // 1. Deduct Balance
            if (!$this->userModel->deductBalance($userId, $price)) {
                throw new \Exception("Failed to deduct balance");
            }

            // 2. Create Transaction Log
            $this->transactionModel->create($userId, $price, 'debit', "Purchase: " . $service['name'] . " (" . $service['country'] . ")");

            // 3. Create SMS Purchase Record
            // For now, we generate a mock phone number. In a real app, this comes from an SMS provider API.
            $mockPhone = "+" . ($service['country'] === 'Nigeria' ? '234' : '1') . rand(700000000, 999999999);
            $this->purchaseModel->create($userId, $serviceId, $mockPhone);

            return $this->json([
                'status' => 'success', 
                'message' => 'Purchase successful!',
                'data' => [
                    'phone_number' => $mockPhone,
                    'new_balance' => $user['balance'] - $price
                ]
            ]);
        } catch (\Exception $e) {
            return $this->json(['status' => 'error', 'message' => 'Transaction failed: ' . $e->getMessage()], 500);
        }
    }

    public function getPurchases() {
        $userId = AuthMiddleware::handle();
        $purchases = $this->purchaseModel->getByUser($userId);
        return $this->json(['status' => 'success', 'data' => $purchases]);
    }
}
