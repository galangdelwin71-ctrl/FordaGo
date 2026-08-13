<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('personal_records');

        Schema::create('personal_records', function (Blueprint $table) {
            $table->increments('id');
            $table->integer('user_id');
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();

            $table->string('exercise');
            $table->string('icon')->nullable();

            // Stored as string on purpose: some PRs are numeric ("12") and
            // some are time-based ("1:30") — the frontend already treats
            // this as free-form text, so we don't force it into a number
            // column and lose time-based PRs.
            $table->string('value');
            $table->string('unit', 20)->nullable();

            $table->timestamps();

            $table->index(['user_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('personal_records');
    }
};
