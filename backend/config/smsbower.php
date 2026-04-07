<?php
/**
 * SMSBower API Configuration
 * Get your API key from https://smsbower.page
 */
return [
    'api_key'  => $_ENV['SMSBOWER_API_KEY'] ?? getenv('SMSBOWER_API_KEY') ?? 'YOUR_SMSBOWER_API_KEY_HERE',
    'base_url' => 'https://smsbower.page/stubs/handler_api.php',
];
