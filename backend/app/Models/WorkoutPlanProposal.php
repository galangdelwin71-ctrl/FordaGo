<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WorkoutPlanProposal extends Model
{
    protected $table = 'workout_plan_proposals';

    protected $fillable = [
        'conversation_id',
        'coach_id',
        'client_id',
        'session_date',
        'time_val',
        'time_ampm',
        'duration_minutes',
        'price',
        'location',
        'status',
        'message_id',
        'accepted_at',
    ];

    protected function casts(): array
    {
        return [
            'session_date'     => 'date',
            'duration_minutes' => 'integer',
            'price'            => 'decimal:2',
            'accepted_at'      => 'datetime',
        ];
    }

    // ── Relationships ────────────────────────────────

    public function conversation()
    {
        return $this->belongsTo(Conversation::class);
    }

    public function coach()
    {
        return $this->belongsTo(User::class, 'coach_id');
    }

    public function client()
    {
        return $this->belongsTo(User::class, 'client_id');
    }

    public function message()
    {
        return $this->belongsTo(Message::class);
    }

    public function items()
    {
        return $this->hasMany(WorkoutPlanItem::class, 'proposal_id')->orderBy('order');
    }

    // ── Helpers ──────────────────────────────────────

    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    public function isAccepted(): bool
    {
        return $this->status === 'accepted';
    }
}
