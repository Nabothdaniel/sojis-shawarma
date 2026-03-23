<?php

namespace BamzySMS\Models;

use BamzySMS\Core\Database;
use PDO;

class Service {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    public function getAllActive() {
        $sql = "SELECT * FROM services WHERE status = 'active'";
        $stmt = $this->db->query($sql);
        return $stmt->fetchAll();
    }

    public function getByCategory($category) {
        $sql = "SELECT * FROM services WHERE category = ? AND status = 'active'";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$category]);
        return $stmt->fetchAll();
    }
}
