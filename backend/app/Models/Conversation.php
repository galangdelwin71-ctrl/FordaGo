<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Conversation extends Model
{
    protected $table = 'conversations';

    protected $fillable = [
        'coach_id',
        'client_id',
        'status',
    ];

    // Keep these in one place instead of repeating the literal strings —
    // controllers and any future code should compare against these.
    public const STATUS_PENDING  = 'pending';
    public const STATUS_ACTIVE   = 'active';
    public const STATUS_DECLINED = 'declined';

    // ── Relationships ────────────────────────────────

    public function coach()
    {
        return $this->belongsTo(User::class, 'coach_id');
    }

    public function client()
    {
        return $this->belongsTo(User::class, 'client_id');
    }

    public function messages()
    {
        return $this->hasMany(Message::class);
    }

    public function proposals()
    {
        return $this->hasMany(WorkoutPlanProposal::class);
    }

    /**
     * Latest message (for conversation list preview).
     */
    public function latestMessage()
    {
        return $this->hasOne(Message::class)->latestOfMany();
    }

    // ── Status helpers ───────────────────────────────

    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    public function isActive(): bool
    {
        return $this->status === self::STATUS_ACTIVE;
    }

    public function isDeclined(): bool
    {
        return $this->status === self::STATUS_DECLINED;
    }
}
