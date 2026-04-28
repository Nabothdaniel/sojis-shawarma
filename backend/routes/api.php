require_once __DIR__ . '/../src/Controllers/OrderController.php';
require_once __DIR__ . '/../src/Controllers/AuthController.php';
require_once __DIR__ . '/../src/Controllers/TelegramController.php';
require_once __DIR__ . '/../src/Core/Database.php';

$db = Database::getInstance();

$router->add('GET', '/', function() {
    return json_encode(['message' => 'Soji\'s Shawarma API is running']);
});

$router->add('POST', '/orders', function() use ($db) {
    $controller = new OrderController($db);
    return $controller->create();
});

$router->add('GET', '/orders', function() use ($db) {
    $controller = new OrderController($db);
    return $controller->getAll();
});

$router->add('POST', '/orders/{id}/confirm-payment', function($id) use ($db) {
    $controller = new OrderController($db);
    return $controller->confirmPayment($id);
});

$router->add('POST', '/login', function() use ($db) {
    $controller = new AuthController($db);
    return $controller->login();
});

$router->add('POST', '/telegram-webhook', function() use ($db) {
    $controller = new TelegramController($db);
    return $controller->handle();
});

