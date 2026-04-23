<?php

class Router
{
    private $routes = [];

    public function add($method, $path, $handler)
    {
        $this->routes[] = [
            'method' => $method,
            'path' => $path,
            'handler' => $handler
        ];
    }

    public function handle()
    {
        $method = $_SERVER['REQUEST_METHOD'];
        $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

        // Remove /api prefix if present (cPanel usually handles this)
        $path = str_replace('/api', '', $path);

        foreach ($this->routes as $route) {
            if ($route['method'] === $method && $route['path'] === $path) {
                echo call_user_func($route['handler']);
                return;
            }
        }

        header("HTTP/1.1 404 Not Found");
        echo json_encode(['error' => 'Route not found', 'path' => $path]);
    }
}
