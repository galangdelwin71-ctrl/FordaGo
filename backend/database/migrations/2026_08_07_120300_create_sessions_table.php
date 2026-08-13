<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('sessions')) {
            return;
        }

        // NOTE: This is the GYM CLASS SCHEDULE table (title/date/coach), not
        // Laravel's session-storage table. SESSION_DRIVER is set to "file" in
        // .env specifically so Laravel never tries to create/use a `sessions`
        // table of its own and collide with this one.
        Schema::create('sessions', function (Blueprint $table) {
            $table->increments('id');
            $table->string('title');
            $table->date('date');
            $table->string('time', 20)->nullable();
            $table->string('location')->nullable();
            $table->string('coach')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sessions');
    }
};
