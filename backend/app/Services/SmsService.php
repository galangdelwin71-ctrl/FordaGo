<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * SMS Dispatcher supporting PhilSMS, Semaphore, and Twilio.
 *
 * Return shape:
 *   ['sent' => bool, 'provider' => ?string, 'skippedReason' => ?string, 'error' => ?string]
 */
class SmsService
{
    public static function normalizePhoneNumber(?string $raw): string
    {
        $value = trim((string) $raw);
        if ($value === '') {
            return '';
        }

        $digits = preg_replace('/\D/', '', $value);
        if ($digits === '') {
            return '';
        }

        if (str_starts_with($digits, '63') && strlen($digits) >= 12) {
            return "+{$digits}";
        }

        if (str_starts_with($digits, '0') && strlen($digits) === 11) {
            return '+63'.substr($digits, 1);
        }

        if (strlen($digits) === 10 && str_starts_with($digits, '9')) {
            return "+63{$digits}";
        }

        return str_starts_with($value, '+') ? $value : "+{$digits}";
    }

    public static function send(string $to, string $message): array
    {
        $normalizedTo = self::normalizePhoneNumber($to);
        $text = trim($message);

        if ($normalizedTo === '' || $text === '') {
            return ['sent' => false, 'skippedReason' => 'Missing destination number or message'];
        }

        $provider = strtolower(trim((string) config('services.sms.provider')));
        if ($provider === '') {
            return ['sent' => false, 'skippedReason' => 'SMS_PROVIDER not configured'];
        }

        try {
            return match ($provider) {
                'philsms'   => self::sendViaPhilSMS($normalizedTo, $text),
                'semaphore' => self::sendViaSemaphore($normalizedTo, $text),
                'twilio'    => self::sendViaTwilio($normalizedTo, $text),
                default     => ['sent' => false, 'skippedReason' => "Unsupported SMS provider: {$provider}"],
            };
        } catch (\Throwable $e) {
            Log::warning('SMS send failed', ['provider' => $provider, 'error' => $e->getMessage()]);

            return ['sent' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Send SMS via PhilSMS API (https://app.philsms.com/api/v3/sms/send)
     */
    protected static function sendViaPhilSMS(string $to, string $message): array
    {
        $apiToken = config('services.philsms.api_token');
        $senderId = config('services.philsms.sender_id', 'PhilSMS');

        if (! $apiToken) {
            return ['sent' => false, 'skippedReason' => 'Missing PHILSMS_API_TOKEN in .env'];
        }

        // PhilSMS accepts 09XXXXXXXXX or 639XXXXXXXXX
        $cleanDigits = preg_replace('/\D/', '', $to);
        $recipient = $cleanDigits;
        if (str_starts_with($cleanDigits, '63') && strlen($cleanDigits) === 12) {
            $recipient = '0' . substr($cleanDigits, 2);
        }

        $payload = [
            'recipient' => $recipient,
            'sender_id' => $senderId ?: 'PhilSMS',
            'type'      => 'plain',
            'message'   => $message,
        ];

        $resolve = self::getCurlResolve('app.philsms.com', 443);
        $curlOptions = [
            CURLOPT_IPRESOLVE => CURL_IPRESOLVE_V4,
        ];
        if (!empty($resolve)) {
            $curlOptions[CURLOPT_RESOLVE] = $resolve;
        }

        $client = Http::withHeaders([
            'Authorization' => "Bearer {$apiToken}",
            'Accept'        => 'application/json',
            'Content-Type'  => 'application/json',
        ])
        ->withOptions([
            'force_ip_resolve' => 'v4',
            'connect_timeout'  => 8,
            'curl'             => $curlOptions,
        ])
        ->timeout(15);
        if (PHP_OS_FAMILY === 'Windows' || config('app.env') === 'local') {
            $client = $client->withoutVerifying();
        }
        $response = $client->post('https://app.philsms.com/api/v3/sms/send', $payload);

        if (! $response->successful()) {
            $body = $response->body();
            Log::warning('PhilSMS failed', [
                'status'    => $response->status(),
                'body'      => $body,
                'recipient' => $recipient,
            ]);
            throw new \RuntimeException("PhilSMS request failed: {$response->status()} {$body}");
        }

        Log::info('PhilSMS sent successfully', ['to' => $recipient, 'provider' => 'philsms']);

        return ['sent' => true, 'provider' => 'philsms'];
    }

    protected static function sendViaSemaphore(string $to, string $message): array
    {
        $apiKey = config('services.semaphore.api_key');
        $senderName = config('services.semaphore.sender', 'FordaGO');

        if (! $apiKey) {
            return ['sent' => false, 'skippedReason' => 'Missing SEMAPHORE_API_KEY'];
        }

        $resolve = self::getCurlResolve('api.semaphore.co', 443);
        $curlOptions = [
            CURLOPT_IPRESOLVE => CURL_IPRESOLVE_V4,
        ];
        if (!empty($resolve)) {
            $curlOptions[CURLOPT_RESOLVE] = $resolve;
        }

        $response = Http::asForm()
            ->withOptions([
                'force_ip_resolve' => 'v4',
                'connect_timeout'  => 8,
                'curl'             => $curlOptions,
            ])
            ->post('https://api.semaphore.co/api/v4/messages', [
                'apikey'     => $apiKey,
                'number'     => $to,
                'message'    => $message,
                'sendername' => $senderName,
            ]);

        if (! $response->successful()) {
            $body = $response->body();
            Log::warning('Semaphore SMS failed', [
                'status' => $response->status(),
                'body'   => $body,
                'to'     => $to,
            ]);
            throw new \RuntimeException("Semaphore request failed: {$response->status()} {$body}");
        }

        Log::info('Semaphore SMS sent', ['to' => $to, 'provider' => 'semaphore']);

        return ['sent' => true, 'provider' => 'semaphore'];
    }

    protected static function sendViaTwilio(string $to, string $message): array
    {
        $sid = config('services.twilio.sid');
        $token = config('services.twilio.token');
        $from = config('services.twilio.from');

        if (! $sid || ! $token || ! $from) {
            return ['sent' => false, 'skippedReason' => 'Missing Twilio credentials'];
        }

        $response = Http::asForm()
            ->withBasicAuth($sid, $token)
            ->post("https://api.twilio.com/2010-04-01/Accounts/{$sid}/Messages.json", [
                'To' => $to,
                'From' => $from,
                'Body' => $message,
            ]);

        if (! $response->successful()) {
            throw new \RuntimeException("Twilio request failed: {$response->status()} {$response->body}");
        }

        return ['sent' => true, 'provider' => 'twilio'];
    }

    /**
     * Resolve a hostname to its IPv4 address via DNS-over-HTTPS (via raw IP 1.1.1.1)
     * and static Anycast edge IPs so cURL NEVER hangs on container DNS timeouts.
     *
     * @return string[] Array suitable for CURLOPT_RESOLVE, e.g. ["app.philsms.com:443:172.67.143.149"]
     */
    private static function getCurlResolve(string $host, int $port = 443): array
    {
        $resolvedIps = [];

        // 1. Static known Anycast Edge IPs as instant zero-latency fallback
        $staticFallbacks = [
            'app.philsms.com'  => ['172.67.143.149', '104.21.32.186'],
            'api.semaphore.co' => ['104.26.2.82', '172.67.70.198', '104.26.3.82'],
        ];

        // 2. Try DNS over HTTPS (DoH) via raw IP 1.1.1.1 (requires zero DNS lookup)
        try {
            $ch = curl_init("https://1.1.1.1/dns-query?name={$host}&type=A");
            curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_HTTPHEADER     => ['accept: application/dns-json'],
                CURLOPT_TIMEOUT        => 2,
                CURLOPT_SSL_VERIFYPEER => false,
                CURLOPT_SSL_VERIFYHOST => false,
            ]);
            $res = curl_exec($ch);
            curl_close($ch);
            if ($res) {
                $json = json_decode($res, true);
                if (!empty($json['Answer'])) {
                    foreach ($json['Answer'] as $ans) {
                        if (($ans['type'] ?? 0) === 1 && !empty($ans['data']) && filter_var($ans['data'], FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)) {
                            $resolvedIps[] = $ans['data'];
                        }
                    }
                }
            }
        } catch (\Throwable) {}

        // 3. Fall back to static Anycast IPs if DoH didn't return
        if (empty($resolvedIps) && isset($staticFallbacks[$host])) {
            $resolvedIps = $staticFallbacks[$host];
        }

        // 4. Try standard gethostbyname if still empty
        if (empty($resolvedIps)) {
            $ip = @gethostbyname($host);
            if ($ip && $ip !== $host && filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)) {
                $resolvedIps[] = $ip;
            }
        }

        $entries = [];
        foreach ($resolvedIps as $ip) {
            $entries[] = "{$host}:{$port}:{$ip}";
        }

        return $entries;
    }
}
