<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('conversations', function (Blueprint $table) {
            $table->increments('id');

            $table->integer('coach_id');
            $table->foreign('coach_id')->references('id')->on('users')->cascadeOnDelete();

            $table->integer('client_id');
            $table->foreign('client_id')->references('id')->on('users')->cascadeOnDelete();

            $table->timestamps();

            // One conversation thread per coach-client pair
            $table->unique(['coach_id', 'client_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('conversations');
    }
};
