<?php

class TelegramController {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    public function handle() {
        $update = json_decode(file_get_contents('php://input'), true);
        if (!$update || !isset($update['callback_query'])) return;

        $callback = $update['callback_query'];
        $data = $callback['data'];
        $chatId = $callback['message']['chat']['id'];
        $messageId = $callback['message']['message_id'];

        if (strpos($data, 'confirm_') === 0) {
            $orderId = str_replace('confirm_', '', $data);
            $this->updateOrderStatus($orderId, 'confirmed');
            $this->sendUserWhatsAppStatusNotification((int) $orderId, 'confirmed');
            $this->answerCallback($callback['id'], "Order #$orderId Confirmed!");
            $this->editMessage($chatId, $messageId, " Order #$orderId confirmed. Customer will be notified.");
        } elseif (strpos($data, 'cancel_') === 0) {
            $orderId = str_replace('cancel_', '', $data);
            $this->updateOrderStatus($orderId, 'cancelled');
            $this->sendUserWhatsAppStatusNotification((int) $orderId, 'cancelled');
            $this->answerCallback($callback['id'], "Order #$orderId Cancelled!");
            $this->editMessage($chatId, $messageId, " Order #$orderId cancelled.");
        }
    }

    private function updateOrderStatus($id, $status) {
        $stmt = $this->db->prepare("UPDATE orders SET status = ? WHERE id = ?");
        $stmt->execute([$status, $id]);
    }

    private function sendUserWhatsAppStatusNotification(int $orderId, string $status): void {
        $stmt = $this->db->prepare("SELECT id, order_ref, customer_name, customer_phone, last_notification_key FROM orders WHERE id = ?");
        $stmt->execute([$orderId]);
        $order = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$order) {
            return;
        }

        $notificationKey = "status_{$status}";
        if (($order['last_notification_key'] ?? null) === $notificationKey) {
            return;
        }

        $messages = [
            'confirmed' => "Hi {$order['customer_name']}, your payment for order {$order['order_ref']} has been confirmed. The kitchen queue is now locked in.",
            'cancelled' => "Hi {$order['customer_name']}, your order {$order['order_ref']} has been cancelled. Please contact support if this was unexpected.",
        ];

        if (!isset($messages[$status])) {
            return;
        }

        $webhookUrl = trim((string) (getenv('WHATSAPP_NOTIFY_URL') ?: ''));
        if ($webhookUrl === '') {
            return;
        }

        $payload = [
            'order_id' => $orderId,
            'order_ref' => $order['order_ref'],
            'phone' => $order['customer_phone'],
            'message' => $messages[$status],
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
            $update = $this->db->prepare("UPDATE orders SET last_notification_key = ?, last_notification_at = CURRENT_TIMESTAMP WHERE id = ?");
            $update->execute([$notificationKey, $orderId]);
        }
    }

    private function answerCallback($id, $text) {
        $token = getenv('TELEGRAM_BOT_TOKEN');
        file_get_contents("https://api.telegram.org/bot{$token}/answerCallbackQuery?callback_query_id=$id&text=" . urlencode($text));
    }

    private function editMessage($chatId, $messageId, $text) {
        $token = getenv('TELEGRAM_BOT_TOKEN');
        file_get_contents("https://api.telegram.org/bot{$token}/editMessageText?chat_id=$chatId&message_id=$messageId&text=" . urlencode($text));
    }
}
