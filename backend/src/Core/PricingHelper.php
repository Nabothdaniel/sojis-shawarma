<?php

namespace BamzySMS\Core;

use BamzySMS\Models\Setting;
use BamzySMS\Core\Database;

class PricingHelper {
    /**
     * Calculate final price in Naira for a service.
     * 
     * @param float $rawPriceUsd The price from SMSBower in USD
     * @param string $serviceCode The service short code
     * @return float Final price in NGN
     */
    public static function calculatePrice(float $rawPriceUsd, string $serviceCode): float {
        $settings     = (new Setting())->getAll();
        $globalMult   = (float)($settings['price_markup_multiplier'] ?? 1.5);
        $exchangeRate = (float)($settings['usd_to_ngn_rate'] ?? 1600);

        // Check for overrides
        $db = Database::getInstance()->getConnection();
        
        try {
            $stmt = $db->prepare("SELECT multiplier, fixed_price FROM service_overrides WHERE service_code = ?");
            $stmt->execute([$serviceCode]);
            $override = $stmt->fetch(\PDO::FETCH_ASSOC);
        } catch (\PDOException $e) {
            // Table might not exist yet if admin hasn't visited any admin page
            if ($e->getCode() == '42S02') {
                $db->exec("CREATE TABLE IF NOT EXISTS service_overrides (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    service_code VARCHAR(50) NOT NULL UNIQUE,
                    multiplier DECIMAL(10, 2) DEFAULT NULL,
                    fixed_price DECIMAL(15, 2) DEFAULT NULL,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                )");
            }
            $override = null;
        }

        if ($override) {
            if ($override['fixed_price'] !== null) {
                return (float)$override['fixed_price'];
            }
            if ($override['multiplier'] !== null) {
                return (float)ceil($rawPriceUsd * $override['multiplier'] * $exchangeRate);
            }
        }

        // Default global logic
        return (float)ceil($rawPriceUsd * $globalMult * $exchangeRate);
    }
}
