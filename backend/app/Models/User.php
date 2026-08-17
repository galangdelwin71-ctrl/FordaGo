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
    'membership_type',
    'payment_method',
    'membership_expiry',
    'profile_image',
    'membership_status',
    'first_name',
    'last_name',
])]
#[Hidden(['password'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    // `created_at` exists (added by 2026_08_11_095900_add_created_at_to_users_table)
    // but there is still no `updated_at` column, so Eloquent's automatic
    // dual-timestamp management stays off. created_at is populated by the
    // DB column default (useCurrent()) on insert, not by Eloquent.
    public $timestamps = false;

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
            'created_at' => 'datetime',
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
}
