<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EquipmentScanLog extends Model
{
    protected $table = 'equipment_scan_logs';

    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'equipment_id',
        'equipment_code',
        'equipment_name',
        'raw_qr',
        'scanned_at',
    ];

    protected function casts(): array
    {
        return [
            'scanned_at' => 'datetime',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function equipment()
    {
        return $this->belongsTo(Equipment::class);
    }
}
