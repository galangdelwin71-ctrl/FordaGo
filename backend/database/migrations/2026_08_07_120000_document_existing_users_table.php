<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * NOTE: `users` already exists in the live fordago database (created by
     * the old Node backend), so this migration does NOT create it — it's
     * intentionally skipped here. See database/migrations_unused/ for the
     * original Laravel default users migration we removed.
     *
     * Real columns (from fordago_export_2026-08-07.sql):
     * id int(11) PK, username varchar(50) unique, email varchar(100) unique,
     * password varchar(255), role enum('admin','user','super_admin','employee'),
     * phone varchar(20), gender enum('male','female','other'),
     * membership_type enum('daily','premium'), payment_method enum('cash','gcash'),
     * membership_expiry date, profile_image longtext,
     * membership_status enum('pending','active'), first_name varchar(80), last_name varchar(80)
     */
    public function up(): void
    {
        // Intentionally no-op: users table already exists in production.
    }

    public function down(): void
    {
        // Intentionally no-op — we never want `php artisan migrate:rollback`
        // to drop the real users table.
    }
};
