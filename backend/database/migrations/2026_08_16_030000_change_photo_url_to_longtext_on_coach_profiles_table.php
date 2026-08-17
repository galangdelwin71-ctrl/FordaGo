<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Fixes SQLSTATE[22001]: String data, right truncated: 1406 Data too
     * long for column 'photo_url' — the original
     * 2026_08_15_010000_create_coach_profiles_table migration declared
     * `photo_url` as a plain TEXT column (MySQL cap: 65,535 bytes / ~64KB),
     * but the admin "Add Coach" form (AdminPage::onCoachImageChange ->
     * optimizeProductImage) sends a base64-encoded JPEG data URL that
     * routinely exceeds that even after client-side resize/compression.
     *
     * Every other image column storing the same kind of base64 payload in
     * this app already uses a larger type — users.profile_image is
     * `longtext` (see 2026_08_07_120000_document_existing_users_table.php),
     * products.image_url is `longText`, equipment.image_url is
     * `mediumText` — coach_profiles.photo_url was the one column left on
     * the small 64KB TEXT type. This migration brings it in line with
     * users.profile_image (LONGTEXT, up to 4GB) rather than introducing a
     * third size tier.
     */
    public function up(): void
    {
        Schema::table('coach_profiles', function (Blueprint $table) {
            $table->longText('photo_url')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('coach_profiles', function (Blueprint $table) {
            $table->text('photo_url')->nullable()->change();
        });
    }
};
