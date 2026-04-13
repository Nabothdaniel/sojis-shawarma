<?php

namespace BamzySMS\Controllers;

use BamzySMS\Core\Controller;
use BamzySMS\Models\User;
use BamzySMS\Services\MailService;
use BamzySMS\Models\Verification;

class AuthController extends Controller {
    private $userModel;
    private $verificationModel;
    private $mailService;

    public function __construct() {
        $this->userModel = new User();
        $this->verificationModel = new Verification();
        $this->mailService = new MailService();
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

        // Send Email
        $subject = ($type === 'signup') ? "Verify your BamzySMS Account" : "Reset your BamzySMS Password";
        $body = "<h2>BamzySMS Verification</h2>
                 <p>Your OTP code is: <strong style='font-size: 24px;'>$otp</strong></p>
                 <p>This code will expire in 10 minutes.</p>";
        
        $sent = $this->mailService->send($email, $subject, $body);

        if (!$sent) {
            // Fallback for local testing if SMTP fails
            error_log("MAIL_SIMULATION: OTP for $email is $otp");
            return $this->json(['status' => 'success', 'message' => 'Verification code simulated (Check server logs)']);
        }

        return $this->json(['status' => 'success', 'message' => 'OTP sent to your email']);
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
            $token = \BamzySMS\Core\JwtHelper::generate([
                'id' => $user['id'],
                'email' => $user['email'],
                'role' => $user['role']
            ]);

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
            $userData = $this->userModel->findById($userId);
            
            $token = \BamzySMS\Core\JwtHelper::generate([
                'id' => $userData['id'],
                'email' => $userData['email'],
                'role' => $userData['role']
            ]);

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

    /**
     * GET /api/auth/me
     * Get current user via JWT
     */
    public function getMe() {
        $userId = \BamzySMS\Middleware\AuthMiddleware::handle();
        $user = $this->userModel->findById($userId);
        
        if (!$user) {
            return $this->json(['status' => 'error', 'message' => 'User not found'], 404);
        }

        return $this->json([
            'status' => 'success',
            'data' => $user
        ]);
    }
}
