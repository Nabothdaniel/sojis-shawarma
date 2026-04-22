<?php

namespace BamzySMS\Controllers;

use BamzySMS\Core\Controller;
use BamzySMS\Models\User;
use BamzySMS\Middleware\AuthMiddleware;

class UserController extends Controller {
    private $userModel;
    private $verificationModel;

    public function __construct() {
        $this->userModel = new User();
        $this->verificationModel = new \BamzySMS\Models\Verification();
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

    public function getSecurityInfo() {
        $userId = AuthMiddleware::handle();
        $user = $this->userModel->findById($userId);
        
        if (!$user) return $this->json(['status' => 'error', 'message' => 'User not found'], 404);

        $verifications = $this->verificationModel->getRecentForUser($user['username']);

        return $this->json([
            'status' => 'success',
            'data' => [
                'recovery_key_saved' => (bool)$user['recovery_key_saved'],
                'has_recovery_key' => (bool)$user['has_recovery_key'],
                'whatsapp_notifications' => (bool)$user['whatsapp_notifications'],
                'whatsapp_number' => $user['whatsapp_number'],
                'recent_verifications' => $verifications
            ]
        ]);
    }

    public function updateSecuritySettings() {
        $userId = AuthMiddleware::handle();
        $data = $this->getPostData();

        $whatsappNotifications = isset($data['whatsapp_notifications']) ? (bool)$data['whatsapp_notifications'] : false;
        $whatsappNumber = isset($data['whatsapp_number']) ? trim((string)$data['whatsapp_number']) : null;

        if ($whatsappNotifications && $whatsappNumber === '') {
            return $this->json([
                'status' => 'error',
                'message' => 'WhatsApp number is required when notifications are enabled'
            ], 400);
        }

        if ($this->userModel->updateWhatsappSettings($userId, $whatsappNotifications, $whatsappNumber)) {
            return $this->json([
                'status' => 'success',
                'message' => 'Security settings updated',
                'data' => [
                    'whatsapp_notifications' => $whatsappNotifications,
                    'whatsapp_number' => $whatsappNotifications ? $whatsappNumber : null,
                ]
            ]);
        }

        return $this->json(['status' => 'error', 'message' => 'Failed to update security settings'], 500);
    }

    public function confirmRecoveryKeySaved() {
        $userId = AuthMiddleware::handle();
        if ($this->userModel->markKeyAsSaved($userId)) {
            return $this->json(['status' => 'success', 'message' => 'Recovery key marked as saved']);
        }
        return $this->json(['status' => 'error', 'message' => 'Failed to update recovery key status'], 500);
    }

    public function regenerateRecoveryKey() {
        $userId = AuthMiddleware::handle();
        $data = $this->getPostData();
        $pin = $data['pin'] ?? '';

        if (!$this->userModel->verifyPin($userId, $pin)) {
            return $this->json(['status' => 'error', 'message' => 'Invalid transaction PIN'], 401);
        }

        $key = $this->userModel->regenerateRecoveryKey($userId);
        if ($key) {
            $encryptionKey = env_or_default('PLATFORM_ENCRYPTION_KEY', 'BAMZY-DEFAULT-KEY-2026');
            $maskedKey = \BamzySMS\Core\EncryptionHelper::encrypt($key, $encryptionKey);

            return $this->json([
                'status' => 'success', 
                'data' => ['recovery_key' => $maskedKey],
                'message' => 'New recovery key generated successfully.'
            ]);
        }
        
        return $this->json(['status' => 'error', 'message' => 'Failed to regenerate recovery key'], 500);
    }

    public function revealRecoveryKey() {
        $userId = AuthMiddleware::handle();
        $data = $this->getPostData();
        $pin = $data['pin'] ?? '';

        if (!$this->userModel->verifyPin($userId, $pin)) {
            return $this->json(['status' => 'error', 'message' => 'Invalid transaction PIN'], 401);
        }

        $key = $this->userModel->getRecoveryKey($userId);
        if ($key) {
            $encryptionKey = env_or_default('PLATFORM_ENCRYPTION_KEY', 'BAMZY-DEFAULT-KEY-2026');
            $maskedKey = \BamzySMS\Core\EncryptionHelper::encrypt($key, $encryptionKey);

            return $this->json([
                'status' => 'success', 
                'data' => ['recovery_key' => $maskedKey]
            ]);
        }
        
        return $this->json(['status' => 'error', 'message' => 'No recovery key found or legacy key requires regeneration.'], 404);
    }
}
