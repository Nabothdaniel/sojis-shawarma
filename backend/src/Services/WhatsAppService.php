<?php

namespace BamzySMS\Services;

class WhatsAppService {
    /**
     * Send a WhatsApp message.
     * This is currently a simulated service. 
     * In production, replace the simulator logic with a real provider (e.g. Twilio, Meta, or custom gateway).
     */
    public function sendMessage($to, $message) {
        $to = preg_replace('/\D/', '', $to); // Clean number
        
        // Ensure number has country code (default to 234 if 11 digits starting with 0)
        if (strlen($to) === 11 && strpos($to, '0') === 0) {
            $to = '234' . substr($to, 1);
        }

        // LOGGING SIMULATION
        $logMessage = "WHATSAPP_SIMULATION: Sending to $to: \"$message\"";
        error_log($logMessage);
        
        // You can also write to a specific file for easier debugging
        file_put_contents(__DIR__ . '/../../storage/whatsapp_logs.txt', "[" . date('Y-m-d H:i:s') . "] $logMessage\n", FILE_APPEND);

        return true;
    }

    public function sendOtp($to, $otp) {
        $message = "Your BamzySMS verification code is: *$otp*.\nKeep it safe and do not share it with anyone.";
        return $this->sendMessage($to, $message);
    }
}
