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
            $this->answerCallback($callback['id'], "Order #$orderId Confirmed!");
            $this->editMessage($chatId, $messageId, " Order #$orderId confirmed. Customer will be notified.");
        } elseif (strpos($data, 'cancel_') === 0) {
            $orderId = str_replace('cancel_', '', $data);
            $this->updateOrderStatus($orderId, 'cancelled');
            $this->answerCallback($callback['id'], "Order #$orderId Cancelled!");
            $this->editMessage($chatId, $messageId, " Order #$orderId cancelled.");
        }
    }

    private function updateOrderStatus($id, $status) {
        $stmt = $this->db->prepare("UPDATE orders SET status = ? WHERE id = ?");
        $stmt->execute([$status, $id]);
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
