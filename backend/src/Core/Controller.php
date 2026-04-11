<?php

namespace BamzySMS\Core;

class Controller {
    protected function json($data, $status = 200) {
        header('Content-Type: application/json');
        http_response_code($status);
        echo json_encode($data);
        exit;
    }

    protected function getPostData() {
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        
        // Transparent decryption for sensitive fields
        $sensitiveFields = ['password', 'pin'];
        $encryptionKey = env_or_default('PLATFORM_ENCRYPTION_KEY', 'BAMZY-DEFAULT-KEY-2026');

        foreach ($sensitiveFields as $field) {
            if (isset($data[$field]) && !empty($data[$field])) {
                $decrypted = EncryptionHelper::decrypt($data[$field], $encryptionKey);
                if (is_string($decrypted)) {
                    // Remove potential null padding and whitespace
                    $decrypted = trim($decrypted, "\x00..\x1F"); 
                }
                $data[$field] = $decrypted;
            }
        }

        return $data;
    }
}
