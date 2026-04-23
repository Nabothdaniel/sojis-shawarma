<?php

class OrderController {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    public function create() {
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!$data || !isset($data['name']) || !isset($data['phone'])) {
            header("HTTP/1.1 400 Bad Request");
            return json_encode(['error' => 'Invalid order data']);
        }

        $orderRef = 'SJI-' . date('Ymd') . '-' . strtoupper(substr(uniqid(), -4));

        try {
            $stmt = $this->db->prepare("INSERT INTO orders (order_ref, customer_name, customer_phone, delivery_address, items, total_amount) VALUES (?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $orderRef,
                $data['name'],
                $data['phone'],
                $data['address'] ?? 'Pickup',
                json_encode($data['items']),
                $data['total']
            ]);

            // Send Telegram Notification
            $this->sendTelegramNotification($orderRef, $data);

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

    public function getAll() {
        // Basic admin gate (could be improved with proper auth)
        $stmt = $this->db->query("SELECT * FROM orders ORDER BY created_at DESC");
        return json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    }
}
