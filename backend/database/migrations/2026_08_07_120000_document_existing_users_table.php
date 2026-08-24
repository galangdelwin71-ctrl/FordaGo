<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Creates the `users` table on fresh databases (container / CI).
     *
     * On existing databases (XAMPP / production) where the table was already
     * created by the old Node backend, this is a safe no-op thanks to the
     * Schema::hasTable() guard.
     *
     * Schema matches fordago_export_2026-08-07.sql exactly.
     * NOTE: `created_at` is intentionally omitted here — it is added by the
     * next migration (2026_08_11_095900_add_created_at_to_users_table.php).
     */
    public function up(): void
    {
        if (Schema::hasTable('users')) {
            return; // already exists on XAMPP / production — skip
        }

        Schema::create('users', function (Blueprint $table) {
            $table->integer('id')->autoIncrement()->primary();
            $table->string('username', 50)->unique()->nullable();
            $table->string('email', 100)->unique();
            $table->string('password', 255);
            $table->enum('role', ['admin', 'user', 'super_admin', 'employee'])->default('user');
            $table->string('phone', 20)->nullable();
            $table->enum('gender', ['male', 'female', 'other'])->nullable();
            $table->enum('membership_type', ['daily', 'premium'])->nullable();
            $table->enum('payment_method', ['cash', 'gcash'])->nullable();
            $table->date('membership_expiry')->nullable();
            $table->longText('profile_image')->nullable();
            $table->enum('membership_status', ['pending', 'active'])->nullable();
            $table->string('first_name', 80)->nullable();
            $table->string('last_name', 80)->nullable();
        });
    }

    public function down(): void
    {
        // Never drop the users table on rollback — it may hold production data.
        // If you genuinely need to rollback a fresh container, use `migrate:fresh` instead.
    }
};
