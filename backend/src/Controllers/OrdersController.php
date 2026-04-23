<?php

class OrdersController {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    public function create() {
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data) return json_encode(['error' => 'Invalid data']);

        try {
            $stmt = $this->db->prepare("INSERT INTO orders (session_id, customer_name, customer_phone, items, subtotal, delivery_fee, total, delivery_address, lat, lng, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $data['session_id'] ?? null,
                $data['name'],
                $data['phone'],
                json_encode($data['items']),
                $data['subtotal'],
                $data['delivery_fee'] ?? 0,
                $data['total'],
                $data['address'],
                $data['lat'] ?? 0,
                $data['lng'] ?? 0,
                $data['notes'] ?? ''
            ]);

            $orderId = $this->db->lastInsertId();
            
            // Send Telegram Notification (Task 6)
            $this->sendTelegramNotification($orderId, $data);

            return json_encode([
                'status' => 'success', 
                'order_id' => $orderId,
                'order_ref' => 'SJI-' . date('Ymd') . '-' . $orderId
            ]);
        } catch (PDOException $e) {
            return json_encode(['error' => $e->getMessage()]);
        }
    }

    private function sendTelegramNotification($orderId, $data) {
        $token = getenv('TELEGRAM_BOT_TOKEN');
        $chatId = getenv('TELEGRAM_OWNER_CHAT_ID');
        if (!$token || !$chatId) return;

        $itemsText = "";
        foreach ($data['items'] as $item) {
            $itemsText .= "  • {$item['name']} x{$item['quantity']} — ₦" . number_format($item['price'] * $item['quantity']) . "\n";
        }

        $message = "🆕 *NEW ORDER #{$orderId}*\n\n" .
                   "👤 Name: {$data['name']}\n" .
                   "📞 Phone: {$data['phone']}\n" .
                   "📍 Address: {$data['address']}\n\n" .
                   "🛍 *Items:*\n{$itemsText}\n" .
                   "💰 Total: ₦" . number_format($data['total']) . "\n" .
                   "🕐 Time: " . date("g:i A");

        $keyboard = [
            'inline_keyboard' => [[
                ['text' => '✅ Confirm Order', 'callback_data' => "confirm_{$orderId}"],
                ['text' => '❌ Cancel Order', 'callback_data' => "cancel_{$orderId}"]
            ]]
        ];

        $url = "https://api.telegram.org/bot{$token}/sendMessage";
        $payload = [
            'chat_id' => $chatId,
            'text' => $message,
            'parse_mode' => 'Markdown',
            'reply_markup' => json_encode($keyboard)
        ];

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($payload));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_exec($ch);
        curl_close($ch);
    }

    public function getAll() {
        $status = $_GET['status'] ?? null;
        if ($status) {
            $stmt = $this->db->prepare("SELECT * FROM orders WHERE status = ? ORDER BY created_at DESC");
            $stmt->execute([$status]);
        } else {
            $stmt = $this->db->query("SELECT * FROM orders ORDER BY created_at DESC");
        }
        return json_encode($stmt->fetchAll());
    }

    public function updateStatus($id) {
        $data = json_decode(file_get_contents('php://input'), true);
        $status = $data['status'];
        
        $stmt = $this->db->prepare("UPDATE orders SET status = ? WHERE id = ?");
        $stmt->execute([$status, $id]);
        
        return json_encode(['status' => 'success']);
    }
}
