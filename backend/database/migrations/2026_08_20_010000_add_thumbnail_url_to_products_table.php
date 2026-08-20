<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Loading Speed Plan -- adds a small (~300px) pre-resized thumbnail
 * alongside the existing full-size `image_url` (~1200px), so the Shop
 * grid/list view can download a much smaller payload per product instead
 * of the full-size image it currently renders at thumbnail size.
 *
 * Purely additive: nullable, no backfill, no default. Existing rows keep
 * thumbnail_url = null until the admin re-saves them (or a future backfill
 * job runs) -- the frontend falls back to image_url whenever thumbnail_url
 * is empty, so this is a zero-risk migration with no behavior change until
 * paired with the frontend fallback logic.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('products', 'thumbnail_url')) {
            Schema::table('products', function (Blueprint $table) {
                // longText, matching image_url's column type -- both store
                // a base64 data: URL, and a small 300px/lower-quality JPEG
                // data URL can still run well past VARCHAR limits.
                $table->longText('thumbnail_url')->nullable()->after('image_url');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('products', 'thumbnail_url')) {
            Schema::table('products', function (Blueprint $table) {
                $table->dropColumn('thumbnail_url');
            });
        }
    }
};
