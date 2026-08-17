<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * One row per member who "avails" a public coach_programs group class.
     * Distinct from workout_plan_proposals: a proposal is a 1-on-1 offer a
     * coach sends to a single client through a conversation, this is a
     * member self-booking into an already-posted public class, so there is
     * no coach approval step and no conversation involved.
     *
     * No online payment gateway exists in this app yet, so payment_status
     * always starts at 'pay_at_gym' — the member settles up in person.
     * Swapping in a real processor later only needs a new enum value plus
     * whatever webhook updates it; nothing here has to change shape.
     */
    public function up(): void
    {
        Schema::create('program_bookings', function (Blueprint $table) {
            $table->increments('id');

            $table->unsignedInteger('program_id');
            $table->foreign('program_id')->references('id')->on('coach_programs')->cascadeOnDelete();

            $table->integer('member_id');
            $table->foreign('member_id')->references('id')->on('users')->cascadeOnDelete();

            $table->enum('status', ['booked', 'cancelled'])->default('booked');
            $table->enum('payment_status', ['pay_at_gym', 'paid'])->default('pay_at_gym');

            $table->timestamp('booked_at')->nullable();
            $table->timestamps();

            // A member can only hold ONE active seat per class. Re-booking
            // after cancelling flips this same row back to 'booked' instead
            // of inserting a duplicate (see ProgramBookingController::book).
            $table->unique(['program_id', 'member_id']);
            $table->index(['program_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('program_bookings');
    }
};
