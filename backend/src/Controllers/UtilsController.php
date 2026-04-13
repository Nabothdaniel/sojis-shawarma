<?php

namespace BamzySMS\Controllers;

use BamzySMS\Core\Controller;

class UtilsController extends Controller {
    
    /**
     * GET /
     * Root health check endpoint.
     */
    public function healthCheck() {
        return $this->json([
            'status' => 'success',
            'message' => 'BamzySMS API is online',
            'version' => '1.2.0',
            'environment' => env_or_default('APP_ENV', 'production'),
            'timestamp' => date('Y-m-d H:i:s')
        ]);
    }

    /**
     * GET /utils/server-ip
     * Returns a detailed diagnostic report for whitelisting.
     */
    public function getServerIp() {
        $ipInfo = $this->getPublicIpDetailed();
        
        return $this->json([
            'status' => 'success',
            'data' => [
                'public_ip' => $ipInfo['ip'],
                'method' => $ipInfo['method'],
                'connectivity_test' => $this->testSmsBowerConnectivity(),
                'server_info' => [
                    'time' => date('Y-m-d H:i:s'),
                    'timezone' => date_default_timezone_get(),
                    'php_version' => PHP_VERSION,
                    'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'N/A'
                ],
                'instructions' => "Provide the 'public_ip' to SMSBower support if you are encountering 401 Unauthorized or Timeout errors."
            ]
        ]);
    }

    private function getPublicIpDetailed() {
        // Try multiple services in case one is blocked
        $services = [
            'https://api.ipify.org' => 'ipify',
            'https://ifconfig.me/ip' => 'ifconfig.me',
            'https://icanhazip.com'  => 'icanhazip'
        ];

        foreach ($services as $url => $name) {
            try {
                $ch = curl_init($url);
                curl_setopt_array($ch, [
                    CURLOPT_RETURNTRANSFER => true,
                    CURLOPT_TIMEOUT        => 3,
                    CURLOPT_CONNECTTIMEOUT => 2
                ]);
                $ip = curl_exec($ch);
                curl_close($ch);
                
                if ($ip && filter_var(trim($ip), FILTER_VALIDATE_IP)) {
                    return ['ip' => trim($ip), 'method' => $name];
                }
            } catch (\Throwable $e) {}
        }

        return ['ip' => $_SERVER['SERVER_ADDR'] ?? 'Unknown', 'method' => 'internal_fallback'];
    }

    private function testSmsBowerConnectivity() {
        $url = "https://smsbower.page/stubs/handler_api.php";
        try {
            $ch = curl_init($url);
            curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_NOBODY         => true,
                CURLOPT_TIMEOUT        => 5,
                CURLOPT_CONNECTTIMEOUT => 5
            ]);
            curl_exec($ch);
            $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $err  = curl_errno($ch);
            curl_close($ch);

            return [
                'reachable' => ($code > 0),
                'http_code' => $code,
                'curl_error' => $err ?: null
            ];
        } catch (\Throwable $e) {
            return ['reachable' => false, 'error' => $e->getMessage()];
        }
    }
}
