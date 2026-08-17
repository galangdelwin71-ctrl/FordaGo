<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Reusable workout plan templates a coach builds once and re-sends to
     * many clients ("Create Program" Quick Action). A program is proposed
     * to a specific client the same way a one-off plan is — see
     * coach_program_items below and ProposalController, which can hydrate
     * a proposal's items from a program instead of a blank form.
     */
    public function up(): void
    {
        Schema::create('coach_programs', function (Blueprint $table) {
            $table->increments('id');

            $table->integer('coach_id');
            $table->foreign('coach_id')->references('id')->on('users')->cascadeOnDelete();

            $table->string('name');
            $table->string('workout_type')->nullable();   // e.g. "Upper Body"
            $table->string('target')->nullable();          // e.g. "Back & Bicep"
            $table->unsignedInteger('duration_minutes')->default(60);
            $table->decimal('price', 10, 2)->nullable();
            $table->text('description')->nullable();

            $table->timestamps();

            $table->index('coach_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('coach_programs');
    }
};
