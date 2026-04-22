<?php

namespace BamzySMS\Core;

class Controller {
    protected function json($data, $status = 200) {
        header('Content-Type: application/json');
        header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
        header('Pragma: no-cache');
        header('Expires: 0');
        http_response_code($status);
        echo json_encode($data);
        exit;
    }

    protected function normalizeIncomingData(array $data) {
        $encryptionKey = env_or_default(
            'PLATFORM_ENCRYPTION_KEY', 
            env_or_default('NEXT_PUBLIC_ENCRYPTION_KEY', 'BAMZY-DEFAULT-KEY-2026')
        );

        $sensitiveFields = [
            'password', 'confirm_password', 'confirm', 
            'pin', 'transaction_pin', 
            'old_password', 'new_password', 'current_password'
        ];

        foreach ($sensitiveFields as $field) {
            if (isset($data[$field]) && !empty($data[$field])) {
                $decrypted = EncryptionHelper::decrypt($data[$field], $encryptionKey);
                
                // If decryption returned a string different from the input, it worked.
                // Otherwise, it might be raw text or a failed decryption.
                if (is_string($decrypted) && $decrypted !== $data[$field]) {
                    // Success, trim any binary padding
                    $decrypted = trim($decrypted, "\x00..\x1F");
                    
                    // Basic sanity check: if the decrypted text looks like binary/garbage 
                    // (e.g. contains many non-printable characters), it might be a key mismatch.
                    if (preg_match('/[^\x20-\x7E\t\r\n]/', $decrypted)) {
                        error_log("[DECRYPT_FAILURE] Decrypted value for $field contains non-printable characters. Key mismatch suspected.");
                    } else {
                        $data[$field] = $decrypted;
                    }
                }
            }
        }

        return $data;
    }

    protected function getPostData() {
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        return $this->normalizeIncomingData($data);
    }
}
