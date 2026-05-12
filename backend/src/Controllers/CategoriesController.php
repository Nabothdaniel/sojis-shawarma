<?php

class CategoriesController {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    public function getAll() {
        $stmt = $this->db->query("SELECT * FROM categories WHERE active = 1");
        return json_encode($stmt->fetchAll());
    }

    public function create() {
        if (!$this->isAdmin()) {
            header("HTTP/1.1 401 Unauthorized");
            return json_encode(['message' => 'Admin access required']);
        }

        $data = json_decode(file_get_contents('php://input'), true);
        $slug = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $data['name'])));
        $stmt = $this->db->prepare("INSERT INTO categories (name, slug, image_url, active) VALUES (?, ?, ?, ?)");
        $stmt->execute([$data['name'], $slug, $data['image_url'] ?? '', $data['active'] ?? 1]);
        return json_encode(['status' => 'success', 'id' => $this->db->lastInsertId()]);
    }

    public function update($id) {
        if (!$this->isAdmin()) {
            header("HTTP/1.1 401 Unauthorized");
            return json_encode(['message' => 'Admin access required']);
        }

        $data = json_decode(file_get_contents('php://input'), true);
        $slug = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $data['name'])));
        $stmt = $this->db->prepare("UPDATE categories SET name = ?, slug = ?, image_url = ?, active = ? WHERE id = ?");
        $stmt->execute([
            $data['name'],
            $slug,
            $data['image_url'] ?? '',
            $data['active'] ?? 1,
            $id
        ]);
        return json_encode(['status' => 'success']);
    }

    public function delete($id) {
        if (!$this->isAdmin()) {
            header("HTTP/1.1 401 Unauthorized");
            return json_encode(['message' => 'Admin access required']);
        }

        $stmt = $this->db->prepare("DELETE FROM categories WHERE id = ?");
        $stmt->execute([$id]);
        return json_encode(['status' => 'success']);
    }

    private function isAdmin(): bool {
        $token = getBearerToken();
        $payload = $token ? verifyJwt($token) : false;
        return (bool) $payload && (($payload['role'] ?? 'user') === 'admin');
    }
}
