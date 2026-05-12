<?php

require_once __DIR__ . '/../Support/Auth.php';
require_once __DIR__ . '/../Support/EventStream.php';

class OrdersController {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    public function health() {
        return json_encode([
            'status' => 'success',
            'message' => "Soji's Shawarma API is running"
        ]);
    }

    public function create() {
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data) {
            header("HTTP/1.1 400 Bad Request");
            return json_encode(['message' => 'Invalid order payload']);
        }

        // Sanitize inputs
        $customerName = isset($data['customer_name']) ? htmlspecialchars(strip_tags(trim($data['customer_name']))) : null;
        $customerPhone = isset($data['customer_phone']) ? htmlspecialchars(strip_tags(trim($data['customer_phone']))) : null;
        $orderType = strtolower(trim((string) ($data['order_type'] ?? 'delivery')));
        if (!in_array($orderType, ['delivery', 'pickup'], true)) {
            $orderType = 'delivery';
        }

        $deliveryAddress = isset($data['delivery_address']) ? htmlspecialchars(strip_tags(trim($data['delivery_address']))) : 'Pickup';
        $notes = isset($data['notes']) ? htmlspecialchars(strip_tags(trim($data['notes']))) : (isset($data['note']) ? htmlspecialchars(strip_tags(trim($data['note']))) : '');
        $paymentMethod = strtolower(trim((string) ($data['payment_method'] ?? 'bank_transfer')));
        if (!in_array($paymentMethod, ['bank_transfer', 'cash_on_pickup'], true)) {
            $paymentMethod = 'bank_transfer';
        }
        $pickupTime = trim((string) ($data['pickup_time'] ?? ''));
        $paymentReference = trim((string) ($data['payment_reference'] ?? ''));
        
        $items = $data['items'] ?? [];
        $subtotal = (float) ($data['subtotal'] ?? $data['total_amount'] ?? $data['total'] ?? 0);
        $deliveryFee = (float) ($data['delivery_fee'] ?? 0);
        if ($orderType === 'pickup') {
            $deliveryFee = 0;
            $deliveryAddress = $pickupTime !== '' ? 'Pickup order' : 'Pickup';
        }
        $total = (float) ($data['total_amount'] ?? $data['total'] ?? ($subtotal + $deliveryFee));

        // Backend Validation
        if (empty($customerName)) {
            header("HTTP/1.1 422 Unprocessable Entity");
            return json_encode(['message' => 'Customer name is required']);
        }
        if (empty($customerPhone) || !preg_match('/^\+?[\d\s-]{10,}$/', $customerPhone)) {
            header("HTTP/1.1 422 Unprocessable Entity");
            return json_encode(['message' => 'A valid phone number is required']);
        }
        if (empty($items)) {
            header("HTTP/1.1 422 Unprocessable Entity");
            return json_encode(['message' => 'Order items are required']);
        }

        if ($orderType === 'pickup' && $pickupTime === '') {
            header("HTTP/1.1 422 Unprocessable Entity");
            return json_encode(['message' => 'Pickup time is required for pickup orders']);
        }

        try {
            $currentUser = $this->getCurrentUser();
            $stmt = $this->db->prepare("
                INSERT INTO orders (
                    order_ref, session_id, user_id, customer_name, customer_phone, items,
                    subtotal, delivery_fee, total, total_amount, status, payment_status,
                    order_type, payment_method, pickup_time, payment_reference,
                    delivery_address, lat, lng, notes
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");

            $stmt->execute([
                null,
                $data['session_id'] ?? null,
                ($currentUser && ($currentUser['type'] ?? 'user') === 'user') ? (int) $currentUser['id'] : null,
                $customerName,
                $customerPhone,
                json_encode($items),
                $subtotal,
                $deliveryFee,
                $total,
                $total,
                'pending',
                'pending',
                $orderType,
                $paymentMethod,
                $pickupTime !== '' ? $pickupTime : null,
                $paymentReference !== '' ? $paymentReference : null,
                $deliveryAddress,
                (float) ($data['lat'] ?? 0),
                (float) ($data['lng'] ?? 0),
                $notes
            ]);

            $orderId = (int) $this->db->lastInsertId();
            $orderRef = sprintf('SJI-%s-%04d', date('Ymd'), $orderId);

            $update = $this->db->prepare("UPDATE orders SET order_ref = ? WHERE id = ?");
            $update->execute([$orderRef, $orderId]);

            $freshOrder = $this->getOrderRecord($orderId);
            if ($freshOrder) {
                $this->publishOrderEvent(
                    'order_created',
                    $freshOrder,
                    [
                        'message' => 'Your order has been received and is awaiting payment review.',
                    ]
                );
            }

            $this->incrementSessionOrderCount($data['session_id'] ?? null);
            $this->sendTelegramNotification($orderRef, [
                'name' => $customerName,
                'phone' => $customerPhone,
                'address' => $deliveryAddress,
                'items' => $items,
                'total' => $total,
                'order_type' => $orderType,
                'pickup_time' => $pickupTime,
                'payment_method' => $paymentMethod,
            ]);
            $this->sendOrderWhatsAppNotification(
                $orderId,
                'order_created',
                $customerPhone,
                $paymentMethod === 'cash_on_pickup'
                    ? "Hi {$customerName}, your {$orderType} order {$orderRef} has been received. The admin will review it and notify you before pickup."
                    : "Hi {$customerName}, your {$orderType} order {$orderRef} has been received. Send payment and upload your receipt so the admin can review it."
            );

            header("HTTP/1.1 201 Created");
            return json_encode([
                'status' => 'success',
                'message' => 'Order created successfully',
                'data' => [
                    'id' => $orderId,
                    'order_ref' => $orderRef,
                ]
            ]);
        } catch (PDOException $e) {
            header("HTTP/1.1 500 Internal Server Error");
            return json_encode(['message' => 'Failed to create order', 'error' => $e->getMessage()]);
        }
    }

    public function confirmPayment($id) {
        $currentUser = $this->getCurrentUser();
        if (!$currentUser) {
            header("HTTP/1.1 401 Unauthorized");
            return json_encode(['message' => 'Please sign in to confirm your order payment']);
        }

        $order = $this->getOrderRecord((int) $id);
        if (!$order) {
            header("HTTP/1.1 404 Not Found");
            return json_encode(['message' => 'Order not found']);
        }

        $isAdmin = ($currentUser['role'] ?? 'user') === 'admin';
        $isOwner = ($currentUser['type'] ?? 'user') === 'user' && (int) ($order['user_id'] ?? 0) === (int) $currentUser['id'];
        if (!$isAdmin && !$isOwner) {
            header("HTTP/1.1 403 Forbidden");
            return json_encode(['message' => 'You can only submit payment for your own orders']);
        }

        if (!isset($_FILES['receipt'])) {
            header("HTTP/1.1 400 Bad Request");
            $error = 'Receipt file is required';
            if (isset($_SERVER['CONTENT_LENGTH']) && (int)$_SERVER['CONTENT_LENGTH'] > (int)ini_get('post_max_size') * 1024 * 1024) {
                $error = 'File too large. Maximum size is ' . ini_get('post_max_size');
            }
            return json_encode(['message' => $error, 'error' => $error]);
        }

        if ($_FILES['receipt']['error'] !== UPLOAD_ERR_OK) {
            header("HTTP/1.1 400 Bad Request");
            $errors = [
                UPLOAD_ERR_INI_SIZE => 'File exceeds upload_max_filesize',
                UPLOAD_ERR_FORM_SIZE => 'File exceeds MAX_FILE_SIZE',
                UPLOAD_ERR_PARTIAL => 'File was only partially uploaded',
                UPLOAD_ERR_NO_FILE => 'No file was uploaded',
                UPLOAD_ERR_NO_TMP_DIR => 'Missing temporary folder',
                UPLOAD_ERR_CANT_WRITE => 'Failed to write file to disk',
                UPLOAD_ERR_EXTENSION => 'A PHP extension stopped the file upload'
            ];
            $error = $errors[$_FILES['receipt']['error']] ?? 'Unknown upload error';
            return json_encode(['message' => $error, 'error' => $error]);
        }

        $uploadDir = __DIR__ . '/../../storage/receipts';
        if (!is_dir($uploadDir)) {
            if (!mkdir($uploadDir, 0777, true)) {
                header("HTTP/1.1 500 Internal Server Error");
                return json_encode(['message' => 'Failed to create upload directory']);
            }
        }

        $extension = pathinfo($_FILES['receipt']['name'], PATHINFO_EXTENSION) ?: 'jpg';
        $filename = sprintf('order-%d-%s.%s', $id, uniqid(), $extension);
        $targetPath = $uploadDir . '/' . $filename;

        if (!move_uploaded_file($_FILES['receipt']['tmp_name'], $targetPath)) {
            header("HTTP/1.1 500 Internal Server Error");
            return json_encode(['message' => 'Failed to save receipt to ' . $targetPath]);
        }

        $paymentReference = trim((string) ($_POST['payment_reference'] ?? ''));
        $stmt = $this->db->prepare("UPDATE orders SET payment_status = ?, receipt_path = ?, payment_reference = ?, payment_submitted_at = CURRENT_TIMESTAMP WHERE id = ?");
        $stmt->execute(['submitted', $filename, $paymentReference !== '' ? $paymentReference : null, $id]);

        $freshOrder = $this->getOrderRecord((int) $id);
        if ($freshOrder) {
            $customerName = (string) ($freshOrder['customer_name'] ?? 'Customer');
            $orderRef = (string) ($freshOrder['order_ref'] ?? sprintf('SJI-%s-%04d', date('Ymd'), $id));
            $customerPhone = (string) ($freshOrder['customer_phone'] ?? '');
            $this->publishOrderEvent(
                'payment_receipt_submitted',
                $freshOrder,
                [
                    'message' => 'Your payment proof has been received and is being reviewed by the admin.',
                ]
            );
            $this->sendOrderWhatsAppNotification(
                (int) $id,
                'payment_submitted',
                $customerPhone,
                "Hi {$customerName}, we have received your payment proof for order {$orderRef}. The admin is reviewing it now."
            );
        }

        return json_encode([
            'status' => 'success',
            'message' => 'Payment proof submitted successfully',
            'data' => ['receipt_path' => $filename]
        ]);
    }

    public function reviewPayment($id) {
        $currentUser = $this->getCurrentUser();
        if (!$currentUser || ($currentUser['role'] ?? 'user') !== 'admin') {
            header("HTTP/1.1 401 Unauthorized");
            return json_encode(['message' => 'Admin access required']);
        }

        $order = $this->getOrderRecord((int) $id);
        if (!$order) {
            header("HTTP/1.1 404 Not Found");
            return json_encode(['message' => 'Order not found']);
        }

        $data = json_decode(file_get_contents('php://input'), true) ?: [];
        $action = strtolower(trim((string) ($data['action'] ?? '')));
        $adminNote = trim((string) ($data['admin_note'] ?? ''));

        if (!in_array($action, ['confirm', 'reject'], true)) {
            header("HTTP/1.1 422 Unprocessable Entity");
            return json_encode(['message' => 'Payment review action must be confirm or reject']);
        }

        $paymentStatus = $action === 'confirm' ? 'confirmed' : 'rejected';
        $nextStatus = $action === 'confirm'
            ? (($order['order_type'] ?? 'delivery') === 'pickup' ? 'confirmed' : 'confirmed')
            : 'pending';

        $stmt = $this->db->prepare("
            UPDATE orders
            SET payment_status = ?, status = ?, admin_note = ?, payment_reviewed_at = CURRENT_TIMESTAMP, payment_reviewed_by = ?
            WHERE id = ?
        ");
        $stmt->execute([$paymentStatus, $nextStatus, $adminNote !== '' ? $adminNote : null, (int) $currentUser['id'], $id]);

        $freshOrder = $this->getOrderRecord((int) $id);
        if ($freshOrder) {
            $message = $action === 'confirm'
                ? 'Your payment has been confirmed by the admin.'
                : 'Your payment proof was rejected. Please review the admin note and submit again.';

            $this->publishOrderEvent('payment_reviewed', $freshOrder, ['message' => $message]);
            $this->sendOrderWhatsAppNotification(
                (int) $id,
                "payment_{$paymentStatus}",
                (string) ($freshOrder['customer_phone'] ?? ''),
                $action === 'confirm'
                    ? "Hi {$freshOrder['customer_name']}, your payment for order {$freshOrder['order_ref']} has been confirmed."
                    : "Hi {$freshOrder['customer_name']}, your payment for order {$freshOrder['order_ref']} was not approved yet. Please check the order note and resubmit."
            );
        }

        return json_encode([
            'status' => 'success',
            'message' => $action === 'confirm' ? 'Payment confirmed' : 'Payment rejected',
        ]);
    }

    public function getAll() {
        $status = $_GET['status'] ?? null;
        $currentUser = $this->getCurrentUser();

        if ($currentUser && ($currentUser['role'] ?? 'user') === 'admin') {
            if ($status) {
                $stmt = $this->db->prepare("SELECT * FROM orders WHERE status = ? ORDER BY updated_at DESC, created_at DESC");
                $stmt->execute([$status]);
            } else {
                $stmt = $this->db->query("SELECT * FROM orders ORDER BY updated_at DESC, created_at DESC");
            }
        } elseif ($currentUser && ($currentUser['type'] ?? 'user') === 'user') {
            $this->attachGuestOrdersToUser((int) $currentUser['id']);
            if ($status) {
                $stmt = $this->db->prepare("SELECT * FROM orders WHERE user_id = ? AND status = ? ORDER BY updated_at DESC, created_at DESC");
                $stmt->execute([$currentUser['id'], $status]);
            } else {
                $stmt = $this->db->prepare("SELECT * FROM orders WHERE user_id = ? ORDER BY updated_at DESC, created_at DESC");
                $stmt->execute([$currentUser['id']]);
            }
        } else {
            return json_encode([
                'status' => 'success',
                'data' => [],
            ]);
        }

        $orders = array_map([$this, 'normalizeOrder'], $stmt->fetchAll(PDO::FETCH_ASSOC));

        return json_encode([
            'status' => 'success',
            'data' => $orders,
        ]);
    }

    public function getOne($id) {
        $currentUser = $this->getCurrentUser();

        $stmt = $this->db->prepare("SELECT * FROM orders WHERE id = ?");
        $stmt->execute([$id]);
        $order = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$order) {
            header("HTTP/1.1 404 Not Found");
            return json_encode(['message' => 'Order not found']);
        }

        if (!$currentUser) {
            header("HTTP/1.1 401 Unauthorized");
            return json_encode(['message' => 'Authentication required']);
        }

        $isAdmin = ($currentUser['role'] ?? 'user') === 'admin';
        $isOwner = ($currentUser['type'] ?? 'user') === 'user' && (int) ($order['user_id'] ?? 0) === (int) $currentUser['id'];
        if (!$isAdmin && !$isOwner) {
            header("HTTP/1.1 403 Forbidden");
            return json_encode(['message' => 'You do not have access to this order']);
        }

        return json_encode([
            'status' => 'success',
            'data' => $this->normalizeOrder($order),
        ]);
    }

    public function updateStatus($id) {
        $currentUser = $this->getCurrentUser();
        if (!$currentUser || ($currentUser['role'] ?? 'user') !== 'admin') {
            header("HTTP/1.1 401 Unauthorized");
            return json_encode(['message' => 'Admin access required']);
        }

        $data = json_decode(file_get_contents('php://input'), true);
        $status = $data['status'] ?? null;
        $allowed = ['pending', 'confirmed', 'preparing', 'ready_for_pickup', 'dispatched', 'delivered', 'cancelled'];

        if (!$status || !in_array($status, $allowed, true)) {
            header("HTTP/1.1 422 Unprocessable Entity");
            return json_encode(['message' => 'Invalid order status']);
        }

        $order = $this->getOrderRecord((int) $id);
        if (!$order) {
            header("HTTP/1.1 404 Not Found");
            return json_encode(['message' => 'Order not found']);
        }

        $paymentStatus = (string) ($order['payment_status'] ?? 'pending');
        $paymentMethod = (string) ($order['payment_method'] ?? 'bank_transfer');

        if (
            $paymentMethod !== 'cash_on_pickup' &&
            in_array($status, ['confirmed', 'preparing', 'ready_for_pickup', 'dispatched', 'delivered'], true) &&
            $paymentStatus !== 'confirmed'
        ) {
            header("HTTP/1.1 422 Unprocessable Entity");
            return json_encode(['message' => 'Confirm payment before moving this order forward']);
        }

        $stmt = $this->db->prepare("UPDATE orders SET status = ? WHERE id = ?");
        $stmt->execute([$status, $id]);

        $order = $this->getOrderRecord((int) $id);
        if ($order) {
            $this->publishOrderEvent(
                'order_status_changed',
                $order,
                [
                    'message' => $this->getStatusNotificationCopy($status),
                ]
            );
            $this->notifyUserForStatusChange($order, $status);
        }

        return json_encode([
            'status' => 'success',
            'message' => 'Order status updated',
        ]);
    }

    private function normalizeOrder(array $order): array {
        $items = json_decode($order['items'] ?? '[]', true);
        $totalAmount = isset($order['total_amount']) ? (float) $order['total_amount'] : (float) ($order['total'] ?? 0);
        $reviewedProductIds = $this->getReviewedProductIds((int) $order['id']);

        return [
            'id' => (int) $order['id'],
            'order_ref' => $order['order_ref'] ?? sprintf('SJI-%s-%04d', date('Ymd'), $order['id']),
            'user_id' => isset($order['user_id']) ? (int) $order['user_id'] : null,
            'customer_name' => $order['customer_name'],
            'customer_phone' => $order['customer_phone'],
            'delivery_address' => $order['delivery_address'] ?? 'Pickup',
            'order_type' => $order['order_type'] ?? 'delivery',
            'payment_method' => $order['payment_method'] ?? 'bank_transfer',
            'pickup_time' => $order['pickup_time'] ?? null,
            'items' => is_array($items) ? $items : [],
            'subtotal' => (float) ($order['subtotal'] ?? $totalAmount),
            'delivery_fee' => (float) ($order['delivery_fee'] ?? 0),
            'total' => (float) ($order['total'] ?? $totalAmount),
            'total_amount' => $totalAmount,
            'status' => $order['status'] ?? 'pending',
            'payment_status' => $order['payment_status'] ?? 'pending',
            'payment_reference' => $order['payment_reference'] ?? null,
            'payment_submitted_at' => $order['payment_submitted_at'] ?? null,
            'payment_reviewed_at' => $order['payment_reviewed_at'] ?? null,
            'payment_reviewed_by' => isset($order['payment_reviewed_by']) ? (int) $order['payment_reviewed_by'] : null,
            'admin_note' => $order['admin_note'] ?? '',
            'notes' => $order['notes'] ?? '',
            'receipt_path' => $order['receipt_path'] ?? null,
            'reviewed_product_ids' => $reviewedProductIds,
            'created_at' => $order['created_at'] ?? null,
            'updated_at' => $order['updated_at'] ?? ($order['created_at'] ?? null),
        ];
    }

    private function normalizePhone(string $phone): string {
        return preg_replace('/\D+/', '', $phone) ?? '';
    }

    private function attachGuestOrdersToUser(int $userId): void {
        if ($userId <= 0) {
            return;
        }

        $userStmt = $this->db->prepare("SELECT phone FROM users WHERE id = ? LIMIT 1");
        $userStmt->execute([$userId]);
        $user = $userStmt->fetch(PDO::FETCH_ASSOC);
        $normalizedPhone = $this->normalizePhone((string) ($user['phone'] ?? ''));

        if ($normalizedPhone === '') {
            return;
        }

        $stmt = $this->db->prepare("
            SELECT id, customer_phone
            FROM orders
            WHERE (user_id IS NULL OR user_id = 0)
        ");
        $stmt->execute();

        $matchingOrderIds = [];
        while ($order = $stmt->fetch(PDO::FETCH_ASSOC)) {
            if ($this->normalizePhone((string) ($order['customer_phone'] ?? '')) === $normalizedPhone) {
                $matchingOrderIds[] = (int) $order['id'];
            }
        }

        if ($matchingOrderIds === []) {
            return;
        }

        $update = $this->db->prepare("UPDATE orders SET user_id = ? WHERE id = ?");
        foreach ($matchingOrderIds as $orderId) {
            $update->execute([$userId, $orderId]);
        }
    }

    private function getReviewedProductIds(int $orderId): array {
        $stmt = $this->db->prepare("SELECT product_id FROM reviews WHERE order_id = ?");
        $stmt->execute([$orderId]);

        return array_map(
            static fn(array $row): string => (string) $row['product_id'],
            $stmt->fetchAll(PDO::FETCH_ASSOC)
        );
    }

    private function incrementSessionOrderCount(?string $sessionId): void {
        if (!$sessionId) {
            return;
        }

        $stmt = $this->db->prepare("UPDATE sessions SET orders_placed = orders_placed + 1, cart_abandoned = 0 WHERE id = ?");
        $stmt->execute([$sessionId]);
    }

    private function getOrderRecord(int $id): ?array {
        $stmt = $this->db->prepare("SELECT * FROM orders WHERE id = ?");
        $stmt->execute([$id]);
        $order = $stmt->fetch(PDO::FETCH_ASSOC);
        return $order ?: null;
    }

    private function notifyUserForStatusChange(array $order, string $status): void {
        $customerName = (string) ($order['customer_name'] ?? 'Customer');
        $customerPhone = (string) ($order['customer_phone'] ?? '');
        $orderId = (int) ($order['id'] ?? 0);
        $orderRef = (string) ($order['order_ref'] ?? sprintf('SJI-%s-%04d', date('Ymd'), $orderId));

        $messages = [
            'confirmed' => "Hi {$customerName}, your payment for order {$orderRef} has been confirmed. The kitchen queue is now locked in.",
            'preparing' => "Hi {$customerName}, your order {$orderRef} is now being prepared.",
            'ready_for_pickup' => "Hi {$customerName}, your order {$orderRef} is ready for pickup.",
            'dispatched' => "Hi {$customerName}, your order {$orderRef} is out for delivery.",
            'delivered' => "Hi {$customerName}, your order {$orderRef} has been marked as delivered. Enjoy your meal.",
            'cancelled' => "Hi {$customerName}, your order {$orderRef} has been cancelled. Please contact support if this was unexpected.",
        ];

        if (!isset($messages[$status])) {
            return;
        }

        $this->sendOrderWhatsAppNotification($orderId, "status_{$status}", $customerPhone, $messages[$status]);
    }

    private function publishOrderEvent(string $type, array $order, array $extraPayload = []): void {
        $visibility = $this->getOrderVisibility($order);
        if ($visibility === null) {
            return;
        }

        $payload = array_merge(
            [
                'id' => (int) ($order['id'] ?? 0),
                'user_id' => isset($order['user_id']) ? (int) $order['user_id'] : null,
                'order_ref' => (string) ($order['order_ref'] ?? ''),
                'status' => (string) ($order['status'] ?? 'pending'),
                'payment_status' => (string) ($order['payment_status'] ?? 'pending'),
                'updated_at' => (string) ($order['updated_at'] ?? gmdate('c')),
                'event_key' => sprintf(
                    '%s:%s:%s',
                    $type,
                    (string) ($order['id'] ?? '0'),
                    (string) ($order['updated_at'] ?? gmdate('c'))
                ),
            ],
            $extraPayload
        );

        publishEvent($type, $payload, $visibility);
    }

    private function getOrderVisibility(array $order): ?string {
        $userId = isset($order['user_id']) ? (int) $order['user_id'] : 0;
        if ($userId <= 0) {
            return null;
        }

        return sprintf('user:%d', $userId);
    }

    private function getStatusNotificationCopy(string $status): string {
        return match ($status) {
            'confirmed' => 'Your payment has been confirmed and the kitchen queue is locked in.',
            'preparing' => 'Your shawarma is now being prepared.',
            'ready_for_pickup' => 'Your order is packed and ready for pickup.',
            'dispatched' => 'Your rider is on the way with your order.',
            'delivered' => 'Your order has been marked as delivered.',
            'cancelled' => 'Your order was cancelled. Contact support if this looks wrong.',
            default => sprintf('Your order status is now %s.', $status),
        };
    }

    private function sendOrderWhatsAppNotification(int $orderId, string $notificationKey, string $phone, string $message): void {
        if ($orderId <= 0 || trim($phone) === '' || trim($message) === '') {
            return;
        }

        $order = $this->getOrderRecord($orderId);
        if (!$order) {
            return;
        }

        if (($order['last_notification_key'] ?? null) === $notificationKey) {
            return;
        }

        $webhookUrl = trim((string) (getenv('WHATSAPP_NOTIFY_URL') ?: ''));
        if ($webhookUrl === '') {
            return;
        }

        $payload = [
            'order_id' => $orderId,
            'order_ref' => $order['order_ref'] ?? null,
            'phone' => $phone,
            'message' => $message,
            'channel' => 'whatsapp',
            'event' => $notificationKey,
        ];

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $webhookUrl);
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
        curl_exec($ch);
        $httpCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode >= 200 && $httpCode < 300) {
            $stmt = $this->db->prepare("UPDATE orders SET last_notification_key = ?, last_notification_at = CURRENT_TIMESTAMP WHERE id = ?");
            $stmt->execute([$notificationKey, $orderId]);
        }
    }

    private function sendTelegramNotification($orderRef, $data) {
        $token = getenv('TELEGRAM_BOT_TOKEN');
        $chatId = getenv('TELEGRAM_OWNER_CHAT_ID') ?: getenv('TELEGRAM_ADMIN_CHAT_ID');
        if (!$token || !$chatId) {
            return;
        }

        $itemsText = "";
        foreach ($data['items'] as $item) {
            $name = $item['name'] ?? 'Item';
            $quantity = $item['quantity'] ?? 1;
            $size = $item['size'] ?? 'Regular';
            $itemsText .= "  - {$name} x{$quantity} ({$size})\n";
        }

        $orderType = $data['order_type'] ?? 'delivery';
        $pickupLine = $orderType === 'pickup' && !empty($data['pickup_time'])
            ? "Pickup Time: {$data['pickup_time']}\n"
            : '';
        $message = "*NEW ORDER {$orderRef}*\n\n" .
                   "Type: {$orderType}\n" .
                   "Name: {$data['name']}\n" .
                   "Phone: {$data['phone']}\n" .
                   "Address: {$data['address']}\n" .
                   $pickupLine .
                   "Payment Method: " . ($data['payment_method'] ?? 'bank_transfer') . "\n\n" .
                   "Items:\n{$itemsText}\n" .
                   "Total: NGN " . number_format($data['total'], 2);

        $url = "https://api.telegram.org/bot{$token}/sendMessage";
        $payload = [
            'chat_id' => $chatId,
            'text' => $message,
            'parse_mode' => 'Markdown',
        ];

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($payload));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_exec($ch);
        curl_close($ch);
    }

    private function getCurrentUser() {
        $token = getBearerToken();
        $payload = $token ? verifyJwt($token) : false;
        return $payload ?: null;
    }
}
