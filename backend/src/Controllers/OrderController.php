<?php

class OrderController {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    public function create() {
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!$data || !isset($data['customer_name']) || !isset($data['customer_phone'])) {
            header("HTTP/1.1 400 Bad Request");
            return json_encode(['error' => 'Invalid order data']);
        }

        $orderRef = 'SJI-' . date('Ymd') . '-' . strtoupper(substr(uniqid(), -4));

        try {
            $stmt = $this->db->prepare("INSERT INTO orders (order_ref, customer_name, customer_phone, delivery_address, items, total_amount) VALUES (?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $orderRef,
                $data['customer_name'],
                $data['customer_phone'],
                $data['delivery_address'] ?? 'Pickup',
                json_encode($data['items']),
                $data['total_amount']
            ]);

            // Send Telegram Notification
            // $this->sendTelegramNotification($orderRef, [
            //     'name' => $data['customer_name'],
            //     'phone' => $data['customer_phone'],
            //     'address' => $data['delivery_address'] ?? 'Pickup',
            //     'items' => $data['items'],
            //     'total' => $data['total_amount']
            // ]);

            return json_encode([
                'status' => 'success',
                'order_ref' => $orderRef,
                'message' => 'Order logged successfully'
            ]);
        } catch (PDOException $e) {
            header("HTTP/1.1 500 Internal Server Error");
            return json_encode(['error' => 'Database error: ' . $e->getMessage()]);
        }
    }

    private function sendTelegramNotification($ref, $data) {
        $token = getenv('TELEGRAM_BOT_TOKEN');
        $chatId = getenv('TELEGRAM_ADMIN_CHAT_ID');
        if (!$token || !$chatId) return;

        $items = array_map(function($i) {
            return "• {$i['quantity']}x {$i['name']} ({$i['size']})";
        }, $data['items']);
        $itemsStr = implode("\n", $items);

        $message = "🔔 *NEW ORDER - $ref*\n\n" .
                   "👤 *Customer:* {$data['name']}\n" .
                   "📞 *Phone:* {$data['phone']}\n" .
                   "📍 *Address:* " . ($data['address'] ?? 'Pickup') . "\n\n" .
                   "🌯 *Items:*\n" . $itemsStr . "\n\n" .
                   "💰 *Total:* ₦" . number_format($data['total']);

        $keyboard = [
            'inline_keyboard' => [[
                ['text' => '✅ Confirm', 'callback_data' => "confirm_$ref"],
                ['text' => '❌ Cancel', 'callback_data' => "cancel_$ref"]
            ]]
        ];

        $url = "https://api.telegram.org/bot{$token}/sendMessage";
        $postData = [
            'chat_id' => $chatId,
            'text' => $message,
            'parse_mode' => 'Markdown',
            'reply_markup' => json_encode($keyboard)
        ];

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($postData));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_exec($ch);
    }


    public function confirmPayment($orderId) {
        if (!isset($_FILES['receipt'])) {
            header("HTTP/1.1 400 Bad Request");
            return json_encode(['error' => 'No receipt file uploaded']);
        }

        $receiptFile = $_FILES['receipt'];

        // Basic file validation
        if ($receiptFile['error'] !== UPLOAD_ERR_OK) {
            header("HTTP/1.1 500 Internal Server Error");
            return json_encode(['error' => 'File upload error: ' . $receiptFile['error']]);
        }

        $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!in_array($receiptFile['type'], $allowedTypes)) {
            header("HTTP/1.1 400 Bad Request");
            return json_encode(['error' => 'Invalid file type. Only JPEG, PNG, GIF, WEBP are allowed.']);
        }

        if ($receiptFile['size'] > 5 * 1024 * 1024) { // 5MB limit
            header("HTTP/1.1 400 Bad Request");
            return json_encode(['error' => 'File size exceeds 5MB limit.']);
        }

        $uploadDir = __DIR__ . '/../public/uploads/receipts/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }

        $fileExtension = pathinfo($receiptFile['name'], PATHINFO_EXTENSION);
        $fileName = uniqid('receipt_') . '.' . $fileExtension;
        $filePath = $uploadDir . $fileName;
        $relativePath = '/uploads/receipts/' . $fileName;

        if (!move_uploaded_file($receiptFile['tmp_name'], $filePath)) {
            header("HTTP/1.1 500 Internal Server Error");
            return json_encode(['error' => 'Failed to move uploaded file.']);
        }

        try {
            $stmt = $this->db->prepare("UPDATE orders SET payment_status = 'confirmed', receipt_image = ? WHERE id = ?");
            $stmt->execute([$relativePath, $orderId]);

            // Check if any row was affected
            if ($stmt->rowCount() === 0) {
                header("HTTP/1.1 404 Not Found");
                return json_encode(['error' => 'Order not found or no changes made.']);
            }

            // Optional: Send notification to admin (on-platform, e.g., an internal dashboard update)
            // For now, updating the payment_status and receipt_image is the "on-platform" notification.

            // Send Telegram Notification for Payment Confirmation
            $this->sendTelegramPaymentConfirmationNotification($orderId, $relativePath);

            return json_encode([
                'status' => 'success',
                'message' => 'Payment receipt uploaded and order confirmed.',
                'receipt_image_path' => $relativePath
            ]);
        } catch (PDOException $e) {
            header("HTTP/1.1 500 Internal Server Error");
            return json_encode(['error' => 'Database error: ' . $e->getMessage()]);
        }
    }

    private function sendTelegramPaymentConfirmationNotification($orderId, $receiptImagePath) {
        $token = getenv('TELEGRAM_BOT_TOKEN');
        $chatId = getenv('TELEGRAM_ADMIN_CHAT_ID');
        if (!$token || !$chatId) return;

        // Fetch order details
        $stmt = $this->db->prepare("SELECT order_ref, customer_name, total_amount FROM orders WHERE id = ?");
        $stmt->execute([$orderId]);
        $order = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$order) return;

        $message = "✅ *PAYMENT CONFIRMED - Order {$order['order_ref']}*\n\n" .
                   "👤 *Customer:* {$order['customer_name']}\n" .
                   "💰 *Amount:* ₦" . number_format($order['total_amount']) . "\n" .
                   "🧾 *Receipt:* " . (isset($_SERVER['HTTP_HOST']) ? 'http://' . $_SERVER['HTTP_HOST'] : '') . $receiptImagePath . "\n\n" .
                   "Review and process the order promptly.";

        $url = "https://api.telegram.org/bot{$token}/sendMessage";
        $postData = [
            'chat_id' => $chatId,
            'text' => $message,
            'parse_mode' => 'Markdown',
        ];

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($postData));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_exec($ch);
    }

    public function getAll() {
        // Basic admin gate (could be improved with proper auth)
        $stmt = $this->db->query("SELECT * FROM orders ORDER BY created_at DESC");
        return json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    }
}
