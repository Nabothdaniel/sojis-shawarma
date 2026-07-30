<?php

function getEventStreamLogPath(): string
{
    return dirname(__DIR__, 2) . '/storage/runtime/events.log';
}

function ensureEventStreamLog(): string
{
    $path = getEventStreamLogPath();
    $directory = dirname($path);

    if (!is_dir($directory)) {
        mkdir($directory, 0777, true);
    }

    if (!file_exists($path)) {
        touch($path);
    }

    return $path;
}

function publishEvent(string $type, array $payload, string $visibility = 'public'): void
{
    $record = [
        'id' => sprintf('%d-%s', (int) round(microtime(true) * 1000), bin2hex(random_bytes(4))),
        'type' => $type,
        'visibility' => $visibility,
        'payload' => $payload,
        'created_at' => gmdate('c'),
    ];

    file_put_contents(
        ensureEventStreamLog(),
        json_encode($record, JSON_UNESCAPED_SLASHES) . PHP_EOL,
        FILE_APPEND | LOCK_EX
    );
}

function canReceiveEvent(array $event, ?array $user): bool
{
    $visibility = $event['visibility'] ?? 'public';

    if ($visibility === 'public') {
        return true;
    }

    if ($visibility === 'authenticated') {
        return $user !== null;
    }

    if ($visibility === 'admin') {
        return $user !== null && (($user['role'] ?? 'user') === 'admin');
    }

    if (is_string($visibility) && str_starts_with($visibility, 'user:')) {
        if ($user === null || ($user['type'] ?? 'user') !== 'user') {
            return false;
        }

        return (int) substr($visibility, 5) === (int) ($user['id'] ?? 0);
    }

    return false;
}

function emitSseEvent(string $type, array $payload, ?string $id = null): void
{
    if ($id) {
        echo "id: {$id}\n";
    }

    echo "event: {$type}\n";
    echo 'data: ' . json_encode($payload, JSON_UNESCAPED_SLASHES) . "\n\n";

    @ob_flush();
    flush();
}
