<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('workout_plan_items', function (Blueprint $table) {
            $table->increments('id');

            $table->unsignedInteger('proposal_id');
            $table->foreign('proposal_id')->references('id')->on('workout_plan_proposals')->cascadeOnDelete();

            $table->string('name');                     // exercise name
            $table->text('description')->nullable();
            $table->unsignedInteger('sets')->default(0);
            $table->unsignedInteger('reps')->default(0);
            $table->unsignedInteger('order')->default(0); // display order

            $table->timestamps();

            $table->index('proposal_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('workout_plan_items');
    }
};
