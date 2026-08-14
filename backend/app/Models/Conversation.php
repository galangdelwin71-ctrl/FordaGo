<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Conversation extends Model
{
    protected $table = 'conversations';

    protected $fillable = [
        'coach_id',
        'client_id',
    ];

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
}
