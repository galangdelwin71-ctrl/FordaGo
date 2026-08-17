<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProgramBooking extends Model
{
    protected $table = 'program_bookings';

    protected $fillable = [
        'program_id',
        'member_id',
        'status',
        'payment_status',
        'booked_at',
    ];

    protected function casts(): array
    {
        return [
            'booked_at' => 'datetime',
        ];
    }

    public const STATUS_BOOKED    = 'booked';
    public const STATUS_CANCELLED = 'cancelled';

    // ── Relationships ────────────────────────────────

    public function program()
    {
        return $this->belongsTo(CoachProgram::class, 'program_id');
    }

    public function member()
    {
        return $this->belongsTo(User::class, 'member_id');
    }

    // ── Helpers ──────────────────────────────────────

    public function isBooked(): bool
    {
        return $this->status === self::STATUS_BOOKED;
    }
}
