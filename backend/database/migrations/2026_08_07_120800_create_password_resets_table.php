<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('password_resets')) {
            return;
        }

        // NOTE: This is a CUSTOM OTP-style reset table (email or SMS code),
        // not Laravel's default `password_reset_tokens` table. We removed
        // Laravel's default one entirely (see migrations_unused/) so the app
        // keeps using this real flow instead of Laravel's built-in one.
        Schema::create('password_resets', function (Blueprint $table) {
            $table->increments('id');
            $table->integer('user_id');
            $table->enum('channel', ['email', 'sms']);
            $table->string('destination', 150);
            $table->string('code_hash', 128);
            $table->dateTime('expires_at');
            $table->integer('attempts')->default(0);
            $table->dateTime('verified_at')->nullable();
            $table->dateTime('password_changed_at')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('password_resets');
    }
};
