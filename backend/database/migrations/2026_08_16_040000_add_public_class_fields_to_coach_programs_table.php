<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Lets a coach post a program as a public GROUP CLASS instead of only
     * proposing it 1-on-1 through a conversation. A public program is a
     * single scheduled occurrence (like a proposal) that many members can
     * "avail" of at once, up to `capacity`. Private programs (is_public =
     * false, the existing default) are completely unaffected — they keep
     * working exactly as they do today, hydrating the Propose Workout Plan
     * form for a single client.
     */
    public function up(): void
    {
        Schema::table('coach_programs', function (Blueprint $table) {
            $table->boolean('is_public')->default(false)->after('description');

            // Null = unlimited slots. Enforced at the application layer
            // against program_bookings.count(status = 'booked').
            $table->unsignedInteger('capacity')->nullable()->after('is_public');

            // The single class occurrence members book into. Required
            // (validated in the controller) whenever is_public = true.
            $table->date('session_date')->nullable()->after('capacity');
            $table->string('time_val', 10)->nullable()->after('session_date');
            $table->string('time_ampm', 2)->nullable()->after('time_val');
            $table->string('location')->nullable()->after('time_ampm');

            $table->index(['is_public', 'session_date']);
        });
    }

    public function down(): void
    {
        Schema::table('coach_programs', function (Blueprint $table) {
            $table->dropIndex(['is_public', 'session_date']);
            $table->dropColumn([
                'is_public',
                'capacity',
                'session_date',
                'time_val',
                'time_ampm',
                'location',
            ]);
        });
    }
};
