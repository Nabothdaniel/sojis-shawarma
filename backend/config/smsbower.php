<?php
/**
 * SMSBower API Configuration
 * Get your API key from https://smsbower.page
 */
return [
    'api_key'  => $_ENV['SMSBOWER_API_KEY'] ?? getenv('SMSBOWER_API_KEY'),
    'base_url' => 'https://smsbower.page/stubs/handler_api.php',
];
