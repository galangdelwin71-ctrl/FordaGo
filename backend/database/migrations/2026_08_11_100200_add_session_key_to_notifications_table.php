<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('notifications', 'session_key')) {
            return;
        }

        Schema::table('notifications', function (Blueprint $table) {
            // Dedup key for "missed workout" notifications, e.g.
            // "2026-8-11-<clientSessionId>" — matches the format the
            // frontend already builds in notifyMissedWorkout(). Nullable
            // because ordinary/manual notifications don't need one.
            $table->string('session_key', 150)->nullable()->after('user_id');
        });

        Schema::table('notifications', function (Blueprint $table) {
            $table->unique(['user_id', 'session_key'], 'notifications_user_session_unique');
        });
    }

    public function down(): void
    {
        if (! Schema::hasColumn('notifications', 'session_key')) {
            return;
        }

        Schema::table('notifications', function (Blueprint $table) {
            $table->dropUnique('notifications_user_session_unique');
            $table->dropColumn('session_key');
        });
    }
};
