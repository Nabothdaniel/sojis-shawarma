<?php

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

        $customerName = $data['customer_name'] ?? $data['name'] ?? null;
        $customerPhone = $data['customer_phone'] ?? $data['phone'] ?? null;
        $deliveryAddress = $data['delivery_address'] ?? $data['address'] ?? 'Pickup';
        $items = $data['items'] ?? [];
        $subtotal = (float) ($data['subtotal'] ?? $data['total_amount'] ?? $data['total'] ?? 0);
        $deliveryFee = (float) ($data['delivery_fee'] ?? 0);
        $total = (float) ($data['total_amount'] ?? $data['total'] ?? ($subtotal + $deliveryFee));

        if (!$customerName || !$customerPhone || empty($items)) {
            header("HTTP/1.1 422 Unprocessable Entity");
            return json_encode(['message' => 'Customer details and order items are required']);
        }

        try {
            $stmt = $this->db->prepare("
                INSERT INTO orders (
                    order_ref, session_id, customer_name, customer_phone, items,
                    subtotal, delivery_fee, total, total_amount, status, payment_status,
                    delivery_address, lat, lng, notes
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");

            $stmt->execute([
                null,
                $data['session_id'] ?? null,
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
                $data['notes'] ?? $data['note'] ?? ''
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
            return json_encode(['message' => 'Receipt file is required']);
        }

        $uploadDir = __DIR__ . '/../../storage/receipts';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }

        $extension = pathinfo($_FILES['receipt']['name'], PATHINFO_EXTENSION) ?: 'jpg';
        $filename = sprintf('order-%d-%s.%s', $id, uniqid(), $extension);
        $targetPath = $uploadDir . '/' . $filename;

        if (!move_uploaded_file($_FILES['receipt']['tmp_name'], $targetPath)) {
            header("HTTP/1.1 500 Internal Server Error");
            return json_encode(['message' => 'Failed to save receipt']);
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

        if ($status) {
            $stmt = $this->db->prepare("SELECT * FROM orders WHERE status = ? ORDER BY created_at DESC");
            $stmt->execute([$status]);
        } else {
            $stmt = $this->db->query("SELECT * FROM orders ORDER BY created_at DESC");
        }

        $orders = array_map([$this, 'normalizeOrder'], $stmt->fetchAll(PDO::FETCH_ASSOC));

        return json_encode([
            'status' => 'success',
            'data' => $orders,
        ]);
    }

    public function getOne($id) {
        $stmt = $this->db->prepare("SELECT * FROM orders WHERE id = ?");
        $stmt->execute([$id]);
        $order = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$order) {
            header("HTTP/1.1 404 Not Found");
            return json_encode(['message' => 'Order not found']);
        }

        return json_encode([
            'status' => 'success',
            'data' => $this->normalizeOrder($order),
        ]);
    }

    public function updateStatus($id) {
        $data = json_decode(file_get_contents('php://input'), true);
        $status = $data['status'] ?? null;
        $allowed = ['pending', 'confirmed', 'preparing', 'dispatched', 'delivered', 'cancelled'];

        if (!$status || !in_array($status, $allowed, true)) {
            header("HTTP/1.1 422 Unprocessable Entity");
            return json_encode(['message' => 'Invalid order status']);
        }

        $stmt = $this->db->prepare("UPDATE orders SET status = ? WHERE id = ?");
        $stmt->execute([$status, $id]);

        return json_encode([
            'status' => 'success',
            'message' => 'Order status updated',
        ]);
    }

    private function normalizeOrder(array $order): array {
        $items = json_decode($order['items'] ?? '[]', true);
        $totalAmount = isset($order['total_amount']) ? (float) $order['total_amount'] : (float) ($order['total'] ?? 0);

        return [
            'id' => (int) $order['id'],
            'order_ref' => $order['order_ref'] ?? sprintf('SJI-%s-%04d', date('Ymd'), $order['id']),
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
            'created_at' => $order['created_at'] ?? null,
            'updated_at' => $order['updated_at'] ?? ($order['created_at'] ?? null),
        ];
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
}
