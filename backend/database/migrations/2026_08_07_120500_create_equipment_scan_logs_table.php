<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('equipment_scan_logs')) {
            return;
        }

        Schema::create('equipment_scan_logs', function (Blueprint $table) {
            $table->increments('id');
            $table->integer('user_id');
            $table->integer('equipment_id')->nullable();
            $table->string('equipment_code', 120)->nullable();
            $table->string('equipment_name');
            $table->text('raw_qr')->nullable();
            $table->dateTime('scanned_at')->useCurrent();

            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('equipment_id')->references('id')->on('equipment')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('equipment_scan_logs');
    }
};
