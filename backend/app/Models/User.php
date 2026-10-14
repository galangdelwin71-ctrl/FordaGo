<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

#[Fillable([
    'username',
    'email',
    'password',
    'role',
    'phone',
    'gender',
    'date_of_birth',
    'membership_type',
    'payment_method',
    'membership_expiry',
    'profile_image',
    'membership_status',
    'first_name',
    'last_name',
    'fcm_token',
    'height',
    'weight',
    'bmi',
    'fitness_goal',
    'preferred_workout_time',
    'two_factor_enabled',
    'two_factor_channel',
    'two_factor_code',
    'two_factor_expires_at',
    'biometric_enabled',
    'biometric_credential_id',
    'biometric_token_hash',
    'biometric_device_name',
    'has_seen_guide',
])]
#[Hidden(['password', 'two_factor_code', 'biometric_token_hash'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    // `created_at` exists (added by 2026_08_11_095900_add_created_at_to_users_table)
    // but there is still no `updated_at` column, so Eloquent's automatic
    // dual-timestamp management stays off. created_at is populated by the
    // DB column default (useCurrent()) on insert, not by Eloquent.
    public $timestamps = false;

    protected $appends = [
        'full_name',
    ];

    public function getFullNameAttribute(): string
    {
        $first = trim((string) $this->first_name);
        $last = trim((string) $this->last_name);
        if ($first !== '' || $last !== '') {
            return trim($first . ' ' . $last);
        }
        return (string) ($this->username ?? '');
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'password' => 'hashed',
            'membership_expiry' => 'date',
            'date_of_birth' => 'date',
            'created_at' => 'datetime',
            'height'   => 'float',
            'weight'   => 'float',
            'bmi'      => 'float',
            'two_factor_enabled' => 'boolean',
            'biometric_enabled'  => 'boolean',
            'has_seen_guide'     => 'boolean',
            'two_factor_expires_at' => 'datetime',
        ];
    }

    // The real `users` table has no remember_token column, so disable
    // Laravel's "remember me" cookie support rather than let it try to
    // write to a column that doesn't exist.
    public function getRememberToken()
    {
        return null;
    }

    public function setRememberToken($value)
    {
        // no-op: column doesn't exist
    }

    public function getRememberTokenName()
    {
        return '';
    }

    // ── Coaching relationships ────────────────────────

    public function coachProfile()
    {
        return $this->hasOne(CoachProfile::class);
    }

    /**
     * Conversations where this user is the coach.
     */
    public function coachConversations()
    {
        return $this->hasMany(Conversation::class, 'coach_id');
    }

    /**
     * Conversations where this user is the client.
     */
    public function clientConversations()
    {
        return $this->hasMany(Conversation::class, 'client_id');
    }

    public function isCoach(): bool
    {
        return $this->coachProfile()->exists();
    }

    /** Weekly availability slots this user set up as a coach. */
    public function coachAvailability()
    {
        return $this->hasMany(CoachAvailability::class, 'coach_id');
    }

    /** Reusable workout plan templates this user built as a coach. */
    public function coachPrograms()
    {
        return $this->hasMany(CoachProgram::class, 'coach_id');
    }

    /**
     * Check if user's premium membership has expired.
     * If expired, revert to daily pass and send notification.
     */
    public function checkAndExpireMembership(): bool
    {
        if ($this->membership_type === 'premium' && $this->membership_expiry) {
            $expiry = \Carbon\Carbon::parse($this->membership_expiry, 'Asia/Manila')->endOfDay();
            if (\Carbon\Carbon::now('Asia/Manila')->gt($expiry)) {
                $this->membership_type = 'daily';
                $this->membership_status = 'active';
                $this->membership_expiry = null;
                $this->save();

                try {
                    $sessionKey = "premium-expired-{$this->id}-" . \Carbon\Carbon::now('Asia/Manila')->toDateString();
                    if (! Notification::where('session_key', $sessionKey)->exists()) {
                        $title = 'Premium Membership Expired ⚠️';
                        $message = 'Your Premium Pass has expired as the validity period has ended. Your account is now set to Daily Pass (₱40/session). You may renew or upgrade your membership anytime.';

                        $notification = Notification::create([
                            'user_id'     => $this->id,
                            'session_key' => $sessionKey,
                            'title'       => $title,
                            'message'     => $message,
                            'is_read'     => false,
                        ]);

                        try {
                            broadcast(new \App\Events\NotificationSent($notification, $this->id));
                        } catch (\Throwable $e) {}

                        try {
                            app(\App\Services\FcmService::class)->sendToUser($this->id, $title, $message, [
                                'type'        => 'membership_expired',
                                'targetRoute' => '/profile',
                                'channel_id'  => 'fordago-alerts-v3',
                            ]);
                        } catch (\Throwable $e) {}
                    }
                } catch (\Throwable $e) {
                    \Log::warning('Failed to send expiry notification: ' . $e->getMessage());
                }

                return true;
            }

            // Also check and deliver advance notice if expiring in <= 7 days
            $this->checkExpiringMembershipNotification();
        }
        return false;
    }

    /**
     * Check if user's premium membership is expiring within 7 days.
     * If so, send advance notice notification, WebSocket event, and FCM push to the member.
     */
    public function checkExpiringMembershipNotification(bool $force = false): bool
    {
        if ($this->membership_type !== 'premium' || ! $this->membership_expiry) {
            return false;
        }

        $now = \Carbon\Carbon::now('Asia/Manila')->startOfDay();
        $expiry = \Carbon\Carbon::parse($this->membership_expiry, 'Asia/Manila')->startOfDay();
        $diffInDays = (int) $now->diffInDays($expiry, false);

        // Only alert if between 0 and 7 days left (or if forced by admin)
        if (! $force && ($diffInDays < 0 || $diffInDays > 7)) {
            return false;
        }

        $firstName = $this->first_name ?: $this->username;
        $formattedExpiry = $expiry->format('F d, Y');

        if ($diffInDays <= 0) {
            $milestone = 'today';
            $title = 'Premium Membership Expires Today! ⚠️';
            $message = "Hi {$firstName}, your Premium membership expires today ({$formattedExpiry}). Renew today at the gym reception or via the app to maintain uninterrupted gym access!";
        } elseif ($diffInDays === 1) {
            $milestone = '1d';
            $title = 'Premium Membership Expires Tomorrow! ⏳';
            $message = "Hi {$firstName}, your Premium membership expires tomorrow on {$formattedExpiry}. Please renew your plan at the gym reception or via the app.";
        } elseif ($diffInDays <= 3) {
            $milestone = '3d';
            $title = "Premium Membership Expiring in {$diffInDays} Days ⏳";
            $message = "Hi {$firstName}, your Premium membership will expire in {$diffInDays} days on {$formattedExpiry}. Renew your plan early to keep your unlimited gym access active.";
        } else {
            $milestone = '7d';
            $title = 'Premium Membership Expiring Soon ⏳';
            $message = "Hi {$firstName}, your Premium membership will expire in {$diffInDays} days on {$formattedExpiry}. Please renew your plan at the gym reception or via the app to maintain unlimited gym access.";
        }

        $sessionKey = "premium-exp-{$milestone}-{$this->id}-{$expiry->toDateString()}";

        if (! $force) {
            $alreadyNotified = Notification::where('session_key', $sessionKey)->exists();
            if ($alreadyNotified) {
                return false;
            }
        } else {
            $sessionKey = "manual-reminder-{$this->id}-" . \Carbon\Carbon::now('Asia/Manila')->format('YmdHis');
        }

        try {
            $notification = Notification::create([
                'user_id'     => $this->id,
                'session_key' => $sessionKey,
                'title'       => $title,
                'message'     => $message,
                'is_read'     => false,
            ]);

            // Real-time WebSocket delivery
            try {
                broadcast(new \App\Events\NotificationSent($notification, $this->id));
            } catch (\Throwable $e) {
                \Log::warning("WebSocket broadcast failed for user {$this->id}: " . $e->getMessage());
            }

            // Direct FCM push notification
            try {
                app(\App\Services\FcmService::class)->sendToUser($this->id, $title, $message, [
                    'type'        => 'membership_expiring',
                    'targetRoute' => '/profile',
                    'channel_id'  => 'fordago-alerts-v3',
                ]);
            } catch (\Throwable $e) {
                \Log::warning("FCM push failed for user {$this->id}: " . $e->getMessage());
            }

            return true;
        } catch (\Throwable $e) {
            \Log::warning('Failed to create expiring membership notification: ' . $e->getMessage());
            return false;
        }
    }
}
