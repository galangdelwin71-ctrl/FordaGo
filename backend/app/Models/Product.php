<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    protected $table = 'products';

    public $timestamps = false;

    protected $fillable = [
        'name',
        'brand',
        'price',
        'cost_price',
        'stock',
        'expiry_date',
        'image_url',
        'thumbnail_url',
    ];

    /**
     * Hidden attributes for arrays and JSON serialization.
     * Prevents wholesale cost price from leaking to non-administrative clients.
     */
    protected $hidden = [
        'cost_price',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'cost_price' => 'decimal:2',
            'expiry_date' => 'date:Y-m-d',
            'created_at' => 'datetime',
        ];
    }

    public function orders()
    {
        return $this->hasMany(Order::class);
    }
}
