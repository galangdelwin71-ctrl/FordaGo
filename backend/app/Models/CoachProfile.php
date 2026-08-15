<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CoachProfile extends Model
{
    protected $table = 'coach_profiles';

    protected $fillable = [
        'user_id',
        'bio',
        'specialty',
        'photo_url',
        'rate',
        'is_active',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'rate'      => 'decimal:2',
            'is_active' => 'boolean',
        ];
    }

    // ── Relationships ────────────────────────────────

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /** The admin/super_admin who created this coach profile (audit trail). */
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function conversations()
    {
        return $this->hasMany(Conversation::class, 'coach_id', 'user_id');
    }
}
