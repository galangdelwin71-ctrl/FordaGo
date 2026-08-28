<?php

namespace App\Services;

use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\View;

class MailService
{
    /**
     * Send a general text or HTML email.
     * Automatically prioritizes HTTP API drivers (Resend, Brevo) to avoid
     * DigitalOcean SMTP port 25/465/587 blocking, then falls back to Laravel Mailer.
     *
     * @return array{sent: bool, provider?: string, skippedReason?: string, error?: string}
     */
    public static function send(string $to, string $subject, string $text, ?string $html = null): array
    {
        $destination = trim($to);
        $body = trim($text);
        $title = trim($subject) ?: 'FordaGO Notification';

        if ($destination === '' || $body === '') {
            return ['sent' => false, 'skippedReason' => 'Missing destination email or message'];
        }

        // 1. Check for Resend API Key (Bypasses SMTP port blocking via HTTPS port 443)
        $resendKey = config('services.resend.key');
        if ($resendKey) {
            return self::sendViaResend($destination, $title, $body, $html);
        }

        // 2. Check for Brevo API Key (Bypasses SMTP port blocking via HTTPS port 443)
        $brevoKey = config('services.brevo.key');
        if ($brevoKey) {
            return self::sendViaBrevo($destination, $title, $body, $html);
        }

        // 3. Standard Laravel Mailer (SMTP / log)
        $mailer = config('mail.default') ?: 'log';

        if ($mailer === 'log') {
            try {
                Mail::raw($body, function ($message) use ($destination, $title) {
                    $message->to($destination)->subject($title);
                });
            } catch (\Throwable) {}

            return [
                'sent' => false,
                'provider' => 'log',
                'skippedReason' => 'Email is set to log mode (MAIL_MAILER=log). Add RESEND_API_KEY, BREVO_API_KEY, or SMTP credentials in .env.',
            ];
        }

        if ($mailer === 'smtp' && (! config('mail.mailers.smtp.username') || ! config('mail.mailers.smtp.host'))) {
            return [
                'sent' => false,
                'provider' => 'smtp',
                'skippedReason' => 'SMTP is not configured (MAIL_HOST/MAIL_USERNAME/MAIL_PASSWORD in .env)',
            ];
        }

        try {
            if ($html) {
                Mail::html($html, function ($message) use ($destination, $title) {
                    $message->to($destination)->subject($title);
                });
            } else {
                Mail::raw($body, function ($message) use ($destination, $title) {
                    $message->to($destination)->subject($title);
                });
            }

            return ['sent' => true, 'provider' => $mailer];
        } catch (\Throwable $e) {
            Log::warning('Email send failed', ['error' => $e->getMessage()]);

            return ['sent' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Send 6-digit OTP verification email for Password Reset.
     */
    public static function sendPasswordResetOtp(string $to, string $code, string $name = 'Member'): array
    {
        $destination = trim($to);
        $title = 'FordaGO Password Reset Code';
        $plainText = "FordaGO: Your password reset code is {$code}. It expires in 10 minutes. If you didn't request this, ignore this message.";

        if ($destination === '' || $code === '') {
            return ['sent' => false, 'skippedReason' => 'Missing destination email or code'];
        }

        // Render beautiful HTML template
        $htmlContent = null;
        try {
            $htmlContent = View::make('emails.password-reset-otp', [
                'code' => $code,
                'name' => $name,
            ])->render();
        } catch (\Throwable $e) {
            Log::warning('Failed rendering Blade email template: ' . $e->getMessage());
        }

        // 1. Resend API
        $resendKey = config('services.resend.key');
        if ($resendKey) {
            return self::sendViaResend($destination, $title, $plainText, $htmlContent);
        }

        // 2. Brevo API
        $brevoKey = config('services.brevo.key');
        if ($brevoKey) {
            return self::sendViaBrevo($destination, $title, $plainText, $htmlContent);
        }

        // 3. Fallback to Laravel Mailer
        $mailer = config('mail.default') ?: 'log';

        if ($mailer === 'log') {
            try {
                Mail::raw($plainText, function ($message) use ($destination, $title) {
                    $message->to($destination)->subject($title);
                });
            } catch (\Throwable) {}

            return [
                'sent' => false,
                'provider' => 'log',
                'skippedReason' => 'Email is set to log mode (MAIL_MAILER=log). Add RESEND_API_KEY, BREVO_API_KEY, or SMTP credentials in .env.',
            ];
        }

        if ($mailer === 'smtp' && (! config('mail.mailers.smtp.username') || ! config('mail.mailers.smtp.host'))) {
            return [
                'sent' => false,
                'provider' => 'smtp',
                'skippedReason' => 'SMTP is not configured (MAIL_HOST/MAIL_USERNAME/MAIL_PASSWORD in .env)',
            ];
        }

        try {
            if ($htmlContent) {
                Mail::send('emails.password-reset-otp', [
                    'code' => $code,
                    'name' => $name,
                ], function ($message) use ($destination, $title) {
                    $message->to($destination)->subject($title);
                });
            } else {
                Mail::raw($plainText, function ($message) use ($destination, $title) {
                    $message->to($destination)->subject($title);
                });
            }

            return ['sent' => true, 'provider' => $mailer];
        } catch (\Throwable $e) {
            Log::warning('Email send failed: ' . $e->getMessage());
            return ['sent' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Send email via Resend REST API (HTTPS port 443 — NEVER blocked by DigitalOcean/VPS firewalls).
     */
    protected static function sendViaResend(string $to, string $subject, string $text, ?string $html = null): array
    {
        $apiKey = config('services.resend.key');
        $rawFrom = config('services.resend.from_email') ?: config('mail.from.address') ?: 'onboarding@resend.dev';
        // Public email providers (@gmail.com, @yahoo.com) cannot be used as Resend senders.
        // Fall back to Resend's official sandbox 'onboarding@resend.dev'.
        $fromEmail = (preg_match('/@(gmail|yahoo|hotmail|outlook)\.com$/i', $rawFrom) || empty($rawFrom))
            ? 'onboarding@resend.dev'
            : $rawFrom;
        $fromName = config('services.resend.from_name') ?: config('mail.from.name') ?: 'FordaGO Gym';

        $payload = [
            'from'    => "{$fromName} <{$fromEmail}>",
            'to'      => [$to],
            'subject' => $subject,
            'text'    => $text,
        ];

        if ($html) {
            $payload['html'] = $html;
        }

        try {
            $resolve = self::getCurlResolve('api.resend.com', 443);
            $curlOptions = [
                CURLOPT_IPRESOLVE => CURL_IPRESOLVE_V4,
            ];
            if (!empty($resolve)) {
                $curlOptions[CURLOPT_RESOLVE] = $resolve;
            }

            $client = Http::withToken($apiKey)
                ->withOptions([
                    'force_ip_resolve' => 'v4',
                    'connect_timeout'  => 8,
                    'curl'             => $curlOptions,
                ])
                ->timeout(15);
            if (PHP_OS_FAMILY === 'Windows' || config('app.env') === 'local') {
                $client = $client->withoutVerifying();
            }
            $response = $client->post('https://api.resend.com/emails', $payload);

            if (! $response->successful()) {
                $err = $response->json('message') ?? $response->body();
                Log::warning('Resend email failed', ['status' => $response->status(), 'response' => $err]);
                return ['sent' => false, 'provider' => 'resend', 'error' => "Resend API error: {$err}"];
            }

            Log::info('Email sent successfully via Resend', ['to' => $to, 'id' => $response->json('id')]);
            return ['sent' => true, 'provider' => 'resend'];
        } catch (\Throwable $e) {
            Log::warning('Resend HTTP error', ['error' => $e->getMessage()]);
            return ['sent' => false, 'provider' => 'resend', 'error' => $e->getMessage()];
        }
    }

    /**
     * Send email via Brevo REST API (HTTPS port 443 — NEVER blocked by DigitalOcean/VPS firewalls).
     */
    protected static function sendViaBrevo(string $to, string $subject, string $text, ?string $html = null): array
    {
        $apiKey = config('services.brevo.key');
        $fromEmail = config('services.brevo.from_email') ?: config('mail.from.address') ?: 'no-reply@fordago.com';
        $fromName = config('services.brevo.from_name') ?: config('mail.from.name') ?: 'FordaGO Gym';

        $payload = [
            'sender'      => ['name' => $fromName, 'email' => $fromEmail],
            'to'          => [['email' => $to]],
            'subject'     => $subject,
            'textContent' => $text,
        ];

        if ($html) {
            $payload['htmlContent'] = $html;
        }

        try {
            $resolve = self::getCurlResolve('api.brevo.com', 443);
            $curlOptions = [
                CURLOPT_IPRESOLVE => CURL_IPRESOLVE_V4,
            ];
            if (!empty($resolve)) {
                $curlOptions[CURLOPT_RESOLVE] = $resolve;
            }

            $client = Http::withHeaders([
                'api-key'      => $apiKey,
                'Content-Type' => 'application/json',
                'Accept'       => 'application/json',
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
            $response = $client->post('https://api.brevo.com/v3/smtp/email', $payload);

            if (! $response->successful()) {
                $err = $response->json('message') ?? $response->body();
                Log::warning('Brevo email failed', ['status' => $response->status(), 'response' => $err]);
                return ['sent' => false, 'provider' => 'brevo', 'error' => "Brevo API error: {$err}"];
            }

            Log::info('Email sent successfully via Brevo', ['to' => $to, 'messageId' => $response->json('messageId')]);
            return ['sent' => true, 'provider' => 'brevo'];
        } catch (\Throwable $e) {
            Log::warning('Brevo HTTP error', ['error' => $e->getMessage()]);
            return ['sent' => false, 'provider' => 'brevo', 'error' => $e->getMessage()];
        }
    }

    /**
     * Resolve a hostname to its IPv4 address via DNS-over-HTTPS (via raw IP 1.1.1.1)
     * and static Anycast edge IPs so cURL NEVER hangs on container DNS timeouts.
     *
     * @return string[] Array suitable for CURLOPT_RESOLVE, e.g. ["api.resend.com:443:104.20.29.242"]
     */
    private static function getCurlResolve(string $host, int $port = 443): array
    {
        $resolvedIps = [];

        // 1. Static known Anycast Edge IPs as instant zero-latency fallback
        $staticFallbacks = [
            'api.resend.com'   => ['104.20.29.242', '172.66.165.132'],
            'api.brevo.com'    => ['185.107.232.253', '185.107.232.254', '1.179.112.50'],
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
