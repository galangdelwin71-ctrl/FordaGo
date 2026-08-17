<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('coach_program_items', function (Blueprint $table) {
            $table->increments('id');

            $table->unsignedInteger('program_id');
            $table->foreign('program_id')->references('id')->on('coach_programs')->cascadeOnDelete();

            $table->string('name');                        // exercise name
            $table->text('description')->nullable();
            $table->unsignedInteger('sets')->default(3);
            $table->unsignedInteger('reps')->default(10);
            $table->unsignedInteger('order')->default(0);  // display order

            $table->timestamps();

            $table->index('program_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('coach_program_items');
    }
};
