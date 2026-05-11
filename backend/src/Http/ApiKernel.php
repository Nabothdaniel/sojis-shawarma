<?php

require_once __DIR__ . '/../Core/Database.php';
require_once __DIR__ . '/../Router.php';
require_once __DIR__ . '/../Support/Bootstrap.php';

class ApiKernel
{
    private Router $router;

    public function __construct(array $routes)
    {
        $this->router = new Router($routes);
    }

    public function handle(string $method, string $uri): void
    {
        [$handler, $params] = $this->router->match($method, $uri);

        if ($handler === null) {
            header("HTTP/1.1 404 Not Found");
            header('Content-Type: application/json');
            echo json_encode(['error' => 'Route not found', 'uri' => $uri]);
            return;
        }

        [$controllerName, $action] = explode('@', $handler);
        $controllerFile = __DIR__ . "/../Controllers/{$controllerName}Controller.php";

        if (!file_exists($controllerFile)) {
            header("HTTP/1.1 500 Internal Server Error");
            header('Content-Type: application/json');
            echo json_encode(['error' => "Controller {$controllerName} not found"]);
            return;
        }

        require_once $controllerFile;

        $className = "{$controllerName}Controller";
        $controller = new $className($this->resolveDatabaseConnection());

        header('Content-Type: application/json');
        echo call_user_func_array([$controller, $action], $params);
    }

    private function resolveDatabaseConnection(): PDO
    {
        try {
            $db = Database::getInstance();
            $driver = getenv('DB_DRIVER') ?: 'mysql';
            ensureBackendSchema($db, $driver);
            return $db;
        } catch (PDOException $exception) {
            header('Content-Type: application/json');
            echo json_encode([
                'error' => 'Database connection failed',
                'details' => $exception->getMessage(),
            ]);
            exit;
        }
    }
}
