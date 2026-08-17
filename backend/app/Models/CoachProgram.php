<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CoachProgram extends Model
{
    protected $table = 'coach_programs';

    protected $fillable = [
        'coach_id',
        'name',
        'workout_type',
        'target',
        'duration_minutes',
        'price',
        'description',
        'is_public',
        'capacity',
        'session_date',
        'time_val',
        'time_ampm',
        'location',
    ];

    protected function casts(): array
    {
        return [
            'duration_minutes' => 'integer',
            'price'            => 'decimal:2',
            'is_public'        => 'boolean',
            'capacity'         => 'integer',
            'session_date'     => 'date',
        ];
    }

    public function coach()
    {
        return $this->belongsTo(User::class, 'coach_id');
    }

    public function items()
    {
        return $this->hasMany(CoachProgramItem::class, 'program_id')->orderBy('order');
    }

    /** All booking attempts (booked + cancelled) for this public class. */
    public function bookings()
    {
        return $this->hasMany(ProgramBooking::class, 'program_id');
    }

    /** Only the currently-held seats — what counts against capacity. */
    public function activeBookings()
    {
        return $this->bookings()->where('status', ProgramBooking::STATUS_BOOKED);
    }

    // ── Helpers ──────────────────────────────────────

    /** Null capacity = unlimited seats, so it's never "full". */
    public function isFull(): bool
    {
        if ($this->capacity === null) {
            return false;
        }

        return $this->activeBookings()->count() >= $this->capacity;
    }

    public function spotsLeft(): ?int
    {
        if ($this->capacity === null) {
            return null;
        }

        return max(0, $this->capacity - $this->activeBookings()->count());
    }
}
