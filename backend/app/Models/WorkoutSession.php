<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WorkoutSession extends Model
{
    protected $table = 'workout_sessions';

    protected $fillable = [
        'user_id',
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
}
