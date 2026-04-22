<?php

namespace BamzySMS\Services;

use BamzySMS\Models\Setting;
use BamzySMS\Core\Logger;

class ExchangeRateService {
    private const API_URL = "https://api.exchangerate-api.com/v4/latest/USD";
    private const CACHE_TTL = 21600; // 6 hours in seconds
    private Setting $settingModel;

    public function __construct() {
        $this->settingModel = new Setting();
    }

    /**
     * Get the current USD to NGN exchange rate.
     * Fetches from API if cache is stale.
     */
    public function getRate(): float {
        $currentRate = (float)$this->settingModel->get('usd_to_ngn_rate', 1600.00);
        $lastUpdate  = (int)$this->settingModel->get('last_rate_update', 0);
        $autoUpdate  = (bool)$this->settingModel->get('auto_update_exchange_rate', true);

        if (!$autoUpdate) {
            return $currentRate;
        }

        if (time() - $lastUpdate > self::CACHE_TTL) {
            return $this->refreshRate($currentRate);
        }

        return $currentRate;
    }

    /**
     * Force refresh the exchange rate from the API.
     */
    public function refreshRate(float $fallbackRate = 1600.00): float {
        try {
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, self::API_URL);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, 10);
            $response = curl_exec($ch);
            $err = curl_error($ch);
            curl_close($ch);

            if ($err) {
                Logger::error("EXCHANGE_RATE_API_ERROR", ["error" => $err]);
                return $fallbackRate;
            }

            $data = json_decode($response, true);
            if (isset($data['rates']['NGN'])) {
                $newRate = (float)$data['rates']['NGN'];
                
                // Safety check: ensure rate is reasonable (e.g., between 500 and 3000)
                if ($newRate > 500 && $newRate < 3000) {
                    $this->settingModel->set('usd_to_ngn_rate', $newRate);
                    $this->settingModel->set('last_rate_update', time());
                    Logger::info("EXCHANGE_RATE_UPDATED", ["old_rate" => $fallbackRate, "new_rate" => $newRate]);
                    return $newRate;
                } else {
                    Logger::warning("EXCHANGE_RATE_ABNORMAL", ["received_rate" => $newRate]);
                }
            } else {
                Logger::error("EXCHANGE_RATE_INVALID_RESPONSE", ["response" => $response]);
            }
        } catch (\Throwable $e) {
            Logger::error("EXCHANGE_RATE_REFRESH_EXCEPTION", ["message" => $e->getMessage()]);
        }

        return $fallbackRate;
    }
}
