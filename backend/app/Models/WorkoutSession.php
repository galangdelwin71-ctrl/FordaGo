<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WorkoutSession extends Model
{
    protected $table = 'workout_sessions';

    protected $fillable = [
        'user_id',
        'coach_id',
        'proposal_id',
        'booking_id',
        'session_date',
        'client_session_id',
        'title',
        'is_rest_day',
        'status',
        'exercises',
        'actual_minutes',
        'started_at',
        'time_val',
        'time_ampm',
        'duration',
        'location',
        'coach',
        'custom_target',
    ];

    protected function casts(): array
    {
        return [
            'session_date'   => 'date',
            'is_rest_day'    => 'boolean',
            'exercises'      => 'array',
            'actual_minutes' => 'integer',
            'started_at'     => 'datetime',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /** Nullable: only set when this session came from an accepted coach proposal. */
    public function coach()
    {
        return $this->belongsTo(User::class, 'coach_id');
    }

    /** Nullable: the proposal that generated this session, if any. */
    public function proposal()
    {
        return $this->belongsTo(WorkoutPlanProposal::class, 'proposal_id');
    }

    /** Nullable: the public-class booking that generated this session, if any. */
    public function booking()
    {
        return $this->belongsTo(ProgramBooking::class, 'booking_id');
    }
}
