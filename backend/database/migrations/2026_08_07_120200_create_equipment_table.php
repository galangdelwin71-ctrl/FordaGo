<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('equipment')) {
            return;
        }

        Schema::create('equipment', function (Blueprint $table) {
            $table->increments('id');
            $table->string('name');
            $table->string('category', 100)->nullable();
            $table->string('icon', 20)->default('?');
            $table->enum('status', ['available', 'unavailable', 'maintenance'])->default('available');
            $table->timestamp('created_at')->useCurrent();
            $table->mediumText('image_url')->nullable();
            $table->text('description')->nullable();
            $table->string('weight_scale')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('equipment');
    }
};
