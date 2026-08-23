<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Adds remaining performance indexes not covered by earlier migrations.
 *
 * Already indexed by earlier migrations (not duplicated here):
 *   - messages(conversation_id, created_at)          — create_messages_table
 *   - notifications(user_id), (user_id, is_read)     — add_user_id_indexes_for_performance
 *   - attendance(user_id), (user_id, check_in_time)  — add_user_id_indexes_for_performance
 *   - workout_sessions(user_id, session_date)         — add_user_id_indexes_for_performance
 *   - conversations(coach_id, status)                 — add_status_to_conversations_table
 *   - workout_plan_proposals(client_id, status),
 *     (coach_id, status)                             — create_workout_plan_proposals_table
 *   - coach_programs(coach_id),
 *     (is_public, session_date)                      — create & add_public_class_fields
 */
return new class extends Migration
{
    public function up(): void
    {
        // 1. messages — additional indexes on top of existing (conversation_id, created_at)
        if (Schema::hasTable('messages')) {
            Schema::table('messages', function (Blueprint $table) {
                if (! $this->indexExists('messages', 'idx_messages_sender')) {
                    $table->index('sender_id', 'idx_messages_sender');
                }
                if (! $this->indexExists('messages', 'idx_messages_read_at')) {
                    $table->index('read_at', 'idx_messages_read_at');
                }
            });
        }

        // 2. notifications — session_key index (user_id indexes already exist)
        if (Schema::hasTable('notifications') && Schema::hasColumn('notifications', 'session_key')) {
            Schema::table('notifications', function (Blueprint $table) {
                if (! $this->indexExists('notifications', 'idx_notif_session_key')) {
                    $table->index('session_key', 'idx_notif_session_key');
                }
            });
        }

        // 3. attendance — payment_status + check_in_time composite
        //    (no created_at column in this table — uses check_in_time)
        if (Schema::hasTable('attendance')) {
            Schema::table('attendance', function (Blueprint $table) {
                if (! $this->indexExists('attendance', 'idx_attend_pay_checkin')) {
                    $table->index(['payment_status', 'check_in_time'], 'idx_attend_pay_checkin');
                }
            });
        }

        // 4. workout_sessions — additional indexes beyond (user_id, session_date)
        if (Schema::hasTable('workout_sessions')) {
            Schema::table('workout_sessions', function (Blueprint $table) {
                if (! $this->indexExists('workout_sessions', 'idx_ws_user_created')) {
                    $table->index(['user_id', 'created_at'], 'idx_ws_user_created');
                }
                if (! $this->indexExists('workout_sessions', 'idx_ws_client_session_date')) {
                    $table->index(['client_session_id', 'session_date'], 'idx_ws_client_session_date');
                }
            });
        }

        // 5. personal_records
        if (Schema::hasTable('personal_records')) {
            Schema::table('personal_records', function (Blueprint $table) {
                if (! $this->indexExists('personal_records', 'idx_pr_user_created')) {
                    $table->index(['user_id', 'created_at'], 'idx_pr_user_created');
                }
                if (! $this->indexExists('personal_records', 'idx_pr_user_exercise')) {
                    $table->index(['user_id', 'exercise'], 'idx_pr_user_exercise');
                }
            });
        }

        // 6. conversations — client_id + status and updated_at
        if (Schema::hasTable('conversations')) {
            Schema::table('conversations', function (Blueprint $table) {
                if (! $this->indexExists('conversations', 'idx_conv_client_status')) {
                    $table->index(['client_id', 'status'], 'idx_conv_client_status');
                }
                if (! $this->indexExists('conversations', 'idx_conv_updated_at')) {
                    $table->index('updated_at', 'idx_conv_updated_at');
                }
            });
        }

        // 7. workout_plan_proposals — conversation_id + created_at composite
        if (Schema::hasTable('workout_plan_proposals')) {
            Schema::table('workout_plan_proposals', function (Blueprint $table) {
                if (! $this->indexExists('workout_plan_proposals', 'idx_wpp_convo_created')) {
                    $table->index(['conversation_id', 'created_at'], 'idx_wpp_convo_created');
                }
            });
        }

        // 8. orders — user_id + created_at and status + created_at
        //    (no order_status column — the column is named "status")
        if (Schema::hasTable('orders')) {
            Schema::table('orders', function (Blueprint $table) {
                if (! $this->indexExists('orders', 'idx_orders_user_created')) {
                    $table->index(['user_id', 'created_at'], 'idx_orders_user_created');
                }
                if (! $this->indexExists('orders', 'idx_orders_status_created')) {
                    $table->index(['status', 'created_at'], 'idx_orders_status_created');
                }
            });
        }

        // 9. feedbacks
        if (Schema::hasTable('feedbacks')) {
            Schema::table('feedbacks', function (Blueprint $table) {
                if (! $this->indexExists('feedbacks', 'idx_feedbacks_user_created')) {
                    $table->index(['user_id', 'created_at'], 'idx_feedbacks_user_created');
                }
            });
        }

        // 10. users
        if (Schema::hasTable('users')) {
            Schema::table('users', function (Blueprint $table) {
                if (! $this->indexExists('users', 'idx_users_role')) {
                    $table->index('role', 'idx_users_role');
                }
                if (! $this->indexExists('users', 'idx_users_membership')) {
                    $table->index(['membership_status', 'membership_type'], 'idx_users_membership');
                }
            });
        }
    }

    public function down(): void
    {
        $drops = [
            'messages'               => ['idx_messages_sender', 'idx_messages_read_at'],
            'notifications'          => ['idx_notif_session_key'],
            'attendance'             => ['idx_attend_pay_checkin'],
            'workout_sessions'       => ['idx_ws_user_created', 'idx_ws_client_session_date'],
            'personal_records'       => ['idx_pr_user_created', 'idx_pr_user_exercise'],
            'conversations'          => ['idx_conv_client_status', 'idx_conv_updated_at'],
            'workout_plan_proposals' => ['idx_wpp_convo_created'],
            'orders'                 => ['idx_orders_user_created', 'idx_orders_status_created'],
            'feedbacks'              => ['idx_feedbacks_user_created'],
            'users'                  => ['idx_users_role', 'idx_users_membership'],
        ];

        foreach ($drops as $table => $indexes) {
            if (Schema::hasTable($table)) {
                Schema::table($table, function (Blueprint $tableBlueprint) use ($table, $indexes) {
                    foreach ($indexes as $index) {
                        if ($this->indexExists($table, $index)) {
                            $tableBlueprint->dropIndex($index);
                        }
                    }
                });
            }
        }
    }

    private function indexExists(string $table, string $indexName): bool
    {
        $indexes = DB::select("SHOW INDEX FROM `{$table}` WHERE Key_name = ?", [$indexName]);
        return count($indexes) > 0;
    }
};
