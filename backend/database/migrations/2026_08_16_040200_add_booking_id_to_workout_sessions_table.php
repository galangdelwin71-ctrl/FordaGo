<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Mirrors the coach_id/proposal_id columns added for the 1-on-1 flow
     * (see 2026_08_16_020300_...): links a personal workout_sessions row
     * back to the program_bookings row that generated it when a member
     * avails a public group class. Nullable — sessions created any other
     * way simply leave this null.
     */
    public function up(): void
    {
        Schema::table('workout_sessions', function (Blueprint $table) {
            $table->unsignedInteger('booking_id')->nullable()->after('proposal_id');
            $table->foreign('booking_id')->references('id')->on('program_bookings')->nullOnDelete();

            $table->index('booking_id');
        });
    }

    public function down(): void
    {
        Schema::table('workout_sessions', function (Blueprint $table) {
            $table->dropForeign(['booking_id']);
            $table->dropIndex(['booking_id']);
            $table->dropColumn('booking_id');
        });
    }
};
