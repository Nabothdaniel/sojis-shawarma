<?php

namespace BamzySMS\Controllers;

use BamzySMS\Core\Controller;
use BamzySMS\Core\PricingHelper;
use BamzySMS\Services\SmsBowerClient;

class ServiceController extends Controller {
    private SmsBowerClient $sms;
    private array $fallback;

    public function __construct() {
        $this->sms = new SmsBowerClient();
        $this->fallback = require __DIR__ . '/../../config/fallback_data.php';
    }

    // ─── GET /api/services ────────────────────────────────────────────────────

    public function getServices() {
        try {
            $services = $this->sms->getServicesList();
            return $this->json(['status' => 'success', 'data' => $services]);
        } catch (\Throwable $e) {
            $services = $this->fallback['services'] ?? [];
            return $this->json([
                'status'  => 'success',
                'data'    => $services,
                'message' => 'Provider unavailable. Fallback returned.',
            ]);
        }
    }

    // ─── GET /api/countries ───────────────────────────────────────────────────

    public function getCountries() {
        try {
            $countries = $this->sms->getCountries();
            $processed = [];
            foreach ($countries as $c) {
                if (!is_array($c) || !isset($c['id']) || $c['id'] === null) continue;
                $iso = $this->getIsoCode($c['eng'] ?? '');
                $c['flag'] = $this->getFlagEmoji($c['eng'] ?? '');
                $c['flagUrl'] = $iso ? "https://flagcdn.com/w40/{$iso}.png" : null;
                $processed[] = $c;
            }
            return $this->json(['status' => 'success', 'data' => $processed]);
        } catch (\Throwable $e) {
            $countries = $this->fallback['countries'] ?? [];
            $processed = [];
            foreach ($countries as $c) {
                if (!is_array($c) || !isset($c['id']) || $c['id'] === null) continue;
                $iso = $this->getIsoCode($c['eng'] ?? '');
                $c['flag'] = $this->getFlagEmoji($c['eng'] ?? '');
                $c['flagUrl'] = $iso ? "https://flagcdn.com/w40/{$iso}.png" : null;
                $processed[] = $c;
            }
            return $this->json([
                'status'  => 'success',
                'data'    => $processed,
                'message' => 'Provider unavailable. Fallback returned.',
            ]);
        }
    }

    // ─── GET /api/prices ──────────────────────────────────────────────────────

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

    // ─── GET /api/available ───────────────────────────────────────────────────

    public function getAvailable() {
        $service = trim($_GET['service'] ?? '');
        $country = isset($_GET['country']) ? (int)$_GET['country'] : null;

        if (!$service || $country === null) {
            return $this->json(['status' => 'error', 'message' => 'service and country required.'], 400);
        }

        try {
            $prices      = $this->sms->getPricesV2($service, $country);
            $countryData = $prices[(string)$country] ?? [];
            $serviceData = $countryData[$service]    ?? [];

            if (empty($serviceData)) {
                return $this->json(['status' => 'success', 'data' => ['available' => false, 'count' => 0]]);
            }

            // Find cheapest raw price with stock > 0
            $cheapestRaw = null;
            $countTotal  = 0;
            foreach ($serviceData as $p => $count) {
                if ($count > 0) {
                    if ($cheapestRaw === null || (float)$p < $cheapestRaw) $cheapestRaw = (float)$p;
                    $countTotal += $count;
                }
            }

            if ($cheapestRaw === null) {
                return $this->json(['status' => 'success', 'data' => ['available' => false, 'count' => 0]]);
            }

            $finalPrice = PricingHelper::calculatePrice($cheapestRaw, $service, $country);

            return $this->json([
                'status' => 'success',
                'data' => [
                    'available' => true,
                    'price'     => $finalPrice,
                    'count'     => $countTotal
                ]
            ]);
        } catch (\Throwable $e) {
            return $this->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private function getIsoCode(string $country): ?string {
        $mapping = [
            'Russian Federation' => 'ru',
            'Ukraine'            => 'ua',
            'Kazakhstan'         => 'kz',
            'China'              => 'cn',
            'Philippines'        => 'ph',
            'Myanmar'            => 'mm',
            'Indonesia'          => 'id',
            'Malaysia'           => 'my',
            'India'              => 'in',
            'United States USA (virtual)' => 'us',
            'United States'      => 'us',
            'United States USA'  => 'us',
            'United Kingdom'     => 'gb',
            'Nigeria'            => 'ng',
            'Kenya'              => 'ke',
            'Ghana'              => 'gh',
            'Tanzania'           => 'tz',
            'Egypt'              => 'eg',
            'Pakistan'           => 'pk',
            'Bangladesh'         => 'bd',
            'Brazil'             => 'br',
            'Mexico'             => 'mx',
            'France'             => 'fr',
            'Germany'            => 'de',
            'Turkey'             => 'tr',
            'South Africa'       => 'za',
            'Vietnam'            => 'vn',
            'Viet nam'           => 'vn',
            'Thailand'           => 'th',
            'Canada'             => 'ca',
        ];
        return $mapping[$country] ?? null;
    }

    private function getFlagEmoji(string $country): string {
        $flags = [
            'Russian Federation' => '🇷🇺',
            'Ukraine'            => '🇺🇦',
            'Kazakhstan'         => '🇰🇿',
            'China'              => '🇨🇳',
            'United States USA'  => '🇺🇸',
            'United States'      => '🇺🇸',
            'United Kingdom'     => '🇬🇧',
            'Nigeria'            => '🇳🇬',
            'South Africa'       => '🇿🇦',
        ];
        return $flags[$country] ?? '🌐';
    }
}
