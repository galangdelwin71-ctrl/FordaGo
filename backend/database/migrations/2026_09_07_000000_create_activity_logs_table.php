<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasTable('activity_logs')) {
            Schema::create('activity_logs', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('user_id')->nullable()->index();
                $table->string('username', 100);
                $table->string('full_name', 150);
                $table->string('role', 50)->default('admin');
                $table->string('action_type', 50)->index(); // login, logout, member_approval, member_reject, member_update, inventory_add, inventory_update, inventory_delete, equipment_update, staff_update, etc.
                $table->string('action_title', 150);
                $table->text('description')->nullable();
                $table->string('entity_type', 50)->nullable(); // user, product, equipment, order, session, etc.
                $table->string('entity_id', 100)->nullable();
                $table->json('details')->nullable(); // structured metadata (before/after values)
                $table->string('ip_address', 45)->nullable();
                $table->text('user_agent')->nullable();
                $table->timestamp('login_at')->nullable();
                $table->timestamp('logout_at')->nullable();
                $table->timestamps();

                $table->index(['created_at', 'action_type']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
    }
};
