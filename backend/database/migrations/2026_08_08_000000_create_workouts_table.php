<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Drop in case a previous failed migration left a partial table
        Schema::dropIfExists('workouts');

        Schema::create('workouts', function (Blueprint $table) {
            // Use increments() to match the int(11) pattern of every other
            // table in this database — NOT id()/bigIncrements which produces
            // bigint and causes FK mismatch errors against users.id (int(11)).
            $table->increments('id');
            $table->integer('user_id');
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->string('name')->nullable();
            $table->text('description')->nullable();
            $table->date('date')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('workouts');
    }
};
