<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Loading Speed Plan (Stage 6) -- equipment counterpart to
 * 2026_08_20_010000_add_thumbnail_url_to_products_table.php. Same
 * additive/nullable shape: existing rows get thumbnail_url = null and the
 * frontend falls back to image_url until an admin re-saves the item.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('equipment', 'thumbnail_url')) {
            Schema::table('equipment', function (Blueprint $table) {
                // mediumText, matching image_url's column type on this table.
                $table->mediumText('thumbnail_url')->nullable()->after('image_url');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('equipment', 'thumbnail_url')) {
            Schema::table('equipment', function (Blueprint $table) {
                $table->dropColumn('thumbnail_url');
            });
        }
    }
};
