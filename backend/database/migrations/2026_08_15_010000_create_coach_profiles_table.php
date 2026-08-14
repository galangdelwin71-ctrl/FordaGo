<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('coach_profiles', function (Blueprint $table) {
            // increments() to match users.id (int(11)) — see
            // 2026_08_07_120000_document_existing_users_table.php
            $table->increments('id');

            $table->integer('user_id')->unique();
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();

            $table->text('bio')->nullable();
            $table->string('specialty')->nullable();       // e.g. "Strength Training"
            $table->text('photo_url')->nullable();          // profile photo for coach card
            $table->decimal('rate', 10, 2)->default(0.00); // hourly/session rate

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('coach_profiles');
    }
};
