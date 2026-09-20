<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('payments')) {
            return;
        }

        Schema::create('payments', function (Blueprint $table) {
            $table->increments('id');
            $table->integer('user_id')->nullable();
            $table->string('receipt_number', 50)->unique();
            $table->enum('payment_for', ['membership', 'order', 'attendance', 'program', 'proposal'])->default('membership');
            $table->string('related_id', 100)->nullable()->index(); // order_group_id, program_id, etc.
            $table->decimal('amount', 10, 2);
            $table->decimal('fee', 10, 2)->default(0.00);
            $table->string('currency', 10)->default('PHP');
            $table->enum('payment_channel', ['gcash', 'paymaya', 'card', 'cash'])->default('gcash');
            $table->enum('status', ['pending', 'paid', 'failed', 'cancelled'])->default('pending');
            $table->string('gateway', 30)->default('paymongo'); // 'paymongo', 'manual_counter'
            $table->string('gateway_session_id', 120)->nullable()->index();
            $table->string('gateway_payment_id', 120)->nullable()->index();
            $table->json('items_breakdown')->nullable();
            $table->json('customer_details')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
