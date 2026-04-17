<?php

namespace BamzySMS\Services;

use Exception;

/**
 * PaymentPoint Service
 * Handles virtual account creation via the PaymentPoint API.
 * Docs: https://api.paymentpoint.co/api/v1
 */
class PaymentPointService {

    private string $apiKey;
    private string $apiSecret;
    private string $businessId;
    private string $webhookSecretKey;
    private string $baseUrl = 'https://api.paymentpoint.co/api/v1';

    // Bank codes supported by PaymentPoint
    private array $bankCodes = ['20946', '20897']; // PalmPay, OPay

    public function __construct() {
        $this->apiKey           = env_or_default('PAYMENT_POINT_API_KEY', '');
        $this->apiSecret        = env_or_default('PAYMENT_POINT_API_SECRET', '');
        $this->businessId       = env_or_default('PAYMENT_POINT_BUSINESS_ID', '');
        $this->webhookSecretKey = env_or_default('PAYMENT_POINT_SECRET_KEY', '');
    }

    /**
     * Create a dedicated virtual bank account for a customer.
     * POST https://api.paymentpoint.co/api/v1/createVirtualAccount
     *
     * @param string $customerName     The customer's display name
     * @param string $customerEmail    A unique email for this customer
     * @param string $customerPhone    Customer phone number
     * @return array                   Virtual account details from PaymentPoint
     */
    public function createVirtualAccount(string $customerName, string $customerEmail, string $customerPhone): array {
        $endpoint = $this->baseUrl . '/createVirtualAccount';

        $payload = json_encode([
            'email'       => $customerEmail,
            'name'        => $customerName,
            'phoneNumber' => $customerPhone,
            'bankCode'    => $this->bankCodes,
            'businessId'  => $this->businessId,
        ]);

        $headers = [
            'Authorization: Bearer ' . $this->apiSecret,
            'api-key: '              . $this->apiKey,
            'Content-Type: application/json',
            'Accept: application/json',
        ];

        Logger::info('PAYMENTPOINT_API_REQUEST', [
            'endpoint' => $endpoint,
            'customer' => $customerEmail
        ]);

        $response = $this->httpPost($endpoint, $payload, $headers);

        if (!isset($response['status']) || ($response['status'] !== 'success' && $response['status'] !== 'true')) {
            $msg = $response['message'] ?? $response['error'] ?? 'Failed to create virtual account';
            Logger::error('PAYMENTPOINT_API_ERROR', [
                'endpoint' => $endpoint,
                'message'  => $msg,
                'response' => $response
            ]);
            throw new Exception("PaymentPoint Error: $msg");
        }

        return $response;
    }

    /**
     * Verify that an incoming webhook is genuinely from PaymentPoint.
     * Compares HMAC-SHA256 of raw payload against the Paymentpoint-Signature header.
     *
     * @param string $rawPayload          Raw request body string
     * @param string $signatureHeader     Value from HTTP_PAYMENTPOINT_SIGNATURE header
     * @return bool
     */
    public function verifyWebhookSignature(string $rawPayload, string $signatureHeader): bool {
        if (empty($this->webhookSecretKey)) {
            // If no secret is configured, skip verification (not recommended for production)
            return true;
        }

        $calculated = hash_hmac('sha256', $rawPayload, $this->webhookSecretKey);
        return hash_equals($calculated, $signatureHeader);
    }

    // ─── Internal HTTP Helper ─────────────────────────────────────────────────

    private function httpPost(string $url, string $payload, array $headers): array {
        $ch = curl_init($url);

        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => $payload,
            CURLOPT_HTTPHEADER     => $headers,
            CURLOPT_TIMEOUT        => 30,
            CURLOPT_SSL_VERIFYPEER => true,
        ]);

        $responseBody = curl_exec($ch);
        $httpCode     = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError    = curl_error($ch);
        curl_close($ch);

        if ($curlError) {
            throw new Exception("cURL Error contacting PaymentPoint: $curlError");
        }

        Logger::info('PAYMENTPOINT_RAW_RESPONSE', [
            'url'       => $url,
            'http_code' => $httpCode,
            'body'      => $responseBody
        ]);

        $decoded = json_decode($responseBody, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            Logger::error('PAYMENTPOINT_JSON_DECODE_ERROR', [
                'url'       => $url,
                'http_code' => $httpCode,
                'body'      => $responseBody
            ]);
            throw new Exception("PaymentPoint returned non-JSON response (HTTP $httpCode).");
        }

        return $decoded;
    }
}
