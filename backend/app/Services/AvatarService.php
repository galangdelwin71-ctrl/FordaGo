<?php

namespace App\Services;

use Illuminate\Support\Facades\Storage;

class AvatarService
{
    /**
     * Process an incoming avatar string (base64 data URL or path) and save as a public file.
     * Returns a public storage URL (or absolute URL).
     */
    public static function processAvatar(?string $avatarInput, int $userId): ?string
    {
        if (! $avatarInput || trim($avatarInput) === '') {
            return null;
        }

        $avatarInput = trim($avatarInput);

        // If already a regular /storage or http URL, return it
        if (! str_starts_with($avatarInput, 'data:image')) {
            return $avatarInput;
        }

        try {
            $parts = explode(',', $avatarInput, 2);
            if (count($parts) !== 2) {
                return null;
            }

            $data = base64_decode($parts[1]);
            if (! $data) {
                return null;
            }

            $extension = 'jpg';
            if (preg_match('#^data:image/(\w+);#', $parts[0], $match)) {
                $ext = strtolower($match[1]);
                if (in_array($ext, ['png', 'jpg', 'jpeg', 'webp', 'gif'], true)) {
                    $extension = $ext === 'jpeg' ? 'jpg' : $ext;
                }
            }

            $filename = "avatars/user_{$userId}." . $extension;
            Storage::disk('public')->put($filename, $data);

            return '/storage/' . $filename . '?v=' . time();
        } catch (\Throwable $e) {
            \Log::warning("AvatarService failed to store avatar for user {$userId}: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Get absolute full URL for an avatar, suitable for FCM payload or client app.
     */
    public static function getFullUrl(?string $avatarPath, int $userId = 0): ?string
    {
        if (! $avatarPath || trim($avatarPath) === '') {
            return null;
        }

        $avatarPath = trim($avatarPath);

        // If it is a base64 string that was stored in DB, convert to file on-the-fly
        if (str_starts_with($avatarPath, 'data:image')) {
            $converted = self::processAvatar($avatarPath, $userId ?: rand(1000, 9999));
            if ($converted) {
                $avatarPath = $converted;
            } else {
                return null;
            }
        }

        if (str_starts_with($avatarPath, 'http://') || str_starts_with($avatarPath, 'https://')) {
            return $avatarPath;
        }

        return url($avatarPath);
    }
}
