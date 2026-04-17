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
        try {
            // Authenticate via token
            try {
                $userId = AuthMiddleware::handle();
            } catch (\Exception $e) {
                header('HTTP/1.1 401 Unauthorized');
                echo json_encode(['status' => 'error', 'message' => 'Authentication failed']);
                exit;
            }

            // Prevent session locking and timeout
            if (session_status() === PHP_SESSION_ACTIVE) {
                session_write_close();
            }
            set_time_limit(0);
            ignore_user_abort(true);

            // Set headers for SSE
            header('Content-Type: text/event-stream');
            header('Cache-Control: no-cache');
            header('Connection: keep-alive');
            header('X-Accel-Buffering: no'); // Disable buffering for Nginx

            // Clear any existing output buffers
            while (ob_get_level() > 0) {
                ob_end_clean();
            }

            // Initial heartbeat
            echo "retry: 5000\n";
            echo "data: " . json_encode(['type' => 'connected', 'message' => 'Real-time stream established']) . "\n\n";
            if (ob_get_level() > 0) ob_flush();
            flush();

            // Keep connection open
            while (true) {
                if (connection_aborted() || connection_status() !== CONNECTION_NORMAL) {
                    break;
                }

                try {
                    // Fetch pending events
                    $events = $this->eventModel->getPending($userId);

                    foreach ($events as $event) {
                        echo "event: " . $event['event_type'] . "\n";
                        echo "data: " . $event['payload'] . "\n\n";
                    }

                    if (!empty($events)) {
                        if (ob_get_level() > 0) ob_flush();
                        flush();
                    } else {
                        // Send heartbeat
                        echo ": heartbeat\n\n";
                        if (ob_get_level() > 0) ob_flush();
                        flush();
                    }
                } catch (\Exception $e) {
                    \BamzySMS\Core\Logger::error('SSE_STREAM_FAIL', ['msg' => $e->getMessage()]);
                    echo "event: error\n";
                    echo "data: " . json_encode(['message' => 'Stream error occurred']) . "\n\n";
                    if (ob_get_level() > 0) ob_flush();
                    flush();
                    break;
                }

                sleep(2);
            }
        } catch (\Throwable $t) {
            $logPath = __DIR__ . '/../../storage/logs/sse_fatal_error.log';
            $errorMsg = "[" . date('Y-m-d H:i:s') . "] Fatal SSE Error: " . $t->getMessage() . "\n" . $t->getTraceAsString() . "\n\n";
            file_put_contents($logPath, $errorMsg, FILE_APPEND);
            
            \BamzySMS\Core\Logger::log('SSE_FATAL_ERROR', $t->getMessage());

            // Check specifically for missing table
            if (str_contains($t->getMessage(), "Table") && str_contains($t->getMessage(), "doesn't exist")) {
                header('HTTP/1.1 500 Internal Server Error');
                header('Content-Type: application/json');
                echo json_encode([
                    'error'   => 'Database out of sync',
                    'message' => 'The system_events table is missing. Please run migrations.',
                    'hint'    => 'Visit /api/admin/run-migrations to fix this.'
                ]);
                exit;
            }

            header('Content-Type: application/json');
            echo json_encode(['error' => 'Fatal SSE Error', 'message' => $t->getMessage()]);
            exit;
        }
    }

    /**
     * Get recent notifications
     */
    public function getNotifications() {
        $userId = AuthMiddleware::handle();
        $notifications = $this->eventModel->getRecent($userId);
        $unreadCount = $this->eventModel->getUnreadCount($userId);

        return $this->json([
            'status' => 'success',
            'notifications' => $notifications,
            'unreadCount' => $unreadCount
        ]);
    }

    /**
     * Mark notifications as read
     */
    public function markRead() {
        $userId = AuthMiddleware::handle();
        $data = $this->getPostData();
        $eventId = $data['id'] ?? null;

        $this->eventModel->markAsRead($userId, $eventId);

        return $this->json([
            'status' => 'success',
            'message' => 'Notifications marked as read'
        ]);
    }
}
