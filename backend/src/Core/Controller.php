<?php

namespace BamzySMS\Core;

class Controller {
    protected function json($data, $status = 200) {
        header('Content-Type: application/json');
        http_response_code($status);
        echo json_encode($data);
        exit;
    }

    protected function normalizeIncomingData(array $data) {
        // Accept either a backend-only key or the shared frontend key when available.
        $encryptionKey = env_or_default(
            'PLATFORM_ENCRYPTION_KEY',
            env_or_default('NEXT_PUBLIC_ENCRYPTION_KEY', 'BAMZY-DEFAULT-KEY-2026')
        );

        // Some auth flows submit both the primary secret and a confirmation field.
        $sensitiveFields = ['password', 'confirm_password', 'confirm', 'pin'];

        foreach ($sensitiveFields as $field) {
            if (isset($data[$field]) && !empty($data[$field])) {
                $decrypted = EncryptionHelper::decrypt($data[$field], $encryptionKey);
                if (is_string($decrypted)) {
                    $decrypted = trim($decrypted, "\x00..\x1F");
                }
                $data[$field] = $decrypted;
            }
        }

        return $data;
    }

    protected function getPostData() {
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        return $this->normalizeIncomingData($data);
    }
}
