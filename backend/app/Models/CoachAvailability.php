<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CoachAvailability extends Model
{
    protected $table = 'coach_availability';

    protected $fillable = [
        'coach_id',
        'day_of_week',
        'start_time',
        'end_time',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'day_of_week' => 'integer',
            'is_active'   => 'boolean',
        ];
    }

    public function coach()
    {
        return $this->belongsTo(User::class, 'coach_id');
    }
}
