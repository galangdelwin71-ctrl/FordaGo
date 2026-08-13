<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('attendance')) {
            return;
        }

        Schema::create('attendance', function (Blueprint $table) {
            $table->increments('id');
            $table->integer('user_id');
            $table->dateTime('check_in_time')->useCurrent();
            $table->enum('membership_type', ['daily', 'premium'])->default('premium');
            $table->enum('payment_status', ['pending', 'paid'])->default('paid');
            $table->integer('confirmed_by')->nullable();
            $table->dateTime('confirmed_at')->nullable();
            $table->text('notes')->nullable();

            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attendance');
    }
};
