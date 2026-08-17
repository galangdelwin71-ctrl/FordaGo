<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Adds an approval gate to coach<->client conversations. Every EXISTING
     * row defaults to 'active' so nothing already in production breaks —
     * only newly created conversations (see ConversationController::start)
     * are explicitly created as 'pending', requiring the coach to Accept
     * or Decline before it counts as a real client thread.
     */
    public function up(): void
    {
        Schema::table('conversations', function (Blueprint $table) {
            $table->enum('status', ['pending', 'active', 'declined'])
                ->default('active')
                ->after('client_id');

            $table->index(['coach_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::table('conversations', function (Blueprint $table) {
            $table->dropIndex(['coach_id', 'status']);
            $table->dropColumn('status');
        });
    }
};
