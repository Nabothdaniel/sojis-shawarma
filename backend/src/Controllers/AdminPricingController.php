<?php

namespace BamzySMS\Controllers;

use BamzySMS\Middleware\AuthMiddleware;
use BamzySMS\Services\ExchangeRateService;

class AdminPricingController extends AdminBaseController {

    /**
     * GET /api/admin/pricing/overrides
     */
    public function getPricingOverrides() {
        $userId = AuthMiddleware::handle();
        $this->checkAdmin($userId);
        
        try {
            $stmt = $this->db->prepare("SELECT * FROM service_overrides");
            $stmt->execute();
            return $this->json([
                'status' => 'success',
                'data' => $stmt->fetchAll(\PDO::FETCH_ASSOC)
            ]);
        } catch (\PDOException $e) {
            // If table doesn't exist, create it (safe-guard)
            if ($e->getCode() == '42S02') {
                $this->db->exec("CREATE TABLE IF NOT EXISTS service_overrides (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    service_code VARCHAR(50) NOT NULL,
                    country_id INT DEFAULT 0,
                    multiplier DECIMAL(10, 2) DEFAULT NULL,
                    fixed_price DECIMAL(15, 2) DEFAULT NULL,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    UNIQUE KEY service_country (service_code, country_id)
                )");
                return $this->json(['status' => 'success', 'data' => []]);
            }
            throw $e;
        }
    }

    /**
     * POST /api/admin/pricing/update
     */
    public function updatePricingOverride() {
        $userId = AuthMiddleware::handle();
        $this->checkAdmin($userId);
        
        $data = $this->getPostData();
        $serviceCode = trim($data['serviceCode'] ?? '');
        $countryId   = (int)($data['countryId'] ?? 0);
        $multiplier  = isset($data['multiplier']) ? (float)$data['multiplier'] : null;
        $fixedPrice  = isset($data['fixedPrice']) ? (float)$data['fixedPrice'] : null;

        if (!$serviceCode) {
            return $this->json(['status' => 'error', 'message' => 'serviceCode is required.'], 400);
        }

        try {
            $stmt = $this->db->prepare("
                INSERT INTO service_overrides (service_code, country_id, multiplier, fixed_price)
                VALUES (:code, :country, :mult, :fixed)
                ON DUPLICATE KEY UPDATE multiplier = :mult2, fixed_price = :fixed2
            ");
            $stmt->execute([
                'code'    => $serviceCode,
                'country' => $countryId,
                'mult'    => $multiplier,
                'fixed'   => $fixedPrice,
                'mult2'   => $multiplier,
                'fixed2'  => $fixedPrice
            ]);

            return $this->json(['status' => 'success', 'message' => "Override updated for $serviceCode (Country: $countryId)"]);
        } catch (\Throwable $e) {
            return $this->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * POST /api/admin/pricing/bulk-update
     */
    public function bulkUpdatePricingOverrides() {
        $userId = AuthMiddleware::handle();
        $this->checkAdmin($userId);

        $json = file_get_contents('php://input');
        $data = json_decode($json, true);

        if (!isset($data['overrides']) || !is_array($data['overrides'])) {
            return $this->json(['status' => 'error', 'message' => 'Overrides array required.'], 400);
        }

        $countryId = isset($data['countryId']) ? (int)$data['countryId'] : 0;
        
        try {
            $this->db->beginTransaction();
            $stmt = $this->db->prepare("
                INSERT INTO service_overrides (service_code, country_id, multiplier, fixed_price)
                VALUES (?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE multiplier = ?, fixed_price = ?
            ");

            foreach ($data['overrides'] as $ov) {
                $code = $ov['serviceCode'];
                $price = $ov['fixedPrice'] ?? null;
                $multiplier = $ov['multiplier'] ?? null;
                $stmt->execute([$code, $countryId, $multiplier, $price, $multiplier, $price]);
            }

            $this->db->commit();
            return $this->json(['status' => 'success', 'message' => count($data['overrides']) . ' overrides persisted successfully.']);
        } catch (\Exception $e) {
            $this->db->rollBack();
            return $this->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * DELETE /api/admin/pricing/delete
     */
    public function deletePricingOverride() {
        $userId = AuthMiddleware::handle();
        $this->checkAdmin($userId);
        
        $serviceCode = $_GET['serviceCode'] ?? '';
        $countryId   = (int)($_GET['countryId'] ?? 0);

        if (!$serviceCode) {
            return $this->json(['status' => 'error', 'message' => 'serviceCode is required.'], 400);
        }

        $stmt = $this->db->prepare("DELETE FROM service_overrides WHERE service_code = ? AND country_id = ?");
        $stmt->execute([$serviceCode, $countryId]);

        return $this->json(['status' => 'success', 'message' => "Override deleted for $serviceCode (Country: $countryId)"]);
    }

    /**
     * GET /api/admin/pricing/services
     */
    public function getPaginatedServices() {
        $userId = AuthMiddleware::handle();
        $this->checkAdmin($userId);

        $page      = isset($_GET['page']) ? (int)$_GET['page'] : 1;
        $limit     = isset($_GET['limit']) ? (int)$_GET['limit'] : 20;
        $search    = isset($_GET['search']) ? trim($_GET['search']) : '';
        $countryId = isset($_GET['countryId']) ? (int)$_GET['countryId'] : 0;
        $offset    = ($page - 1) * $limit;

        try {
            $services = $this->smsClient->getServicesList();
        } catch (\Exception $e) {
            $fallback = require __DIR__ . '/../../config/fallback_data.php';
            $services = $fallback['services'] ?? [];
        }

        // Normalize structure: Ensure it's always a list of ['code' => '...', 'name' => '...']
        $normalized = [];
        foreach ($services as $key => $val) {
            if (is_array($val) && isset($val['name'])) {
                // Already in {name:..., code:...} format or similar
                $normalized[] = [
                    'code' => $val['code'] ?? $key,
                    'name' => $val['name']
                ];
            } elseif (is_string($val)) {
                // Format was {code: name}
                $normalized[] = [
                    'code' => $key,
                    'name' => $val
                ];
            }
        }
        $services = $normalized;

        try {
            $stmt = $this->db->prepare("SELECT * FROM service_overrides WHERE country_id = ? OR country_id = 0");
            $stmt->execute([$countryId]);
            $overrides = $stmt->fetchAll(\PDO::FETCH_ASSOC);
            
            $overrideMap = [];
            foreach ($overrides as $o) {
                $code = $o['service_code'];
                if (!isset($overrideMap[$code]) || $o['country_id'] != 0) {
                    $overrideMap[$code] = $o;
                }
            }

            if ($search !== '') {
                $services = array_filter($services, function($s) use ($search) {
                    return stripos($s['name'], $search) !== false || stripos($s['code'], $search) !== false;
                });
            }

            $totalCount = count($services);
            $totalPages = max(1, (int)ceil($totalCount / $limit));
            
            if ($page > $totalPages) {
                $page = $totalPages;
                $offset = ($page - 1) * $limit;
            }

            usort($services, fn($a, $b) => strcmp($a['name'], $b['name']));
            $paginated = array_slice($services, $offset, $limit);
            
            $exchangeService = new ExchangeRateService();
            $rate            = $exchangeService->getRate();
            
            $realPrices = [];
            if ($countryId > 0) {
                try { $realPrices = $this->smsClient->getPricesV2(null, $countryId); } catch (\Exception $e) {}
            }

            $settings = (new \BamzySMS\Models\Setting())->getAll();

            foreach ($paginated as &$s) {
                $s['override'] = $overrideMap[$s['code']] ?? null;
                $costUsd = 0.2;
                if (isset($realPrices[$s['code']])) {
                    $prices = array_keys($realPrices[$s['code']]);
                    if (!empty($prices)) $costUsd = (float) min($prices);
                }
                $s['base_cost_ngn'] = round($costUsd * $rate, 2); 
                $s['inventory']     = isset($realPrices[$s['code']]) ? array_sum($realPrices[$s['code']]) : 0;

                // Effective price calculation
                $multiplier = $s['override']['multiplier'] ?? (float)($settings['price_markup_multiplier'] ?? 1.5);
                $fixedPrice = $s['override']['fixed_price'] ?? null;
                
                $finalPrice = $fixedPrice ?: ceil($costUsd * $multiplier * $rate);
                $s['final_price'] = $finalPrice;
                $s['profit_margin'] = $finalPrice - $s['base_cost_ngn'];
                $s['effective_multiplier'] = $fixedPrice ? round($fixedPrice / ($costUsd * $rate), 2) : $multiplier;
            }



            return $this->json([
                'status' => 'success',
                'data' => $paginated,
                'pagination' => [
                    'total' => $totalCount,
                    'page' => $page,
                    'limit' => $limit,
                    'pages' => ceil($totalCount / $limit)
                ]
            ]);
        } catch (\PDOException $e) {
            if (str_contains($e->getMessage(), 'Unknown column \'country_id\'')) {
                return $this->json(['status' => 'error', 'message' => 'Database out of sync. Please run migrations.', 'error_code' => 'MIGRATION_REQUIRED'], 500);
            }
            throw $e;
        }
    }

    /**
     * GET /api/admin/countries
     */
    public function getCountries() {
        $userId = AuthMiddleware::handle();
        $this->checkAdmin($userId);
        
        try {
            $countries = $this->smsClient->getCountries();
            return $this->json(['status' => 'success', 'data' => $countries]);
        } catch (\Exception $e) {
            return $this->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * POST /api/admin/exchange-rate/refresh
     */
    public function refreshExchangeRate() {
        $userId = AuthMiddleware::handle();
        $this->checkAdmin($userId);
        
        $service = new ExchangeRateService();
        $newRate = $service->refreshRate();
        
        return $this->json([
            'status' => 'success',
            'rate' => $newRate
        ]);
    }
}


