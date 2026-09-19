<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'has_seen_guide')) {
                $table->boolean('has_seen_guide')->default(false);
            }
        });

        // Mark all existing users as having already seen the guide
        // so that existing accounts NEVER see the onboarding tour again upon app reinstall
        DB::table('users')->update(['has_seen_guide' => true]);
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'has_seen_guide')) {
                $table->dropColumn('has_seen_guide');
            }
        });
    }
};
