<?php

use BamzySMS\Core\Router;

$router = new Router();

// Health Check
$router->add('GET', '/',                       'UtilsController',       'healthCheck');

// Auth
$router->add('POST', '/auth/login',          'AuthController',        'login');
$router->add('POST', '/auth/register',        'AuthController',        'register');
$router->add('POST', '/auth/send-otp',        'AuthController',        'sendOtp');
$router->add('POST', '/auth/verify-otp',      'AuthController',        'verifyOtp');
$router->add('POST', '/auth/reset-password',  'AuthController',        'resetPassword');
$router->add('GET',  '/auth/me',             'AuthController',        'getMe');

// User
$router->add('GET',  '/user/profile',         'UserController',        'getProfile');
$router->add('GET',  '/user/balance',         'UserController',        'getBalance');
$router->add('POST', '/user/update-pin',      'UserController',        'updatePin');
$router->add('POST', '/user/verify-pin',      'UserController',        'verifyPin');
$router->add('GET',  '/transactions',         'TransactionController', 'getHistory');
$router->add('POST', '/purchase',             'TransactionController', 'purchase');

// Services & Countries (live from SMSBower)
$router->add('GET',  '/services',             'ServiceController',     'getServices');
$router->add('GET',  '/countries',            'ServiceController',     'getCountries');
$router->add('GET',  '/prices',               'ServiceController',     'getPrices');
$router->add('GET',  '/available',            'ServiceController',     'getAvailable');

// SMS / Activations
$router->add('POST', '/sms/buy',              'SMSController',         'buy');
$router->add('POST', '/sms/reveal',           'SMSController',         'getPlainNumber');
$router->add('GET',  '/sms/purchases',        'SMSController',         'getPurchases');
$router->add('GET',  '/sms/status',           'SMSController',         'getStatus');
$router->add('POST', '/sms/set-status',       'SMSController',         'setActivationStatus');
$router->add('POST', '/sms/hide',             'SMSController',         'hide');

// Admin
$router->add('GET',  '/admin/provider-balance', 'AdminController', 'getProviderBalance');
$router->add('GET',  '/admin/users',            'AdminController', 'getAllUsers');
$router->add('POST', '/admin/user/balance',     'AdminController', 'updateUserBalance');
$router->add('GET',  '/admin/settings',         'AdminController', 'getSettings');
$router->add('POST', '/admin/settings',        'AdminController', 'updateSettings');
$router->add('GET',  '/admin/logs',             'AdminController', 'getSystemLogs');
$router->add('GET',  '/admin/analytics',        'AdminController', 'getAnalytics');
$router->add('GET',  '/admin/pricing/services', 'AdminController', 'getPaginatedServices');
$router->add('GET',  '/admin/pricing/overrides', 'AdminController', 'getPricingOverrides');
$router->add('GET',  '/admin/provider/status', 'AdminController', 'getProviderStatus');
$router->add('GET',  '/admin/countries',       'AdminController', 'getCountries');
$router->add('GET',  '/admin/promote-me',       'AdminController', 'promoteToAdmin');
$router->add('POST', '/admin/pricing/update',    'AdminController', 'updatePricingOverride');
$router->add('POST', '/admin/pricing/bulk-update','AdminController', 'bulkUpdatePricingOverrides');
$router->add('DELETE','/admin/pricing/delete',   'AdminController', 'deletePricingOverride');
$router->add('GET',  '/admin/setup-master',     'AdminController', 'setupMasterAdmin');
$router->add('GET',  '/admin/run-migrations',   'AdminController', 'runMigrations');

// Utils
$router->add('GET',  '/utils/server-ip',      'UtilsController',       'getServerIp');

return $router;
