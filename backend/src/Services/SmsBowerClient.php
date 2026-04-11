<?php

namespace BamzySMS\Services;

/**
 * SMSBower API Client
 * Docs: https://smsbower.page
 */
class SmsBowerClient {
    private string $apiKey;
    private string $baseUrl;

    public function __construct() {
        $cfg = require __DIR__ . '/../../config/smsbower.php';
        $this->apiKey  = $cfg['api_key']  ?? '';
        $this->baseUrl = $cfg['base_url'] ?? 'https://smsbower.page/stubs/handler_api.php';
    }

    private function log(string $message): void {
        $logFile = __DIR__ . '/../../storage/logs/sms_bower.log';
        $time = date('Y-m-d H:i:s');
        
        // Ensure the message is valid UTF-8 to prevent binary corruption in logs
        if (!mb_check_encoding($message, 'UTF-8')) {
            $message = "[BINARY DATA DETECTED - COULD NOT CONVERT]";
        }
        
        file_put_contents($logFile, "[$time] $message\n", FILE_APPEND);
    }

    // ─── Low-level ────────────────────────────────────────────────────────────

    private function request(array $params): string {
        $params['api_key'] = $this->apiKey;
        $url = $this->baseUrl . '?' . http_build_query($params);

        $this->log("OUTBOUND REQUEST: $url");

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 30, // Increased from 15
            CURLOPT_CONNECTTIMEOUT => 10, // Max wait for initial connection
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_USERAGENT      => 'BamzySMS/1.0',
            CURLOPT_ENCODING       => '',
        ]);
        $result = curl_exec($ch);
        $errno  = curl_errno($ch);
        curl_close($ch);

        if ($errno) {
            $this->log("CURL ERROR ($errno)");
            throw new \RuntimeException("cURL error $errno connecting to SMSBower. Check your server's outbound connection.");
        }

        $this->log("RAW RESPONSE: $result");

        if (!is_string($result) || $result === '') {
            throw new \RuntimeException('SMS provider returned an empty response.');
        }

        $providerError = $this->extractProviderError($result);
        if ($providerError !== null) {
            $this->log("EXTRACTED ERROR: $providerError");
            throw new \RuntimeException($providerError);
        }

        return $result;
    }

    // ─── Balance ──────────────────────────────────────────────────────────────

    /**
     * Returns float balance or throws.
     * Response: ACCESS_BALANCE:123.45
     */
    public function getBalance(): float {
        $raw = $this->request(['action' => 'getBalance']);
        if (str_starts_with($raw, 'ACCESS_BALANCE:')) {
            return (float) substr($raw, strlen('ACCESS_BALANCE:'));
        }
        throw new \RuntimeException("getBalance failed: $raw");
    }

    // ─── Get Number ───────────────────────────────────────────────────────────

    /**
     * Returns ['activationId' => int, 'phoneNumber' => string]
     * Response: ACCESS_NUMBER:$activationId:$phoneNumber
     */
    public function getNumber(string $service, int $country, ?float $maxPrice = null): array {
        $params = [
            'action'  => 'getNumber',
            'service' => $service,
            'country' => $country,
        ];
        if ($maxPrice !== null) {
            $params['maxPrice'] = number_format($maxPrice, 2, '.', '');
        }

        $raw = $this->request($params);

        if (str_starts_with($raw, 'ACCESS_NUMBER:')) {
            [, $id, $phone] = explode(':', $raw, 3);
            return ['activationId' => (int)$id, 'phoneNumber' => $phone];
        }

        // Map known error codes to friendly messages
        $errors = [
            'NO_NUMBERS'          => 'No numbers available for this service/country right now.',
            'NO_BALANCE'          => 'Insufficient SMSBower provider balance.',
            'BAD_SERVICE'         => 'Invalid service code.',
            'BAD_KEY'             => 'Invalid SMSBower API key.',
            'BAD_ACTION'          => 'Bad API action.',
            'WRONG_MAX_PRICE'     => 'maxPrice is too low for available numbers.',
        ];

        $msg = $errors[trim($raw)] ?? "SMSBower error: $raw";
        throw new \RuntimeException($msg);
    }

    /**
     * getNumberV2 – returns full activation info object.
     */
    public function getNumberV2(string $service, int $country, ?float $maxPrice = null): array {
        $params = [
            'action'  => 'getNumberV2',
            'service' => $service,
            'country' => $country,
        ];
        if ($maxPrice !== null) {
            $params['maxPrice'] = number_format($maxPrice, 2, '.', '');
        }

        $raw  = $this->request($params);
        $data = json_decode($raw, true);

        if (is_array($data) && isset($data['activationId'])) {
            return $data;
        }

        // Map known error codes from SMSBower
        $errors = [
            'NO_NUMBERS'      => 'Sorry, we are temporarily out of stock for this specific service. Please try again in 5-10 minutes or try another country.',
            'NO_BALANCE'      => 'The system is temporarily undergoing maintenance. Please contact support.',
            'BAD_KEY'         => 'Service configuration error. Please contact support.',
            'WRONG_MAX_PRICE' => 'The price of this service has changed. Please refresh and try again.',
        ];

        $rawTrimmed = trim((string)$raw);
        $msg = $errors[$rawTrimmed] ?? "Purchase failed ($rawTrimmed). Please try again later.";
        throw new \RuntimeException($msg);
    }

    // ─── Get SMS Status ───────────────────────────────────────────────────────

    /**
     * Returns one of:
     *   ['status' => 'WAIT_CODE']
     *   ['status' => 'WAIT_RETRY', 'code' => string]
     *   ['status' => 'CANCEL']
     *   ['status' => 'OK', 'code' => string]
     */
    public function getStatus(int $activationId): array {
        $raw = $this->request(['action' => 'getStatus', 'id' => $activationId]);
        $raw = trim($raw);

        if ($raw === 'STATUS_WAIT_CODE') {
            return ['status' => 'WAIT_CODE', 'code' => null];
        }
        if ($raw === 'STATUS_CANCEL') {
            return ['status' => 'CANCEL', 'code' => null];
        }
        if (str_starts_with($raw, 'STATUS_WAIT_RETRY:')) {
            return ['status' => 'WAIT_RETRY', 'code' => substr($raw, strlen('STATUS_WAIT_RETRY:'))];
        }
        if (str_starts_with($raw, 'STATUS_OK:')) {
            return ['status' => 'OK', 'code' => substr($raw, strlen('STATUS_OK:'))];
        }

        throw new \RuntimeException("getStatus failed: $raw");
    }

    // ─── Set Activation Status ────────────────────────────────────────────────

    /**
     * status codes:
     *   1 = SMS sent (ready)
     *   3 = request another code (retry)
     *   6 = confirm / complete
     *   8 = cancel
     *
     * Returns string response from SMSBower.
     */
    public function setStatus(int $activationId, int $status): string {
        $raw = $this->request(['action' => 'setStatus', 'id' => $activationId, 'status' => $status]);
        return trim($raw);
    }

    // ─── Prices & Services ────────────────────────────────────────────────────

    /**
     * getPrices – returns the full price map (all countries / all services).
     * Optional $service and $country filters.
     */
    public function getPrices(?string $service = null, ?int $country = null): array {
        $params = ['action' => 'getPrices'];
        if ($service)  $params['service'] = $service;
        if ($country !== null) $params['country'] = $country;

        $raw  = $this->request($params);
        $data = json_decode($raw, true);
        if (!is_array($data) || $this->isProviderErrorArray($data)) {
            throw new \RuntimeException("getPrices failed: $raw");
        }
        return $data;
    }

    /**
     * getPricesV2 – returns price-keyed counts per service per country.
     */
    public function getPricesV2(?string $service = null, ?int $country = null): array {
        $params = ['action' => 'getPricesV2'];
        if ($service)  $params['service'] = $service;
        if ($country !== null) $params['country'] = $country;

        $raw  = $this->request($params);
        $data = json_decode($raw, true);
        if (!is_array($data) || $this->isProviderErrorArray($data)) {
            throw new \RuntimeException("getPricesV2 failed: $raw");
        }
        return $data;
    }

    // ─── Caching Helper ───────────────────────────────────────────────────────

    /**
     * Cache results for $ttl seconds (default 24h)
     */
    private function _getCached(string $name, callable $fetcher, int $ttl = 86400, ?callable $validator = null) {
        $cachePath = __DIR__ . '/../../storage/cache/' . $name . '.json';
        if (file_exists($cachePath) && (time() - filemtime($cachePath) < $ttl)) {
            $data = json_decode(file_get_contents($cachePath), true);
            if ($data !== null && ($validator === null || $validator($data) === true)) {
                return $data;
            }
        }

        $res = $fetcher();
        if ($res && ($validator === null || $validator($res) === true)) {
            file_put_contents($cachePath, json_encode($res));
        }
        return $res;
    }

    /**
     * getServicesList – returns [['code'=>'kt','name'=>'KakaoTalk'], ...]
     */
    public function getServicesList(): array {
        return $this->_getCached('services', function() {
            $raw  = $this->request(['action' => 'getServicesList']);
            $data = json_decode($raw, true);
            if (is_array($data) && isset($data['services']) && is_array($data['services'])) {
                return $data['services'];
            }
            throw new \RuntimeException("getServicesList failed: $raw");
        }, 86400, function ($data) {
            return is_array($data);
        });
    }

    /**
     * getCountries – returns [['id'=>1,'eng'=>'Afghanistan'], ...]
     */
    public function getCountries(): array {
        return $this->_getCached('countries', function() {
            $raw  = $this->request(['action' => 'getCountries']);
            $data = json_decode($raw, true);
            if (is_array($data) && !$this->isProviderErrorArray($data)) {
                $countries = array_values($data);
                $countries = array_values(array_filter($countries, fn($c) => is_array($c)));
                if (!empty($countries)) {
                    return $countries;
                }
            }
            throw new \RuntimeException("getCountries failed: $raw");
        }, 86400, function ($data) {
            return is_array($data) && !empty($data) && is_array($data[0] ?? null);
        });
    }

    private function extractProviderError(string $raw): ?string {
        $trimmed = trim($raw);

        if (
            str_contains($trimmed, 'IP_NOT_ALLOWED') ||
            str_contains($trimmed, 'BAD_IP') ||
            str_contains($trimmed, 'No access') ||
            str_contains($trimmed, 'ACCESS_DENIED')
        ) {
            return 'SMS provider access denied. Please verify your provider account/API permissions.';
        }

        $decoded = json_decode($trimmed, true);
        if ($this->isProviderErrorArray($decoded)) {
            $msg = trim((string)($decoded[1] ?? ''));
            if ($msg !== '') {
                return "SMS provider error: $msg";
            }
            return 'SMS provider returned an access error.';
        }

        return null;
    }

    private function isProviderErrorArray($data): bool {
        return is_array($data)
            && array_is_list($data)
            && isset($data[0], $data[1])
            && ((string)$data[0] === '0')
            && is_string($data[1]);
    }
}
