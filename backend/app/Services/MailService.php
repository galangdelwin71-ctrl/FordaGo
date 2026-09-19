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

        // 1. Resend API (Lightning fast ~0.4s delivery)
        $resendKey = config('services.resend.key');
        if ($resendKey) {
            $resendResult = self::sendViaResend($destination, $title, $body, $html);
            if (!empty($resendResult['sent'])) {
                return $resendResult;
            }
        }

        // 2. Brevo API (Universal fallback)
        $brevoKey = config('services.brevo.key');
        if ($brevoKey) {
            $brevoResult = self::sendViaBrevo($destination, $title, $body, $html);
            if (!empty($brevoResult['sent'])) {
                return $brevoResult;
            }
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

        if ($mailer === 'smtp') {
            $host = config('mail.mailers.smtp.host');
            $port = (int) (config('mail.mailers.smtp.port') ?: 587);
            if (! config('mail.mailers.smtp.username') || ! $host) {
                return [
                    'sent' => false,
                    'provider' => 'smtp',
                    'skippedReason' => 'SMTP is not configured (MAIL_HOST/MAIL_USERNAME/MAIL_PASSWORD in .env)',
                ];
            }
            // Fast probe to avoid 60-second connection timeouts when cloud firewalls block outbound SMTP
            $fp = @fsockopen($host, $port, $errno, $errstr, 1.5);
            if (! $fp) {
                Log::warning("SMTP port {$port} on {$host} is unreachable/blocked ({$errstr}). Skipping SMTP fallback.");
                return [
                    'sent' => false,
                    'provider' => 'smtp',
                    'skippedReason' => "SMTP port {$port} unreachable/blocked on this server.",
                ];
            }
            fclose($fp);
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
     * Send 6-digit OTP verification email for Two-Factor Authentication Login.
     */
    public static function sendTwoFactorOtp(string $to, string $code, string $name = 'Member'): array
    {
        $destination = trim($to);
        $title = "FordaGO Security Code: {$code}";
        $plainText = "FordaGO: Your 2-Factor Login verification code is {$code}. It expires in 60 minutes. If you didn't request this, ignore this message.";

        if ($destination === '' || $code === '') {
            return ['sent' => false, 'skippedReason' => 'Missing destination email or code'];
        }

        // Render beautiful HTML template
        $htmlContent = null;
        try {
            $htmlContent = View::make('emails.password-reset-otp', [
                'code'        => $code,
                'name'        => $name,
                'heading'     => 'Two-Factor Authentication',
                'subtitle'    => 'We received a sign-in request for your FordaGO account. Use the 6-digit verification code below to complete your login:',
                'instruction' => 'Enter this code on the FordaGO login verification screen to sign in.',
            ])->render();
        } catch (\Throwable $e) {
            Log::warning('Failed rendering Blade email template: ' . $e->getMessage());
        }

        // 1. Resend API (Lightning fast ~0.4s delivery)
        $resendKey = config('services.resend.key');
        if ($resendKey) {
            $resendResult = self::sendViaResend($destination, $title, $plainText, $htmlContent);
            if (!empty($resendResult['sent'])) {
                return $resendResult;
            }
        }

        // 2. Brevo API (Universal fallback)
        $brevoKey = config('services.brevo.key');
        if ($brevoKey) {
            $brevoResult = self::sendViaBrevo($destination, $title, $plainText, $htmlContent);
            if (!empty($brevoResult['sent'])) {
                return $brevoResult;
            }
        }

        return ['sent' => false, 'provider' => 'none'];
    }

    /**
     * Send 6-digit OTP verification email for Password Reset.
     */
    public static function sendPasswordResetOtp(string $to, string $code, string $name = 'Member'): array
    {
        $destination = trim($to);
        $title = "FordaGO Security Code: {$code}";
        $plainText = "FordaGO: Your verification code is {$code}. It expires in 60 minutes. If you didn't request this, ignore this message.";

        if ($destination === '' || $code === '') {
            return ['sent' => false, 'skippedReason' => 'Missing destination email or code'];
        }

        // Render beautiful HTML template
        $htmlContent = null;
        try {
            $htmlContent = View::make('emails.password-reset-otp', [
                'code'        => $code,
                'name'        => $name,
                'heading'     => 'Password Reset Request',
                'subtitle'    => 'We received a request to reset the password for your FordaGO account. Use the 6-digit one-time password (OTP) below to proceed:',
                'instruction' => 'Enter this code into the FordaGO app to choose a new password.',
            ])->render();
        } catch (\Throwable $e) {
            Log::warning('Failed rendering Blade email template: ' . $e->getMessage());
        }

        // 1. Resend API (Lightning fast ~0.4s delivery)
        $resendKey = config('services.resend.key');
        if ($resendKey) {
            $resendResult = self::sendViaResend($destination, $title, $plainText, $htmlContent);
            if (!empty($resendResult['sent'])) {
                return $resendResult;
            }
        }

        // 2. Brevo API (Universal fallback)
        $brevoKey = config('services.brevo.key');
        if ($brevoKey) {
            $brevoResult = self::sendViaBrevo($destination, $title, $plainText, $htmlContent);
            if (!empty($brevoResult['sent'])) {
                return $brevoResult;
            }
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

        if ($mailer === 'smtp') {
            $host = config('mail.mailers.smtp.host');
            $port = (int) (config('mail.mailers.smtp.port') ?: 587);
            if (! config('mail.mailers.smtp.username') || ! $host) {
                return [
                    'sent' => false,
                    'provider' => 'smtp',
                    'skippedReason' => 'SMTP is not configured (MAIL_HOST/MAIL_USERNAME/MAIL_PASSWORD in .env)',
                ];
            }
            // Fast probe to avoid 60-second connection timeouts when cloud firewalls block outbound SMTP
            $fp = @fsockopen($host, $port, $errno, $errstr, 1.5);
            if (! $fp) {
                Log::warning("SMTP port {$port} on {$host} is unreachable/blocked ({$errstr}). Skipping SMTP fallback.");
                return [
                    'sent' => false,
                    'provider' => 'smtp',
                    'skippedReason' => "SMTP port {$port} unreachable/blocked on this server.",
                ];
            }
            fclose($fp);
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
            $client = Http::withToken($apiKey)->timeout(8);
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
            $client = Http::withHeaders([
                'api-key'      => $apiKey,
                'Content-Type' => 'application/json',
                'Accept'       => 'application/json',
            ])
            ->timeout(8);
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
    private static array $dnsResolveCache = [];

    private static function getCurlResolve(string $host, int $port = 443): array
    {
        $cacheKey = "{$host}:{$port}";
        if (isset(self::$dnsResolveCache[$cacheKey])) {
            return self::$dnsResolveCache[$cacheKey];
        }

        $staticFallbacks = [
            'api.resend.com'        => ['104.20.29.242', '172.66.165.132'],
            'api.brevo.com'         => ['185.107.232.253', '185.107.232.254', '1.179.112.50'],
            'app.philsms.com'       => ['172.67.143.149', '104.21.32.186'],
            'dashboard.philsms.com' => ['172.67.194.35', '104.21.92.130'],
            'api.semaphore.co'      => ['104.26.2.82', '172.67.70.198'],
        ];

        $resolvedIps = $staticFallbacks[$host] ?? [];

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

        return self::$dnsResolveCache[$cacheKey] = $entries;
    }
}
