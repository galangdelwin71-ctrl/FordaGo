<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Ported from server/services/sms.js — same providers (Semaphore, Twilio),
 * same phone normalization rules, same return shape:
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
                'semaphore' => self::sendViaSemaphore($normalizedTo, $text),
                'twilio' => self::sendViaTwilio($normalizedTo, $text),
                default => ['sent' => false, 'skippedReason' => "Unsupported SMS provider: {$provider}"],
            };
        } catch (\Throwable $e) {
            Log::warning('SMS send failed', ['provider' => $provider, 'error' => $e->getMessage()]);

            return ['sent' => false, 'error' => $e->getMessage()];
        }
    }

    protected static function sendViaSemaphore(string $to, string $message): array
    {
        $apiKey = config('services.semaphore.api_key');
        $senderName = config('services.semaphore.sender', 'FordaGO');

        if (! $apiKey) {
            return ['sent' => false, 'skippedReason' => 'Missing SEMAPHORE_API_KEY'];
        }

        $response = Http::asForm()->post('https://api.semaphore.co/api/v4/messages', [
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
            throw new \RuntimeException("Twilio request failed: {$response->status()} {$response->body()}");
        }

        return ['sent' => true, 'provider' => 'twilio'];
    }
}
