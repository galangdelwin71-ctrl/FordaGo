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
        'stock',
        'image_url',
        'thumbnail_url',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'created_at' => 'datetime',
        ];
    }

    public function orders()
    {
        return $this->hasMany(Order::class);
    }
}
