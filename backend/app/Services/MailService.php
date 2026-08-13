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

        if ($mailer === 'smtp' && (! config('mail.mailers.smtp.username') || ! config('mail.mailers.smtp.host'))) {
            return ['sent' => false, 'skippedReason' => 'SMTP is not configured (MAIL_HOST/MAIL_USERNAME/MAIL_PASSWORD)'];
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
}
