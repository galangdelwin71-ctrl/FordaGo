<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Maps to the `sessions` table — this is the GYM CLASS SCHEDULE
 * (title/date/time/location/coach), unrelated to Laravel's own session
 * storage. Named ClassSession (not Session) to avoid confusion with
 * Illuminate's Session facade.
 */
class ClassSession extends Model
{
    protected $table = 'sessions';

    public $timestamps = false;

    protected $fillable = [
        'title',
        'date',
        'time',
        'location',
        'coach',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'created_at' => 'datetime',
        ];
    }
}
