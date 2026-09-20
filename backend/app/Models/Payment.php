<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    protected $table = 'payments';

    protected $fillable = [
        'user_id',
        'receipt_number',
        'payment_for',
        'related_id',
        'amount',
        'fee',
        'currency',
        'payment_channel',
        'status',
        'gateway',
        'gateway_session_id',
        'gateway_payment_id',
        'items_breakdown',
        'customer_details',
        'paid_at',
    ];

    protected function casts(): array
    {
        return [
            'amount'           => 'decimal:2',
            'fee'              => 'decimal:2',
            'items_breakdown'  => 'array',
            'customer_details' => 'array',
            'paid_at'          => 'datetime',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function isPaid(): bool
    {
        return $this->status === 'paid';
    }

    public static function generateReceiptNumber(): string
    {
        return 'FDG-' . date('Ymd') . '-' . strtoupper(substr(bin2hex(random_bytes(3)), 0, 6));
    }
}
