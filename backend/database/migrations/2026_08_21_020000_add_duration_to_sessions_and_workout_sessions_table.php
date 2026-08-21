<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('sessions')) {
            Schema::table('sessions', function (Blueprint $table) {
                if (! Schema::hasColumn('sessions', 'duration')) {
                    $table->string('duration', 50)->nullable()->after('time');
                }
            });
        }

        if (Schema::hasTable('workout_sessions')) {
            Schema::table('workout_sessions', function (Blueprint $table) {
                if (! Schema::hasColumn('workout_sessions', 'duration')) {
                    $table->string('duration', 50)->nullable()->after('time_ampm');
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('sessions')) {
            Schema::table('sessions', function (Blueprint $table) {
                if (Schema::hasColumn('sessions', 'duration')) {
                    $table->dropColumn('duration');
                }
            });
        }

        if (Schema::hasTable('workout_sessions')) {
            Schema::table('workout_sessions', function (Blueprint $table) {
                if (Schema::hasColumn('workout_sessions', 'duration')) {
                    $table->dropColumn('duration');
                }
            });
        }
    }
};
