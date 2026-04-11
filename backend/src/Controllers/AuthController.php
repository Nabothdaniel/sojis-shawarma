<?php

namespace BamzySMS\Controllers;

use BamzySMS\Core\Controller;
use BamzySMS\Models\User;
use BamzySMS\Core\EncryptionHelper;

class AuthController extends Controller {
    private $userModel;
    private $verificationModel;

    public function __construct() {
        $this->userModel = new User();
        $this->verificationModel = new \BamzySMS\Models\Verification();
    }

    public function sendOtp() {
        $data = $this->getPostData();
        $email = $data['email'] ?? '';
        $type = $data['type'] ?? 'signup';

        if (!$email) {
            return $this->json(['status' => 'error', 'message' => 'Email is required'], 400);
        }

        // Check if user exists for reset
        if ($type === 'reset' && !$this->userModel->findByEmail($email)) {
            return $this->json(['status' => 'error', 'message' => 'No account found with this email'], 404);
        }

        // Generate 6-digit OTP
        $otp = sprintf("%06d", mt_rand(1, 999999));
        
        // Store in DB
        $this->verificationModel->create($email, $otp, $type);

        // Simulation
        error_log("OTP for $email ($type): $otp");

        return $this->json(['status' => 'success', 'message' => 'OTP sent to email']);
    }

    public function verifyOtp() {
        $data = $this->getPostData();
        $email = $data['email'] ?? '';
        $otp = $data['otp'] ?? '';
        $type = $data['type'] ?? 'signup';

        if (!$email || !$otp) {
            return $this->json(['status' => 'error', 'message' => 'Email and OTP are required'], 400);
        }

        if ($this->verificationModel->verify($email, $otp, $type, $type === 'signup')) {
            return $this->json(['status' => 'success', 'message' => 'Verified successfully']);
        }

        return $this->json(['status' => 'error', 'message' => 'Invalid or expired OTP'], 400);
    }

    public function resetPassword() {
        $data = $this->getPostData();
        $email = $data['email'] ?? '';
        $otp = $data['otp'] ?? '';
        $password = $data['password'] ?? '';

        if (!$email || !$otp || !$password) {
            return $this->json(['status' => 'error', 'message' => 'All fields are required'], 400);
        }

        // We verify one last time (the verifyOtp call usually deletes the OTP, but we can assume the frontend verified it, 
        // however for security we should verify it again or use a temporary 'verified' token.
        // For simplicity here, let's just use verify() without deleting it in the model yet, or just trust the previous step.
        // Actually, let's modify the Verification model to optionally NOT delete on verify if needed, 
        // OR better: the frontend sends the OTP along with the password reset.
        
        if ($this->verificationModel->verify($email, $otp, 'reset')) {
            $this->userModel->updatePassword($email, $password);
            return $this->json(['status' => 'success', 'message' => 'Password reset successfully']);
        }

        return $this->json(['status' => 'error', 'message' => 'Invalid or expired verification session'], 400);
    }

    public function login() {
        $data = $this->getPostData();
        $email = $data['email'] ?? '';
        $password = $data['password'] ?? '';

        if (!$email || !$password) {
            return $this->json(['status' => 'error', 'message' => 'Email and password required'], 400);
        }

        $user = $this->userModel->findByEmail($email);

        if ($user && password_verify($password, $user['password'])) {
            $token = bin2hex(random_bytes(32));
            $this->userModel->updateToken($user['id'], $token);

            $userData = $this->userModel->findById($user['id']);
            return $this->json([
                'status' => 'success',
                'data' => [
                    'token' => $token,
                    'user' => $userData
                ]
            ]);
        }

        return $this->json(['status' => 'error', 'message' => 'Invalid credentials'], 401);
    }

    public function register() {
        $data = $this->getPostData();
        $required = ['name', 'email', 'phone', 'password'];

        foreach ($required as $field) {
            if (empty($data[$field])) {
                return $this->json(['status' => 'error', 'message' => "$field is required"], 400);
            }
        }

        if ($this->userModel->findByEmail($data['email'])) {
            return $this->json(['status' => 'error', 'message' => 'Email already exists'], 400);
        }

        try {
            $userId = $this->userModel->create($data);
            $token = bin2hex(random_bytes(32));
            $this->userModel->updateToken($userId, $token);

            $userData = $this->userModel->findById($userId);
            return $this->json([
                'status' => 'success',
                'data' => [
                    'token' => $token,
                    'user' => $userData
                ]
            ], 201);
        } catch (\Exception $e) {
            return $this->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }
}
