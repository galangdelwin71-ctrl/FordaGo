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
                if (! Schema::hasColumn('sessions', 'description')) {
                    $table->text('description')->nullable()->after('title');
                }
                if (! Schema::hasColumn('sessions', 'member_ids')) {
                    $table->json('member_ids')->nullable()->after('coach');
                }
                if (! Schema::hasColumn('sessions', 'member_names')) {
                    $table->text('member_names')->nullable()->after('member_ids');
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('sessions')) {
            Schema::table('sessions', function (Blueprint $table) {
                if (Schema::hasColumn('sessions', 'description')) {
                    $table->dropColumn('description');
                }
                if (Schema::hasColumn('sessions', 'member_ids')) {
                    $table->dropColumn('member_ids');
                }
                if (Schema::hasColumn('sessions', 'member_names')) {
                    $table->dropColumn('member_names');
                }
            });
        }
    }
};
