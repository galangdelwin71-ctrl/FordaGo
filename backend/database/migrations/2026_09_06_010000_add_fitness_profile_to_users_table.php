<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->decimal('height', 5, 2)->nullable()->after('gender');
            $table->decimal('weight', 5, 2)->nullable()->after('height');
            $table->decimal('bmi', 4, 1)->nullable()->after('weight');
            $table->string('fitness_goal', 50)->nullable()->after('bmi');
            $table->string('preferred_workout_time', 10)->nullable()->default('17:00')->after('fitness_goal');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'height',
                'weight',
                'bmi',
                'fitness_goal',
                'preferred_workout_time',
            ]);
        });
    }
};
