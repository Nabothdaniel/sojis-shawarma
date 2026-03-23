<?php

namespace BamzySMS\Core;

class Router {
    private $routes = [];

    public function add($method, $path, $controller, $action = null) {
        $path = preg_replace('/\{([a-zA-Z0-9_]+)\}/', '(?P<$1>[a-zA-Z0-9_-]+)', $path);
        
        $handler = $action ? "{$controller}@{$action}" : $controller;
        
        $this->routes[] = [
            'method' => $method,
            'path' => '#^' . $path . '$#',
            'handler' => $handler
        ];
    }

    public function resolve() {
        $method = $_SERVER['REQUEST_METHOD'];
        $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        
        // Handle subdirectory if any (strip /api if needed or just use from root)
        // For this project we assume /api prefix is part of the path or stripped by htaccess
        
        foreach ($this->routes as $route) {
            if ($route['method'] === $method && preg_match($route['path'], $path, $matches)) {
                $handler = $route['handler'];
                list($controllerName, $methodName) = explode('@', $handler);
                
                $controllerClass = "BamzySMS\\Controllers\\" . $controllerName;
                if (class_exists($controllerClass)) {
                    $controller = new $controllerClass();
                    $params = array_filter($matches, 'is_string', ARRAY_FILTER_USE_KEY);
                    return call_user_func_array([$controller, $methodName], $params);
                }
            }
        }

        header("HTTP/1.1 404 Not Found");
        echo json_encode(['error' => 'Endpoint not found']);
    }
}
