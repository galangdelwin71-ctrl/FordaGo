<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ActivityLog extends Model
{
    protected $table = 'activity_logs';

    protected $fillable = [
        'user_id',
        'username',
        'full_name',
        'role',
        'action_type',
        'action_title',
        'description',
        'entity_type',
        'entity_id',
        'details',
        'ip_address',
        'user_agent',
        'login_at',
        'logout_at',
    ];

    protected $casts = [
        'details'   => 'array',
        'login_at'  => 'datetime',
        'logout_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
