<?php

namespace BamzySMS\Core;

class EncryptionHelper {
    private static $method = 'aes-256-cbc';

    /**
     * Decrypts a payload that was encrypted via SubtleCrypto (AES-CBC) in the frontend.
     * The payload should be in format: base64(iv + ciphertext)
     */
    public static function decrypt($encryptedData, $key) {
        if (!$encryptedData) return $encryptedData;

        try {
            $data = base64_decode($encryptedData, true);
            if (!$data) return $encryptedData; // Not base64, return as is

            // We expect the first 16 bytes to be the IV
            $ivLength = openssl_cipher_iv_length(self::$method);
            if (strlen($data) <= $ivLength) {
                return $encryptedData;
            }
            $iv = substr($data, 0, $ivLength);
            $ciphertext = substr($data, $ivLength);

            // The key needs to be 32 bytes for AES-256
            $hashedKey = hash('sha256', $key, true);

            $decrypted = openssl_decrypt($ciphertext, self::$method, $hashedKey, OPENSSL_RAW_DATA, $iv);
            
            return $decrypted !== false ? $decrypted : $encryptedData;
        } catch (\Exception $e) {
            return $encryptedData; // Fallback to raw data if decryption fails
        }
    }
}
