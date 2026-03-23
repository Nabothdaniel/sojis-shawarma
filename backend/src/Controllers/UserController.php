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
}
