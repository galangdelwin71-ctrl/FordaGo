<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Equipment extends Model
{
    protected $table = 'equipment';

    public $timestamps = false;

    protected $fillable = [
        'name',
        'category',
        'icon',
        'status',
        'image_url',
        'thumbnail_url',
        'description',
        'weight_scale',
    ];

    protected function casts(): array
    {
        return [
            'created_at' => 'datetime',
        ];
    }

    public function scanLogs()
    {
        return $this->hasMany(EquipmentScanLog::class);
    }
}
