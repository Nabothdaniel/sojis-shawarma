<?php

namespace BamzySMS\Controllers;

use BamzySMS\Middleware\AuthMiddleware;

class AdminUserController extends AdminBaseController {

    /**
     * GET /api/admin/users
     */
    public function getAllUsers() {
        $userId = AuthMiddleware::handle();
        $this->checkAdmin($userId);
        
        $users = $this->userModel->getAllUsers();
        return $this->json(['status' => 'success', 'data' => $users]);
    }

    /**
     * POST /api/admin/users
     */
    public function createUser() {
        $adminUserId = AuthMiddleware::handle();
        $this->checkAdmin($adminUserId);

        $data = $this->getPostData();
        $name = trim((string)($data['name'] ?? ''));
        $username = strtolower(trim((string)($data['username'] ?? '')));
        $phone = trim((string)($data['phone'] ?? ''));
        $password = (string)($data['password'] ?? '');
        $role = ($data['role'] ?? 'user') === 'admin' ? 'admin' : 'user';
        $balance = max(0, (float)($data['balance'] ?? 0));

        if (!$name || !$username || !$password) {
            return $this->json(['status' => 'error', 'message' => 'Name, username and password are required.'], 400);
        }
        if (strlen($password) < 6) {
            return $this->json(['status' => 'error', 'message' => 'Password must be at least 6 characters.'], 400);
        }

        try {
            $stmt = $this->db->prepare("
                INSERT INTO users (name, username, phone, password, role, balance, referral_code)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $name,
                $username,
                $phone ?: null,
                password_hash($password, PASSWORD_DEFAULT),
                $role,
                $balance,
                'BAMZY' . strtoupper(substr(uniqid(), -6))
            ]);

            $newUserId = (int)$this->db->lastInsertId();
            if ($balance > 0) {
                $this->transactionModel->create($newUserId, $balance, 'credit', "Admin Initial Funding");
            }

            return $this->json([
                'status' => 'success',
                'message' => 'User created successfully.',
                'data' => $this->userModel->findById($newUserId)
            ]);
        } catch (\PDOException $e) {
            $isDup = ($e->getCode() === '23000');
            return $this->json([
                'status' => 'error',
                'message' => $isDup ? 'Username already exists.' : 'Failed to create user.'
            ], $isDup ? 409 : 500);
        }
    }

    /**
     * PUT /api/admin/users
     */
    public function updateUser() {
        $adminUserId = AuthMiddleware::handle();
        $admin = $this->checkAdmin($adminUserId);

        $data = $this->getPostData();
        $targetUserId = (int)($data['userId'] ?? 0);
        $name = trim((string)($data['name'] ?? ''));
        $phone = trim((string)($data['phone'] ?? ''));
        $role = ($data['role'] ?? 'user') === 'admin' ? 'admin' : 'user';
        $password = (string)($data['password'] ?? '');

        if (!$targetUserId || !$name) {
            return $this->json(['status' => 'error', 'message' => 'userId and name are required.'], 400);
        }

        $targetUser = $this->userModel->findById($targetUserId);
        if (!$targetUser) {
            return $this->json(['status' => 'error', 'message' => 'User not found.'], 404);
        }
        if ((int)$targetUserId === (int)$adminUserId && $role !== 'admin') {
            return $this->json(['status' => 'error', 'message' => 'You cannot demote your own admin account.'], 400);
        }
        if ($password !== '' && strlen($password) < 6) {
            return $this->json(['status' => 'error', 'message' => 'Password must be at least 6 characters.'], 400);
        }

        try {
            if ($password !== '') {
                $stmt = $this->db->prepare("
                    UPDATE users SET name = ?, phone = ?, role = ?, password = ? WHERE id = ?
                ");
                $stmt->execute([$name, $phone ?: null, $role, password_hash($password, PASSWORD_DEFAULT), $targetUserId]);
            } else {
                $stmt = $this->db->prepare("
                    UPDATE users SET name = ?, phone = ?, role = ? WHERE id = ?
                ");
                $stmt->execute([$name, $phone ?: null, $role, $targetUserId]);
            }

            return $this->json([
                'status' => 'success',
                'message' => 'User updated successfully.',
                'data' => $this->userModel->findById($targetUserId)
            ]);
        } catch (\Throwable $e) {
            return $this->json(['status' => 'error', 'message' => 'Failed to update user.'], 500);
        }
    }

    /**
     * DELETE /api/admin/users
     */
    public function deleteUser() {
        $adminUserId = AuthMiddleware::handle();
        $this->checkAdmin($adminUserId);

        $targetUserId = (int)($_GET['userId'] ?? 0);
        if (!$targetUserId) {
            return $this->json(['status' => 'error', 'message' => 'userId is required.'], 400);
        }
        if ($targetUserId === (int)$adminUserId) {
            return $this->json(['status' => 'error', 'message' => 'You cannot delete your own account.'], 400);
        }

        $targetUser = $this->userModel->findById($targetUserId);
        if (!$targetUser) {
            return $this->json(['status' => 'error', 'message' => 'User not found.'], 404);
        }

        $stmt = $this->db->prepare("DELETE FROM users WHERE id = ?");
        $stmt->execute([$targetUserId]);

        return $this->json(['status' => 'success', 'message' => 'User deleted successfully.']);
    }

    /**
     * POST /api/admin/user/topup
     */
    public function topUpUserBalance() {
        $adminUserId = AuthMiddleware::handle();
        $this->checkAdmin($adminUserId);

        $data = $this->getPostData();
        $targetUserId = (int)($data['userId'] ?? 0);
        $amount = (float)($data['amount'] ?? 0);
        $type = ($data['type'] ?? 'credit') === 'debit' ? 'debit' : 'credit';
        $note = trim((string)($data['note'] ?? ''));

        if (!$targetUserId || $amount <= 0) {
            return $this->json(['status' => 'error', 'message' => 'Valid userId and amount are required.'], 400);
        }

        $targetUser = $this->userModel->findById($targetUserId);
        if (!$targetUser) {
            return $this->json(['status' => 'error', 'message' => 'User not found.'], 404);
        }

        $oldBalance = (float)$targetUser['balance'];
        $newBalance = $type === 'credit' ? $oldBalance + $amount : $oldBalance - $amount;
        if ($newBalance < 0) {
            return $this->json(['status' => 'error', 'message' => 'Insufficient user balance for debit.'], 400);
        }

        $this->userModel->updateBalance($targetUserId, $newBalance);
        $desc = $type === 'credit'
            ? "Admin Top-up: +₦{$amount}" . ($note ? " ({$note})" : '')
            : "Admin Debit: -₦{$amount}" . ($note ? " ({$note})" : '');
        $this->transactionModel->create($targetUserId, $amount, $type, $desc);

        // Log real-time event
        $this->eventModel->log($targetUserId, 'balance_updated', [
            'new_balance' => $newBalance,
            'message'     => $type === 'credit' ? "Account Credited: +₦$amount" : "Account Debited: -₦$amount"
        ]);

        return $this->json([
            'status' => 'success',
            'message' => $type === 'credit' ? 'Balance topped up successfully.' : 'Balance debited successfully.',
            'data' => [
                'oldBalance' => $oldBalance,
                'newBalance' => $newBalance
            ]
        ]);
    }

    /**
     * POST /api/admin/user/balance
     */
    public function updateUserBalance() {
        $userId = AuthMiddleware::handle();
        $this->checkAdmin($userId);
        
        $data = $this->getPostData();
        $targetUserId = (int)($data['userId'] ?? 0);
        $newBalance   = (float)($data['balance'] ?? 0);

        if (!$targetUserId) {
            return $this->json(['status' => 'error', 'message' => 'User ID required.'], 400);
        }

        $targetUser = $this->userModel->findById($targetUserId);
        if (!$targetUser) {
            return $this->json(['status' => 'error', 'message' => 'User not found.'], 404);
        }

        $oldBalance = (float)$targetUser['balance'];
        if ($this->userModel->updateBalance($targetUserId, $newBalance)) {
            // Log transaction
            $diff = $newBalance - $oldBalance;
            $desc = "Admin Adjustment: Set from ₦$oldBalance to ₦$newBalance";
            $this->transactionModel->create($targetUserId, abs($diff), $diff >= 0 ? 'credit' : 'debit', $desc);

            // Log real-time event
            $this->eventModel->log($targetUserId, 'balance_updated', [
                'new_balance' => $newBalance,
                'message'     => "Balance Adjusted by Admin to ₦$newBalance"
            ]);

            return $this->json(['status' => 'success', 'message' => 'Balance updated.']);
        }

        return $this->json(['status' => 'error', 'message' => 'Failed to update balance.'], 500);
    }

    /**
     * GET /api/admin/promote-me
     * Temporary route to promote current user to admin.
     */
    /**
     * GET /api/admin/transactions
     * Returns all transactions from all users, most recent first.
     */
    public function getAllTransactions() {
        $adminId = AuthMiddleware::handle();
        $this->checkAdmin($adminId);

        $stmt = $this->db->prepare("
            SELECT t.*, u.name as user_name, u.username as user_username
            FROM transactions t
            JOIN users u ON t.user_id = u.id
            ORDER BY t.created_at DESC
            LIMIT 500
        ");
        $stmt->execute();
        $transactions = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        return $this->json([
            'status' => 'success',
            'data' => $transactions
        ]);
    }

    public function promoteToAdmin() {
        $userId = AuthMiddleware::handle();
        if (!$userId) return $this->json(['status' => 'error', 'message' => 'Not logged in'], 401);

        $stmt = $this->db->prepare("UPDATE users SET role = 'admin' WHERE id = ?");
        $stmt->execute([$userId]);

        return $this->json(['status' => 'success', 'message' => 'Account promoted to Admin. Please refresh the page.']);
    }

    /**
     * POST /api/admin/user/reset-password
     */
    public function sudoResetPassword() {
        $adminId = AuthMiddleware::handle();
        $this->checkAdmin($adminId);

        $data = $this->getPostData();
        $targetUserId = (int)($data['userId'] ?? 0);
        $newPassword = (string)($data['password'] ?? '');

        if (!$targetUserId || strlen($newPassword) < 6) {
            return $this->json(['status' => 'error', 'message' => 'Valid User ID and password (min 6 chars) required.'], 400);
        }

        $targetUser = $this->userModel->findById($targetUserId);
        if (!$targetUser) {
            return $this->json(['status' => 'error', 'message' => 'User not found.'], 404);
        }

        $this->userModel->updatePassword($targetUser['username'], $newPassword);

        // Log the action
        error_log("ADMIN_ACTION: Admin $adminId manually reset password for User $targetUserId ({$targetUser['username']})");

        // Notify user via system event
        $this->eventModel->log($targetUserId, 'security_alert', [
            'message' => 'Your password was reset by an administrator.',
            'timestamp' => date('Y-m-d H:i:s')
        ]);

        return $this->json(['status' => 'success', 'message' => "Password for {$targetUser['username']} has been reset successfully."]);
    }
}
