<?php

namespace App\Services;

use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

/**
 * Ported from server/services/email.js. Instead of a separate nodemailer
 * transporter, this uses Laravel's own Mail facade (config/mail.php,
 * driven by the MAIL_* env vars) so it participates in Laravel's queueing,
 * logging, and mailer-swapping (log/smtp/etc) for free.
 *
 * Same return shape as the Node version:
 *   ['sent' => bool, 'provider' => ?string, 'skippedReason' => ?string, 'error' => ?string]
 */
class MailService
{
    public static function send(string $to, string $subject, string $text): array
    {
        $destination = trim($to);
        $body = trim($text);
        $title = trim($subject) ?: 'FordaGO Notification';

        if ($destination === '' || $body === '') {
            return ['sent' => false, 'skippedReason' => 'Missing destination email or message'];
        }

        // With MAIL_MAILER=log (the local default), mail is written to the
        // log file instead of actually sent — still counts as "sent" so
        // forgot-password flows work in dev without SMTP configured.
        $mailer = config('mail.default');

        if ($mailer === 'log') {
            try {
                Mail::raw($body, function ($message) use ($destination, $title) {
                    $message->to($destination)->subject($title);
                });
            } catch (\Throwable) {
                // Ignore log writing failure
            }

            return [
                'sent' => false,
                'provider' => 'log',
                'skippedReason' => 'Email is set to log mode (MAIL_MAILER=log). Real SMTP is not configured in .env.',
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
            Mail::raw($body, function ($message) use ($destination, $title) {
                $message->to($destination)->subject($title);
            });

            return ['sent' => true, 'provider' => $mailer];
        } catch (\Throwable $e) {
            Log::warning('Email send failed', ['error' => $e->getMessage()]);

            return ['sent' => false, 'error' => $e->getMessage()];
        }
    }

    public static function sendPasswordResetOtp(string $to, string $code, string $name = 'Member'): array
    {
        $destination = trim($to);
        $title = 'FordaGO Password Reset Code';
        $plainText = "FordaGO: Your password reset code is {$code}. It expires in 10 minutes. If you didn't request this, ignore this message.";

        if ($destination === '' || $code === '') {
            return ['sent' => false, 'skippedReason' => 'Missing destination email or code'];
        }

        $mailer = config('mail.default');

        if ($mailer === 'log') {
            try {
                Mail::raw($plainText, function ($message) use ($destination, $title) {
                    $message->to($destination)->subject($title);
                });
            } catch (\Throwable) {
                // Ignore log writing failure
            }

            return [
                'sent' => false,
                'provider' => 'log',
                'skippedReason' => 'Email is set to log mode (MAIL_MAILER=log). Real SMTP is not configured in .env.',
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
            Mail::send('emails.password-reset-otp', [
                'code' => $code,
                'name' => $name,
            ], function ($message) use ($destination, $title) {
                $message->to($destination)->subject($title);
            });

            return ['sent' => true, 'provider' => $mailer];
        } catch (\Throwable $e) {
            Log::warning('HTML Email send failed, attempting plain text fallback', ['error' => $e->getMessage()]);

            // Fallback to plain text if Blade rendering encounters any issue
            try {
                Mail::raw($plainText, function ($message) use ($destination, $title) {
                    $message->to($destination)->subject($title);
                });

                return ['sent' => true, 'provider' => $mailer];
            } catch (\Throwable $e2) {
                return ['sent' => false, 'error' => $e2->getMessage()];
            }
        }
    }
}
