<?php

namespace BamzySMS\Controllers;

use BamzySMS\Core\Controller;
use BamzySMS\Models\User;
use BamzySMS\Middleware\AuthMiddleware;

class UserController extends Controller {
    private $userModel;

    public function __construct() {
        $this->userModel = new User();
    }

    public function getProfile() {
        $userId = AuthMiddleware::handle();
        $user = $this->userModel->findById($userId);
        
        if ($user) {
            $user['hasPin'] = $this->userModel->hasPin($userId);
            return $this->json(['status' => 'success', 'data' => $user]);
        }
        
        return $this->json(['status' => 'error', 'message' => 'User not found'], 404);
    }

    public function getBalance() {
        $userId = AuthMiddleware::handle();
        $user = $this->userModel->findById($userId);
        
        if ($user) {
            return $this->json([
                'status' => 'success',
                'data' => [
                    'balance' => $user['balance'],
                    'smsUnits' => $user['smsUnits']
                ]
            ]);
        }
        
        return $this->json(['status' => 'error', 'message' => 'User not found'], 404);
    }
    public function updatePin() {
        $userId = AuthMiddleware::handle();
        $rawData = json_decode(file_get_contents('php://input'), true);
        $data = $this->getPostData();
        $pin = $data['pin'] ?? '';

        // Diagnostic logging
        $rawPin = $rawData['pin'] ?? 'MISSING';
        error_log("[DIAG] PIN Setup - User: $userId, Raw Length: " . strlen($rawPin) . ", Decrypted: " . (is_string($pin) ? $pin : 'FAILED'));

        if (!preg_match('/^\d{4}$/', $pin)) {
            $msg = is_string($pin) && strlen($pin) > 0 ? "PIN must be 4 digits (received " . strlen($pin) . " chars)" : "PIN must be exactly 4 digits";
            return $this->json(['status' => 'error', 'message' => $msg], 400);
        }

        if ($this->userModel->updatePin($userId, $pin)) {
            return $this->json(['status' => 'success', 'message' => 'PIN updated successfully']);
        }

        return $this->json(['status' => 'error', 'message' => 'Failed to update PIN in database'], 500);
    }
    public function verifyPin() {
        $userId = AuthMiddleware::handle();
        $data = $this->getPostData();
        $pin = $data['pin'] ?? '';

        if ($this->userModel->verifyPin($userId, $pin)) {
            return $this->json(['status' => 'success', 'message' => 'PIN verified']);
        }

        return $this->json(['status' => 'error', 'message' => 'Invalid transaction PIN'], 401);
    }
}
