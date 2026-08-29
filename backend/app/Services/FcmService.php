<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;

/**
 * Firebase Cloud Messaging (HTTP v1 API) service.
 *
 * Sends push notifications directly to Android/iOS devices via FCM.
 * This fires even when the app is closed or backgrounded — the OS
 * wakes the device and delivers the notification without needing a
 * WebSocket connection from the app.
 *
 * Setup required:
 *  1. Add FIREBASE_PROJECT_ID and FIREBASE_SERVICE_ACCOUNT_JSON to .env
 *  2. The service account JSON is downloaded from Firebase Console →
 *     Project Settings → Service Accounts → Generate new private key.
 */
class FcmService
{
    private string $projectId;
    private ?array $serviceAccount;

    public function __construct()
    {
        $this->projectId = config('services.firebase.project_id', 'fordago-18588');
        
        $serviceAccountJson = config('services.firebase.service_account_json', '');
        if (is_array($serviceAccountJson)) {
            $this->serviceAccount = $serviceAccountJson;
        } elseif (is_string($serviceAccountJson) && trim($serviceAccountJson) !== '') {
            $this->serviceAccount = json_decode($serviceAccountJson, true);
        } else {
            $filePath = storage_path('app/firebase-service-account.json');
            if (file_exists($filePath)) {
                $this->serviceAccount = json_decode(file_get_contents($filePath), true);
            } else {
                $this->serviceAccount = null;
            }
        }
    }

    /**
     * Send a data + notification push to a single FCM token.
     *
     * @param  string  $fcmToken   Device FCM registration token
     * @param  string  $title      Notification title
     * @param  string  $body       Notification body text
     * @param  array   $data       Extra key-value payload (strings only)
     */
    public function sendToToken(string $fcmToken, string $title, string $body, array $data = []): bool
    {
        if (! $this->projectId || ! $this->serviceAccount) {
            Log::warning('FCM: Not configured — FIREBASE_PROJECT_ID or FIREBASE_SERVICE_ACCOUNT_JSON missing.');
            return false;
        }

        try {
            $accessToken = $this->getAccessToken();
            if (! $accessToken) {
                return false;
            }

            $isChat = ($data['type'] ?? '') === 'chat';

            if ($isChat) {
                // High-priority DATA message for Chat:
                // Android delivers this to FordaGoFirebaseMessagingService.java onMessageReceived,
                // which creates the Messenger-style notification with Circular Avatar,
                // small FordaGO badge, inline Direct Reply textfield, and checks isConversationMuted.
                $messagePayload = [
                    'token' => $fcmToken,
                    'data'  => array_merge([
                        'title' => (string) $title,
                        'body'  => (string) $body,
                    ], array_map('strval', $data)),
                    'android' => [
                        'priority' => 'high',
                    ],
                ];
            } else {
                $messagePayload = [
                    'token' => $fcmToken,
                    'notification' => [
                        'title' => (string) $title,
                        'body'  => (string) $body,
                    ],
                    'data'  => array_merge([
                        'title' => (string) $title,
                        'body'  => (string) $body,
                    ], array_map('strval', $data)),
                    'android' => [
                        'priority' => 'high',
                        'notification' => [
                            'channel_id'   => 'fordago-alerts-v3',
                            'icon'         => 'ic_stat_icon',
                            'color'        => '#FFD700',
                            'click_action' => 'FLUTTER_NOTIFICATION_CLICK',
                        ],
                    ],
                ];
            }

            $payload = ['message' => $messagePayload];

            $url = "https://fcm.googleapis.com/v1/projects/{$this->projectId}/messages:send";

            $response = Http::withToken($accessToken)
                ->timeout(3)
                ->post($url, $payload);

            if ($response->successful()) {
                return true;
            }

            if ($response->status() === 404 || str_contains($response->body(), 'UNREGISTERED')) {
                \App\Models\User::where('fcm_token', $fcmToken)->update(['fcm_token' => null]);
            }

            Log::warning('FCM send failed', [
                'status' => $response->status(),
                'body'   => $response->body(),
            ]);
            return false;

        } catch (\Throwable $e) {
            Log::error('FCM exception: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Send a notification to all registered Admin and Super Admin devices.
     */
    public function sendToAdmins(string $title, string $body, array $data = []): int
    {
        try {
            $adminTokens = \App\Models\User::whereIn('role', ['admin', 'super_admin'])
                ->whereNotNull('fcm_token')
                ->pluck('fcm_token')
                ->filter(fn ($t) => ! empty(trim((string) $t)))
                ->unique();

            $sent = 0;
            foreach ($adminTokens as $token) {
                if ($this->sendToToken($token, $title, $body, $data)) {
                    $sent++;
                }
            }
            return $sent;
        } catch (\Throwable $e) {
            Log::warning('FCM sendToAdmins failed: ' . $e->getMessage());
            return 0;
        }
    }

    /**
     * Send a notification to a specific user by user ID.
     */
    public function sendToUser(int $userId, string $title, string $body, array $data = []): bool
    {
        try {
            $user = \App\Models\User::find($userId);
            if (! $user || ! $user->fcm_token) {
                return false;
            }
            return $this->sendToToken($user->fcm_token, $title, $body, $data);
        } catch (\Throwable $e) {
            Log::warning("FCM sendToUser({$userId}) failed: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Send a notification to all registered users (broadcast).
     */
    public function sendToAllUsers(string $title, string $body, array $data = []): int
    {
        try {
            $tokens = \App\Models\User::whereNotNull('fcm_token')
                ->pluck('fcm_token')
                ->filter(fn ($t) => ! empty(trim((string) $t)))
                ->unique();

            $sent = 0;
            foreach ($tokens as $token) {
                if ($this->sendToToken($token, $title, $body, $data)) {
                    $sent++;
                }
            }
            return $sent;
        } catch (\Throwable $e) {
            Log::warning('FCM sendToAllUsers failed: ' . $e->getMessage());
            return 0;
        }
    }

    /**
     * Get a short-lived OAuth2 access token from the service account credentials
     * using Google's JWT Bearer flow (no external SDK needed).
     */
    private function base64UrlEncode(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    /**
     * Get a short-lived OAuth2 access token from the service account credentials
     * using Google's JWT Bearer flow (no external SDK needed).
     * Cached in Laravel Cache for 50 minutes to eliminate latency on every message.
     */
    private function getAccessToken(): ?string
    {
        return \Illuminate\Support\Facades\Cache::remember('fcm_google_access_token', 3000, function () {
            try {
                $sa = $this->serviceAccount;
                if (! $sa || empty($sa['private_key']) || empty($sa['client_email'])) {
                    Log::warning('FCM: Service account JSON is missing private_key or client_email.');
                    return null;
                }

                $now = time();
                $header  = $this->base64UrlEncode(json_encode(['alg' => 'RS256', 'typ' => 'JWT']));
                $payload = $this->base64UrlEncode(json_encode([
                    'iss'   => $sa['client_email'],
                    'scope' => 'https://www.googleapis.com/auth/firebase.messaging',
                    'aud'   => 'https://oauth2.googleapis.com/token',
                    'iat'   => $now,
                    'exp'   => $now + 3600,
                ]));

                // Unescape newlines in private key if loaded from JSON string in .env
                $privateKey = str_replace(["\\n", '\n'], "\n", $sa['private_key']);

                $signingInput = "{$header}.{$payload}";
                $signSuccess = openssl_sign($signingInput, $signature, $privateKey, 'SHA256');

                if (! $signSuccess) {
                    Log::error('FCM: openssl_sign failed: ' . openssl_error_string());
                    return null;
                }

                $jwt = "{$signingInput}." . $this->base64UrlEncode($signature);

                $response = Http::asForm()
                    ->timeout(4)
                    ->post('https://oauth2.googleapis.com/token', [
                        'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                        'assertion'  => $jwt,
                    ]);

                if ($response->successful()) {
                    return $response->json('access_token');
                }

                Log::warning('FCM: Failed to get access token', ['body' => $response->body()]);
                return null;

            } catch (\Throwable $e) {
                Log::error('FCM: Access token exception: ' . $e->getMessage());
                return null;
            }
        });
    }
}
