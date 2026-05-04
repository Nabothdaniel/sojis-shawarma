<?php

require_once __DIR__ . '/../Support/Auth.php';

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
        $deliveryAddress = isset($data['delivery_address']) ? htmlspecialchars(strip_tags(trim($data['delivery_address']))) : 'Pickup';
        $notes = isset($data['notes']) ? htmlspecialchars(strip_tags(trim($data['notes']))) : (isset($data['note']) ? htmlspecialchars(strip_tags(trim($data['note']))) : '');
        
        $items = $data['items'] ?? [];
        $subtotal = (float) ($data['subtotal'] ?? $data['total_amount'] ?? $data['total'] ?? 0);
        $deliveryFee = (float) ($data['delivery_fee'] ?? 0);
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

        try {
            $currentUser = $this->getCurrentUser();
            $stmt = $this->db->prepare("
                INSERT INTO orders (
                    order_ref, session_id, user_id, customer_name, customer_phone, items,
                    subtotal, delivery_fee, total, total_amount, status, payment_status,
                    delivery_address, lat, lng, notes
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
                $data['payment_status'] ?? 'pending',
                $deliveryAddress,
                (float) ($data['lat'] ?? 0),
                (float) ($data['lng'] ?? 0),
                $notes
            ]);

            $orderId = (int) $this->db->lastInsertId();
            $orderRef = sprintf('SJI-%s-%04d', date('Ymd'), $orderId);

            $update = $this->db->prepare("UPDATE orders SET order_ref = ? WHERE id = ?");
            $update->execute([$orderRef, $orderId]);

            $this->incrementSessionOrderCount($data['session_id'] ?? null);
            $this->sendTelegramNotification($orderRef, [
                'name' => $customerName,
                'phone' => $customerPhone,
                'address' => $deliveryAddress,
                'items' => $items,
                'total' => $total,
            ]);

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

        $stmt = $this->db->prepare("UPDATE orders SET payment_status = ?, receipt_path = ? WHERE id = ?");
        $stmt->execute(['submitted', $filename, $id]);

        return json_encode([
            'status' => 'success',
            'message' => 'Receipt uploaded successfully',
            'data' => ['receipt_path' => $filename]
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
        $allowed = ['pending', 'confirmed', 'preparing', 'dispatched', 'delivered', 'cancelled'];

        if (!$status || !in_array($status, $allowed, true)) {
            header("HTTP/1.1 422 Unprocessable Entity");
            return json_encode(['message' => 'Invalid order status']);
        }

        $paymentStatus = null;
        if (in_array($status, ['confirmed', 'preparing', 'dispatched', 'delivered'], true)) {
            $paymentStatus = 'confirmed';
        } elseif ($status === 'cancelled') {
            $paymentStatus = 'rejected';
        }

        if ($paymentStatus) {
            $stmt = $this->db->prepare("UPDATE orders SET status = ?, payment_status = ? WHERE id = ?");
            $stmt->execute([$status, $paymentStatus, $id]);
        } else {
            $stmt = $this->db->prepare("UPDATE orders SET status = ? WHERE id = ?");
            $stmt->execute([$status, $id]);
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
            'items' => is_array($items) ? $items : [],
            'subtotal' => (float) ($order['subtotal'] ?? $totalAmount),
            'delivery_fee' => (float) ($order['delivery_fee'] ?? 0),
            'total' => (float) ($order['total'] ?? $totalAmount),
            'total_amount' => $totalAmount,
            'status' => $order['status'] ?? 'pending',
            'payment_status' => $order['payment_status'] ?? 'pending',
            'notes' => $order['notes'] ?? '',
            'receipt_path' => $order['receipt_path'] ?? null,
            'reviewed_product_ids' => $reviewedProductIds,
            'created_at' => $order['created_at'] ?? null,
            'updated_at' => $order['updated_at'] ?? ($order['created_at'] ?? null),
        ];
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

        $message = "*NEW ORDER {$orderRef}*\n\n" .
                   "Name: {$data['name']}\n" .
                   "Phone: {$data['phone']}\n" .
                   "Address: {$data['address']}\n\n" .
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
