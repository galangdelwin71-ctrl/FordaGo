<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Add 'coach' to the users.role ENUM column.
     *
     * MySQL does not allow ALTER TABLE ... MODIFY COLUMN to add enum values
     * while preserving existing data via the Blueprint DSL reliably, so we
     * use a raw DB statement instead.
     *
     * Before: enum('admin','user','super_admin','employee')
     * After : enum('admin','user','super_admin','employee','coach')
     */
    public function up(): void
    {
        // Modify the ENUM to include 'coach'.
        DB::statement("
            ALTER TABLE `users`
            MODIFY COLUMN `role`
            ENUM('admin','user','super_admin','employee','coach')
            NOT NULL DEFAULT 'user'
        ");
    }

    public function down(): void
    {
        // Revert: first update any 'coach' rows back to 'user' to avoid
        // data truncation errors, then shrink the enum back.
        DB::statement("UPDATE `users` SET `role` = 'user' WHERE `role` = 'coach'");

        DB::statement("
            ALTER TABLE `users`
            MODIFY COLUMN `role`
            ENUM('admin','user','super_admin','employee')
            NOT NULL DEFAULT 'user'
        ");
    }
};
