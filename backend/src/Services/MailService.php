<?php

namespace BamzySMS\Services;

use BamzySMS\Core\Logger;

/**
 * MailService - A standalone SMTP client for sending emails without external libraries.
 */
class MailService {
    private $host;
    private $port;
    private $user;
    private $pass;
    private $fromEmail;
    private $fromName;
    private $encryption; // tls, ssl, or null

    public function __construct() {
        // Load configuration from ENV
        $this->host       = env_or_default('MAIL_HOST', 'localhost');
        $this->port       = env_or_default('MAIL_PORT', 587);
        $this->user       = env_or_default('MAIL_USERNAME', '');
        $this->pass       = env_or_default('MAIL_PASSWORD', '');
        $this->fromEmail  = env_or_default('MAIL_FROM_ADDRESS', 'noreply@bamzysms.com');
        $this->fromName   = env_or_default('MAIL_FROM_NAME', 'BamzySMS');
        $this->encryption = env_or_default('MAIL_ENCRYPTION', 'tls');
    }

    /**
     * Send an email.
     */
    public function send(string $to, string $subject, string $body, bool $isHtml = true): bool {
        if (empty($this->host) || empty($this->user)) {
            Logger::warn('MAIL_SKIPPED', 'SMTP not configured. OTP was: ' . strip_tags($body));
            return false;
        }

        try {
            return $this->dispatch($to, $subject, $body, $isHtml);
        } catch (\Exception $e) {
            Logger::error('MAIL_FAILED', ['error' => $e->getMessage(), 'to' => $to]);
            return false;
        }
    }

    /**
     * Low-level SMTP protocol implementation via sockets.
     */
    private function dispatch($to, $subject, $body, $isHtml) {
        $host = ($this->encryption === 'ssl') ? "ssl://{$this->host}" : $this->host;
        $socket = fsockopen($host, $this->port, $errno, $errstr, 15);

        if (!$socket) {
            throw new \Exception("Could not connect to SMTP host: $errstr ($errno)");
        }

        $this->readResponse($socket, '220');

        // EHLO
        $this->sendCommand($socket, "EHLO " . gethostname(), '250');

        // STARTTLS
        if ($this->encryption === 'tls') {
            $this->sendCommand($socket, "STARTTLS", '220');
            if (!stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
                throw new \Exception("Failed to start TLS encryption");
            }
            // Re-send EHLO after TLS start
            $this->sendCommand($socket, "EHLO " . gethostname(), '250');
        }

        // AUTH LOGIN
        $this->sendCommand($socket, "AUTH LOGIN", '334');
        $this->sendCommand($socket, base64_encode($this->user), '334');
        $this->sendCommand($socket, base64_encode($this->pass), '235');

        // MAIL FROM
        $this->sendCommand($socket, "MAIL FROM:<{$this->fromEmail}>", '250');

        // RCPT TO
        $this->sendCommand($socket, "RCPT TO:<{$to}>", '250');

        // DATA
        $this->sendCommand($socket, "DATA", '354');

        // Build Headers
        $headers = [
            "From: \"{$this->fromName}\" <{$this->fromEmail}>",
            "To: <{$to}>",
            "Subject: {$subject}",
            "MIME-Version: 1.0",
            "Content-Type: " . ($isHtml ? "text/html" : "text/plain") . "; charset=UTF-8",
            "Date: " . date('r'),
            "Message-ID: <" . time() . "." . uniqid() . "@" . $this->host . ">",
            "",
            $body,
            "."
        ];

        $this->sendCommand($socket, implode("\r\n", $headers), '250');

        // QUIT
        $this->sendCommand($socket, "QUIT", '221');

        fclose($socket);
        return true;
    }

    private function sendCommand($socket, $cmd, $expectedCode) {
        fwrite($socket, $cmd . "\r\n");
        return $this->readResponse($socket, $expectedCode);
    }

    private function readResponse($socket, $expectedCode) {
        $response = "";
        while ($line = fgets($socket, 512)) {
            $response .= $line;
            if (substr($line, 3, 1) == " ") break;
        }
        if (substr($response, 0, 3) !== $expectedCode) {
            throw new \Exception("SMTP Error: Expected $expectedCode but got " . substr($response, 0, 3) . " ($response)");
        }
        return $response;
    }
}
