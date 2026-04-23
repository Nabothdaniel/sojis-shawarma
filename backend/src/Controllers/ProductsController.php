<?php

class ProductsController {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    public function getAll() {
        $stmt = $this->db->query("SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id");
        return json_encode($stmt->fetchAll());
    }

    public function create() {
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $this->db->prepare("INSERT INTO products (category_id, name, description, price, image_url, available) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([$data['category_id'], $data['name'], $data['description'], $data['price'], $data['image_url'], $data['available'] ?? 1]);
        return json_encode(['status' => 'success', 'id' => $this->db->lastInsertId()]);
    }

    public function update($id) {
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $this->db->prepare("UPDATE products SET category_id = ?, name = ?, description = ?, price = ?, image_url = ?, available = ? WHERE id = ?");
        $stmt->execute([$data['category_id'], $data['name'], $data['description'], $data['price'], $data['image_url'], $data['available'], $id]);
        return json_encode(['status' => 'success']);
    }

    public function delete($id) {
        $stmt = $this->db->prepare("DELETE FROM products WHERE id = ?");
        $stmt->execute([$id]);
        return json_encode(['status' => 'success']);
    }
}
