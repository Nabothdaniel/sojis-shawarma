<?php

class Database {
    private static $instance = null;
    private $pdo;

    private function __construct() {
        $host = getenv('DB_HOST') ?: 'localhost';
        $db   = getenv('DB_NAME') ?: 'sojis_shawarma';
        $user = getenv('DB_USER') ?: 'root';
        $pass = getenv('DB_PASS') ?: '';
        $port = getenv('DB_PORT') ?: '3306';
        $charset = 'utf8mb4';

        // Check if we should use SQLite (fallback or dev)
        $driver = getenv('DB_DRIVER') ?: 'mysql';

        if ($driver === 'sqlite') {
            $path = __DIR__ . '/../../database.sqlite';
            $dsn = "sqlite:$path";
        } else {
            $dsn = "mysql:host=$host;dbname=$db;charset=$charset;port=$port";
        }

        try {
            $this->pdo = new PDO($dsn, $user, $pass, [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ]);
        } catch (\PDOException $e) {
            throw new \PDOException($e->getMessage(), (int)$e->getCode());
        }
    }

    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance->getConnection();
    }

    public function getConnection() {
        return $this->pdo;
    }
}
