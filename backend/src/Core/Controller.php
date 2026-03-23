<?php

namespace BamzySMS\Core;

class Controller {
    protected function json($data, $status = 200) {
        header('Content-Type: application/json');
        http_response_code($status);
        echo json_encode($data);
        exit;
    }

    protected function getPostData() {
        return json_decode(file_get_contents('php://input'), true) ?? [];
    }
}
