<?php

class UploadsController {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    public function catalog() {
        if (!isset($_FILES['file'])) {
            header("HTTP/1.1 400 Bad Request");
            return json_encode(['message' => 'Image file is required']);
        }

        $file = $_FILES['file'];
        if ($file['error'] !== UPLOAD_ERR_OK) {
            header("HTTP/1.1 400 Bad Request");
            return json_encode(['message' => 'Image upload failed']);
        }

        $allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'];
        $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));

        if (!in_array($extension, $allowedExtensions, true)) {
            header("HTTP/1.1 422 Unprocessable Entity");
            return json_encode(['message' => 'Only JPG, PNG, and WEBP images are allowed']);
        }

        if (($file['size'] ?? 0) > 5 * 1024 * 1024) {
            header("HTTP/1.1 422 Unprocessable Entity");
            return json_encode(['message' => 'Image must be 5MB or smaller']);
        }

        $uploadDir = __DIR__ . '/../../public/uploads/catalog';
        if (!is_dir($uploadDir) && !mkdir($uploadDir, 0777, true)) {
            header("HTTP/1.1 500 Internal Server Error");
            return json_encode(['message' => 'Could not prepare upload directory']);
        }

        $filename = sprintf('catalog-%s.%s', uniqid(), $extension);
        $targetPath = $uploadDir . '/' . $filename;

        if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
            header("HTTP/1.1 500 Internal Server Error");
            return json_encode(['message' => 'Could not save uploaded image']);
        }

        return json_encode([
            'status' => 'success',
            'data' => [
                'filename' => $filename,
                'path' => '/uploads/catalog/' . $filename,
            ],
        ]);
    }
}
