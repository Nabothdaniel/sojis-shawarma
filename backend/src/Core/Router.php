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
        $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        
        // Handle subdirectory detection (e.g. /api/)
        $basePath = dirname($_SERVER['SCRIPT_NAME']);
        if ($basePath === '/' || $basePath === '\\') {
            $basePath = '';
        }

        // Strip base path from URI if it exists at the start
        if ($basePath && strpos($uri, $basePath) === 0) {
            $uri = substr($uri, strlen($basePath));
        }

        // Optional: Strip leading '/api' if it's still there (handles local /api/ requests)
        if (strpos($uri, '/api') === 0) {
            $uri = substr($uri, 4);
        }

        // Ensure uri starts with / and is at least /
        if (!$uri || $uri === '' || $uri === '/') {
            $uri = '/';
        } else {
            // Ensure leading slash
            if ($uri[0] !== '/') {
                $uri = '/' . $uri;
            }
        }

        foreach ($this->routes as $route) {
            if ($route['method'] === $method && preg_match($route['path'], $uri, $matches)) {
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

        header("Content-Type: application/json");
        header("HTTP/1.1 404 Not Found");
        echo json_encode([
            'error' => 'Endpoint not found',
            'requested_uri' => $_SERVER['REQUEST_URI'],
            'matched_uri' => $uri,
            'base_path' => $basePath
        ]);
    }
}
