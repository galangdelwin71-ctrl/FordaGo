<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('workout_plan_proposals', function (Blueprint $table) {
            $table->increments('id');

            $table->unsignedInteger('conversation_id');
            $table->foreign('conversation_id')->references('id')->on('conversations')->cascadeOnDelete();

            $table->integer('coach_id');
            $table->foreign('coach_id')->references('id')->on('users')->cascadeOnDelete();

            $table->integer('client_id');
            $table->foreign('client_id')->references('id')->on('users')->cascadeOnDelete();

            // Session details
            $table->date('session_date');
            $table->string('time_val', 10);                // e.g. "09:00"
            $table->string('time_ampm', 2);                // "AM" / "PM"
            $table->unsignedInteger('duration_minutes');
            $table->decimal('price', 10, 2)->default(0.00);
            $table->string('location')->nullable();

            // Status flow: pending → accepted | expired
            $table->enum('status', ['pending', 'accepted', 'expired'])->default('pending');

            // The message row that renders the proposal card in chat
            $table->unsignedInteger('message_id')->nullable();
            $table->foreign('message_id')->references('id')->on('messages')->nullOnDelete();

            $table->timestamp('accepted_at')->nullable();
            $table->timestamps();

            $table->index(['client_id', 'status']);
            $table->index(['coach_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('workout_plan_proposals');
    }
};
