<?php

require_once __DIR__ . '/../Support/Auth.php';
require_once __DIR__ . '/../Support/EventStream.php';

class EventsController
{
    public function __construct(private PDO $db)
    {
    }

    public function stream()
    {
        $user = $this->resolveUserFromStreamToken();

        header('Content-Type: text/event-stream');
        header('Cache-Control: no-cache, no-store, must-revalidate');
        header('Connection: keep-alive');
        header('X-Accel-Buffering: no');

        if (function_exists('apache_setenv')) {
            @apache_setenv('no-gzip', '1');
        }

        @ini_set('zlib.output_compression', '0');
        @ini_set('output_buffering', '0');
        @ini_set('implicit_flush', '1');

        while (ob_get_level() > 0) {
          ob_end_flush();
        }

        ignore_user_abort(true);
        set_time_limit(0);

        $path = ensureEventStreamLog();
        $handle = fopen($path, 'c+');

        if ($handle === false) {
            header('HTTP/1.1 500 Internal Server Error');
            echo "event: error\n";
            echo 'data: {"message":"Could not open event stream"}' . "\n\n";
            flush();
            return null;
        }

        fseek($handle, 0, SEEK_END);
        $position = ftell($handle);
        $startedAt = time();
        $lastPingAt = 0;

        emitSseEvent('connected', [
            'status' => 'ok',
            'role' => $user['role'] ?? 'guest',
            'time' => gmdate('c'),
        ]);

        while (!connection_aborted() && (time() - $startedAt) < 25) {
            clearstatcache(true, $path);
            $size = file_exists($path) ? (filesize($path) ?: 0) : 0;

            if ($size < $position) {
                rewind($handle);
                $position = 0;
            }

            if ($size > $position) {
                fseek($handle, $position);

                while (($line = fgets($handle)) !== false) {
                    $position = ftell($handle);
                    $event = json_decode(trim($line), true);

                    if (!is_array($event) || !canReceiveEvent($event, $user)) {
                        continue;
                    }

                    emitSseEvent(
                        (string) ($event['type'] ?? 'message'),
                        (array) ($event['payload'] ?? []),
                        isset($event['id']) ? (string) $event['id'] : null
                    );
                }
            }

            if ((time() - $lastPingAt) >= 5) {
                echo ": ping\n\n";
                @ob_flush();
                flush();
                $lastPingAt = time();
            }

            usleep(250000);
        }

        fclose($handle);
        return null;
    }

    private function resolveUserFromStreamToken(): ?array
    {
        $token = trim((string) ($_GET['token'] ?? ''));

        if ($token === '') {
            return null;
        }

        $payload = verifyJwt($token);
        return is_array($payload) ? $payload : null;
    }
}

