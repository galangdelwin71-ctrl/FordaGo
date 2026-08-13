<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('notifications')) {
            return;
        }

        // NOTE: This is a custom table, unrelated to Laravel's built-in
        // notifications system (which would use a `notifications` table with
        // a `notifiable_type`/`notifiable_id` polymorphic shape). This one is
        // the app's own simple per-user notice table — keep using it as-is,
        // don't run `php artisan notifications:table`.
        Schema::create('notifications', function (Blueprint $table) {
            $table->increments('id');
            $table->integer('user_id')->nullable();
            $table->text('message');
            $table->boolean('is_read')->default(false);
            $table->timestamp('created_at')->useCurrent();
            $table->string('title')->default('Notice');

            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
