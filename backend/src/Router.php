<?php

class Router
{
    public function __construct(private array $routes)
    {
    }

    public function match(string $method, string $uri): array
    {
        foreach ($this->routes[$method] ?? [] as $pattern => $handler) {
            if (preg_match("#^{$pattern}$#", $uri, $matches)) {
                return [$handler, array_slice($matches, 1)];
            }
        }

        return [null, []];
    }
}
