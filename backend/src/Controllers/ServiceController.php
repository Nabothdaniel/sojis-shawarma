<?php

namespace BamzySMS\Controllers;

use BamzySMS\Core\Controller;
use BamzySMS\Services\SmsBowerClient;

class ServiceController extends Controller {
    private SmsBowerClient $sms;

    public function __construct() {
        $this->sms = new SmsBowerClient();
    }

    // ─── GET /api/services ────────────────────────────────────────────────────
    // Returns the SMSBower service list (code + name pairs)

    public function getServices() {
        try {
            $services = $this->sms->getServicesList();
            return $this->json(['status' => 'success', 'data' => $services]);
        } catch (\Throwable $e) {
            return $this->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }

    // ─── GET /api/countries ───────────────────────────────────────────────────
    // Returns all SMSBower countries with IDs

    public function getCountries() {
        try {
            $countries = $this->sms->getCountries();
            // Add emoji flags by mapping country IDs
            $withFlags = array_map(function ($c) {
                $c['flag'] = $this->getFlag($c['eng'] ?? '');
                return $c;
            }, $countries);
            return $this->json(['status' => 'success', 'data' => $withFlags]);
        } catch (\Throwable $e) {
            return $this->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }

    // ─── GET /api/prices?service=go&country=0 ────────────────────────────────
    // Returns live prices (cost + count) for a given service/country

    public function getPrices() {
        $service = $_GET['service'] ?? null;
        $country = isset($_GET['country']) ? (int)$_GET['country'] : null;

        try {
            $prices = $this->sms->getPricesV2($service, $country);
            return $this->json(['status' => 'success', 'data' => $prices]);
        } catch (\Throwable $e) {
            return $this->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }

    // ─── GET /api/available?service=go&country=0 ─────────────────────────────
    // Returns cheapest available price for a service in a country

    public function getAvailable() {
        $service = trim($_GET['service'] ?? '');
        $country = isset($_GET['country']) ? (int)$_GET['country'] : null;

        if (!$service || $country === null) {
            return $this->json(['status' => 'error', 'message' => 'service and country required.'], 400);
        }

        try {
            $prices     = $this->sms->getPricesV2($service, $country);
            $settings   = (new \BamzySMS\Models\Setting())->getAll();
            $multiplier = (float)($settings['price_markup_multiplier'] ?? 1.5);
            $exchange   = (float)($settings['usd_to_ngn_rate'] ?? 1600);

            // Structure: { "countryId": { "serviceCode": { "price1": count, ... } } }
            $countryData  = $prices[(string)$country] ?? [];
            $serviceData  = $countryData[$service]    ?? [];

            if (empty($serviceData)) {
                return $this->json(['status' => 'success', 'data' => ['available' => false, 'price' => null, 'count' => 0]]);
            }

            // Find cheapest price with stock > 0
            $cheapestPrice = null;
            $totalCount    = 0;
            foreach ($serviceData as $price => $count) {
                $totalCount += (int)$count;
                if ($count > 0 && ($cheapestPrice === null || (float)$price < $cheapestPrice)) {
                    $cheapestPrice = (float)$price;
                }
            }

            // Apply markup: rawPrice * multiplier * exchangeRate
            $finalPrice = $cheapestPrice !== null ? ceil($cheapestPrice * $multiplier * $exchange) : null;

            return $this->json([
                'status' => 'success',
                'data'   => [
                    'available' => $totalCount > 0,
                    'price'     => $finalPrice,
                    'count'     => $totalCount,
                ],
            ]);
        } catch (\Throwable $e) {
            return $this->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private function getFlag(string $country): string {
        $flags = [
            'Russian Federation' => '🇷🇺',
            'Ukraine'            => '🇺🇦',
            'Kazakhstan'         => '🇰🇿',
            'China'              => '🇨🇳',
            'Philippines'        => '🇵🇭',
            'Myanmar'            => '🇲🇲',
            'Indonesia'          => '🇮🇩',
            'Malaysia'           => '🇲🇾',
            'India'              => '🇮🇳',
            'Viet nam'           => '🇻🇳',
            'United States USA (virtual)' => '🇺🇸',
            'United States USA'  => '🇺🇸',
            'United Kingdom'     => '🇬🇧',
            'Nigeria'            => '🇳🇬',
            'Kenya'              => '🇰🇪',
            'Ghana'              => '🇬🇭',
            'Tanzania'           => '🇹🇿',
            'Egypt'              => '🇪🇬',
            'Pakistan'           => '🇵🇰',
            'Bangladesh'         => '🇧🇩',
            'Brazil'             => '🇧🇷',
            'Mexico'             => '🇲🇽',
            'Colombia'           => '🇨🇴',
            'France'             => '🇫🇷',
            'Germany'            => '🇩🇪',
            'Thailand'           => '🇹🇭',
            'Turkey'             => '🇹🇷',
            'Saudi Arabia'       => '🇸🇦',
            'United Arab Emirates' => '🇦🇪',
            'Canada'             => '🇨🇦',
            'Australia'          => '🇦🇺',
            'Japan'              => '🇯🇵',
            'Korea'              => '🇰🇷',
            'Hong Kong'          => '🇭🇰',
            'Israel'             => '🇮🇱',
            'Poland'             => '🇵🇱',
            'Romania'            => '🇷🇴',
            'Cambodia'           => '🇰🇭',
            'Uzbekistan'         => '🇺🇿',
            'Azerbaijan'         => '🇦🇿',
            'Ethiopia'           => '🇪🇹',
            'South Africa'       => '🇿🇦',
            'Morocco'            => '🇲🇦',
            'Algeria'            => '🇩🇿',
        ];
        return $flags[$country] ?? '🌐';
    }
}
