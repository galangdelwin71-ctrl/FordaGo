<?php

namespace App\Console\Commands;

use App\Events\NotificationSent;
use App\Models\ActivityLog;
use App\Models\Notification;
use App\Models\User;
use App\Services\FcmService;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class CheckMembershipExpirations extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'memberships:check-expirations';

    /**
     * The console command aliases.
     *
     * @var array<int, string>
     */
    protected $aliases = ['members:check-expirations'];

    /**
     * The console command description.
     */
    protected $description = 'Audit Premium memberships for 7-day expiration notice and automatically convert expired accounts to Daily Pass';

    /**
     * Execute the console command.
     */
    public function handle(FcmService $fcmService): int
    {
        // Use Asia/Manila (PHT, UTC+8) timezone
        $now = Carbon::now('Asia/Manila');
        $todayStr = $now->toDateString();
        $sevenDaysAhead = $now->copy()->addDays(7)->toDateString();

        $this->info("Checking membership expirations for {$todayStr} (Asia/Manila)...");

        // ─────────────────────────────────────────────────────────────────────
        // PHASE 1: Advance Notice for Expiring Premium Memberships (<= 7 Days)
        // ─────────────────────────────────────────────────────────────────────
        $expiringUsers = User::whereIn('role', ['user', 'member'])
            ->where('membership_type', 'premium')
            ->where('membership_status', 'active')
            ->whereNotNull('membership_expiry')
            ->whereDate('membership_expiry', '>=', $todayStr)
            ->whereDate('membership_expiry', '<=', $sevenDaysAhead)
            ->get();

        $this->info("Found {$expiringUsers->count()} members expiring within the next 7 days (up to {$sevenDaysAhead}).");

        foreach ($expiringUsers as $user) {
            $sent = $user->checkExpiringMembershipNotification();
            if ($sent) {
                $this->line("Sent advance expiration notice to member: {$user->username} (ID: {$user->id}, Expiry: {$user->membership_expiry})");
            }
        }

        // ─────────────────────────────────────────────────────────────────────
        // PHASE 2: Automatically Convert Expired Memberships to Daily Pass
        // ─────────────────────────────────────────────────────────────────────
        $expiredUsers = User::whereIn('role', ['user', 'member'])
            ->where('membership_type', 'premium')
            ->whereNotNull('membership_expiry')
            ->whereDate('membership_expiry', '<', $todayStr)
            ->get();

        $this->info("Found {$expiredUsers->count()} expired Premium members to convert to Daily Pass.");

        foreach ($expiredUsers as $user) {
            $oldExpiry = $user->membership_expiry;
            $sessionKey = "premium-expired-{$user->id}-{$oldExpiry}";

            // Automatic Downgrade
            $user->membership_type = 'daily';
            $user->membership_status = 'active';
            $user->membership_expiry = null;
            $user->save();

            // Record system audit trail
            try {
                ActivityLog::create([
                    'user_id'      => $user->id,
                    'username'     => $user->username,
                    'full_name'    => trim(($user->first_name ?? '') . ' ' . ($user->last_name ?? '')) ?: $user->username,
                    'role'         => 'system',
                    'action_type'  => 'membership_downgrade',
                    'action_title' => 'Premium Plan Expired (Auto-Downgrade)',
                    'description'  => "Premium membership for {$user->username} expired on {$oldExpiry} and was automatically converted to Daily Pass.",
                    'entity_type'  => 'user',
                    'entity_id'    => (string) $user->id,
                ]);
            } catch (\Throwable $e) {
                Log::warning("ActivityLog creation failed for expired member {$user->id}: " . $e->getMessage());
            }

            // Send expiration and conversion notification
            $alreadyNotified = Notification::where('session_key', $sessionKey)->exists();
            if (! $alreadyNotified) {
                $firstName = $user->first_name ?: $user->username;
                $title = 'Premium Membership Expired ⚠️';
                $message = "Hi {$firstName}, your Premium membership has expired. Your account has been automatically converted to a Daily Pass. You can renew your Premium membership at any time.";

                $notification = Notification::create([
                    'user_id'     => $user->id,
                    'session_key' => $sessionKey,
                    'title'       => $title,
                    'message'     => $message,
                    'is_read'     => false,
                ]);

                // Real-time WebSocket delivery
                try {
                    broadcast(new NotificationSent($notification, $user->id));
                } catch (\Throwable $e) {
                    Log::warning("WebSocket broadcast failed for user {$user->id}: " . $e->getMessage());
                }

                // Direct FCM push notification
                $fcmService->sendToUser($user->id, $title, $message, [
                    'type'        => 'membership_expired',
                    'targetRoute' => '/profile',
                    'channel_id'  => 'fordago-alerts-v3',
                ]);
            }

            $this->line("Auto-converted expired member to Daily Pass: {$user->username} (ID: {$user->id})");
        }

        $this->info('Membership expiration audit completed successfully.');
        return 0;
    }
}
