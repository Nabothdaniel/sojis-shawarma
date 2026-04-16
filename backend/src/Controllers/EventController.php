<?php
namespace BamzySMS\Controllers;

use BamzySMS\Core\Controller;
use BamzySMS\Middleware\AuthMiddleware;
use BamzySMS\Models\SystemEvent;

class EventController extends Controller {
    private $eventModel;

    public function __construct() {
        $this->eventModel = new SystemEvent();
    }

    /**
     * SSE Stream Endpoint
     * GET /api/events/stream?token=...
     */
    public function stream() {
        // Authenticate via token (middleare usually handles this but we need to ensure headers are set for SSE)
        $userId = AuthMiddleware::handle();

        // Prevent session locking if using sessions
        if (session_status() === PHP_SESSION_ACTIVE) {
            session_write_close();
        }

        // Set headers for SSE
        header('Content-Type: text/event-stream');
        header('Cache-Control: no-cache');
        header('Connection: keep-alive');
        header('X-Accel-Buffering: no'); // Disable buffering for Nginx

        // Initial heartbeat
        echo "retry: 5000\n";
        echo "data: " . json_encode(['type' => 'connected', 'message' => 'Real-time stream established']) . "\n\n";
        ob_flush();
        flush();

        // Keep connection open
        while (true) {
            // Check for connection abort
            if (connection_aborted()) break;

            // Fetch pending events
            $events = $this->eventModel->getPending($userId);

            foreach ($events as $event) {
                echo "event: " . $event['event_type'] . "\n";
                echo "data: " . $event['payload'] . "\n\n";
            }

            if (!empty($events)) {
                ob_flush();
                flush();
            } else {
                // Send heartbeat to keep connection alive
                echo ": heartbeat\n\n";
                ob_flush();
                flush();
            }

            // Sleep for a short interval (e.g., 2 seconds)
            sleep(2);
        }
    }
}
