<?php

namespace BamzySMS\Controllers;

use BamzySMS\Core\Controller;

class UtilsController extends Controller {
    
    /**
     * GET /api/utils/server-ip
     * Returns the server's public IP address.
     * Useful for whitelisting on SMS provider dashboards.
     */
    public function getServerIp() {
        // Try multiple ways to get the public IP
        $ip = $this->getPublicIp();
        
        return $this->json([
            'status' => 'success',
            'data' => [
                'ip' => $ip,
                'server_time' => date('Y-m-d H:i:s'),
                'php_version' => PHP_VERSION,
            ]
        ]);
    }

    private function getPublicIp() {
        // 1. Check if we are on localhost
        $localIps = ['127.0.0.1', '::1'];
        $serverAddr = $_SERVER['SERVER_ADDR'] ?? 'Unknown';
        
        // 2. Try to fetch from an external service if possible (cURL)
        try {
            $ch = curl_init('https://api.ipify.org');
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, 5);
            $externalIp = curl_exec($ch);
            curl_close($ch);
            
            if ($externalIp && filter_var($externalIp, FILTER_VALIDATE_IP)) {
                return $externalIp;
            }
        } catch (\Throwable $e) {
            // Fallback to server addr
        }

        return $serverAddr;
    }
}
