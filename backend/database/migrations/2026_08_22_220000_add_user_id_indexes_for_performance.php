<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Adds missing user_id indexes on high-traffic tables so per-user
 * WHERE user_id = ? queries do an index seek instead of a full-table scan.
 *
 * Before this migration every call to:
 *   GET /api/notifications    — scanned every row in `notifications`
 *   GET /api/attendance/my    — scanned every row in `attendance`
 * ... causing ~500 ms response times even for small datasets because
 * Laravel/MySQL was doing a sequential scan instead of an index lookup.
 */
return new class extends Migration
{
    public function up(): void
    {
        // notifications.user_id — queried on EVERY notification list & mark-read
        if (Schema::hasTable('notifications')) {
            Schema::table('notifications', function (Blueprint $table) {
                if (! $this->indexExists('notifications', 'notifications_user_id_index')) {
                    $table->index('user_id', 'notifications_user_id_index');
                }
                // Composite index for the common "unread count" query pattern
                if (! $this->indexExists('notifications', 'notifications_user_id_is_read_index')) {
                    $table->index(['user_id', 'is_read'], 'notifications_user_id_is_read_index');
                }
            });
        }

        // attendance.user_id — queried on every attendance list & check-in duplicate check
        if (Schema::hasTable('attendance')) {
            Schema::table('attendance', function (Blueprint $table) {
                if (! $this->indexExists('attendance', 'attendance_user_id_index')) {
                    $table->index('user_id', 'attendance_user_id_index');
                }
                // Composite for "already checked in today?" query
                if (! $this->indexExists('attendance', 'attendance_user_id_check_in_time_index')) {
                    $table->index(['user_id', 'check_in_time'], 'attendance_user_id_check_in_time_index');
                }
            });
        }

        // workout_sessions: the main data table for the tracker
        if (Schema::hasTable('workout_sessions')) {
            Schema::table('workout_sessions', function (Blueprint $table) {
                if (! $this->indexExists('workout_sessions', 'workout_sessions_user_id_date_index')) {
                    $table->index(['user_id', 'session_date'], 'workout_sessions_user_id_date_index');
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('notifications')) {
            Schema::table('notifications', function (Blueprint $table) {
                $table->dropIndex('notifications_user_id_index');
                $table->dropIndex('notifications_user_id_is_read_index');
            });
        }
        if (Schema::hasTable('attendance')) {
            Schema::table('attendance', function (Blueprint $table) {
                $table->dropIndex('attendance_user_id_index');
                $table->dropIndex('attendance_user_id_check_in_time_index');
            });
        }
        if (Schema::hasTable('workout_sessions')) {
            Schema::table('workout_sessions', function (Blueprint $table) {
                $table->dropIndex('workout_sessions_user_id_date_index');
            });
        }
    }

    /** Helper: check if an index already exists (avoids duplicate-key errors on re-run). */
    private function indexExists(string $table, string $indexName): bool
    {
        $indexes = \DB::select("SHOW INDEX FROM `{$table}` WHERE Key_name = ?", [$indexName]);
        return count($indexes) > 0;
    }
};
