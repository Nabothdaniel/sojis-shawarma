<?php

namespace BamzySMS\Controllers;

use BamzySMS\Core\Controller;
use BamzySMS\Models\Service;

class ServiceController extends Controller {
    private $serviceModel;

    public function __construct() {
        $this->serviceModel = new Service();
    }

    public function getServices() {
        $category = $_GET['category'] ?? null;
        if ($category) {
            $services = $this->serviceModel->getByCategory($category);
        } else {
            $services = $this->serviceModel->getAllActive();
        }

        // Group by country for the frontend
        $grouped = [];
        foreach ($services as $s) {
            $country = $s['country'];
            if (!isset($grouped[$country])) {
                $grouped[$country] = [
                    'name' => $country,
                    'flag' => $this->getFlag($country),
                    'services' => []
                ];
            }
            $grouped[$country]['services'][] = [
                'id' => $s['id'],
                'name' => $s['name'],
                'price' => (float)$s['price']
            ];
        }

        return $this->json(['status' => 'success', 'data' => array_values($grouped)]);
    }

    private function getFlag($country) {
        $flags = [
            'USA' => '🇺🇸',
            'UK' => '🇬🇧',
            'Canada' => '🇨🇦',
            'Nigeria' => '🇳🇬',
            'India' => '🇮🇳',
        ];
        return $flags[$country] ?? '🌐';
    }
}
