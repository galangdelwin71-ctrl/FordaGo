<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Adds the two columns CoachProfile::$fillable and CoachController
     * already reference (is_active, created_by) but that the original
     * 2026_08_15_010000_create_coach_profiles_table migration never
     * created. Without this migration, GET /api/coaches throws a SQL
     * error ("Unknown column 'is_active'") the moment it's hit.
     */
    public function up(): void
    {
        Schema::table('coach_profiles', function (Blueprint $table) {
            // Client-facing visibility flag. Defaults true so any coach
            // profile inserted directly (e.g. via seeders) stays visible.
            $table->boolean('is_active')->default(true)->after('rate');

            // Audit trail: which admin/super_admin created this coach
            // account. Nullable so existing rows (if any) aren't blocked,
            // and set null on the creator's deletion rather than cascading
            // — losing the admin shouldn't delete the coach profile.
            $table->integer('created_by')->nullable()->after('is_active');
            $table->foreign('created_by')->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('coach_profiles', function (Blueprint $table) {
            $table->dropForeign(['created_by']);
            $table->dropColumn(['is_active', 'created_by']);
        });
    }
};
