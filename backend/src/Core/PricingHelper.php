<?php

namespace BamzySMS\Core;

use BamzySMS\Models\Setting;
use BamzySMS\Core\Database;
use BamzySMS\Services\ExchangeRateService;

class PricingHelper {
    /**
     * Calculate final price in Naira for a service.
     * 
     * @param float $rawPriceUsd The price from SMSBower in USD
     * @param string $serviceCode The service short code
     * @return float Final price in NGN
     */
    public static function calculatePrice(float $rawPriceUsd, string $serviceCode, int $countryId = 0): float {
        $settings     = (new Setting())->getAll();
        $globalMult   = (float)($settings['price_markup_multiplier'] ?? 1.5);
        
        $exchangeService = new ExchangeRateService();
        $exchangeRate    = $exchangeService->getRate();

        // Check for overrides
        $db = Database::getInstance()->getConnection();
        
        try {
            // Priority 1: Specific Service + Country match
            // Priority 2: Service + Global (country_id = 0) match
            $stmt = $db->prepare("
                SELECT multiplier, fixed_price, country_id 
                FROM service_overrides 
                WHERE service_code = ? AND (country_id = ? OR country_id = 0)
                ORDER BY country_id DESC LIMIT 1
            ");
            $stmt->execute([$serviceCode, $countryId]);
            $override = $stmt->fetch(\PDO::FETCH_ASSOC);
        } catch (\PDOException $e) {
            $override = null;
        }

        if ($override) {
            if ($override['fixed_price'] !== null && $override['fixed_price'] > 0) {
                return (float)$override['fixed_price'];
            }
            if ($override['multiplier'] !== null && $override['multiplier'] > 0) {
                return (float)ceil($rawPriceUsd * $override['multiplier'] * $exchangeRate);
            }
        }

        // Default global logic
        return (float)ceil($rawPriceUsd * $globalMult * $exchangeRate);
    }
}
