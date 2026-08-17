<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Recurring weekly availability slots a coach sets for themselves
     * (Quick Action "Set Availability" on the Coach Dashboard). One row
     * per (coach, day-of-week, start_time) slot.
     */
    public function up(): void
    {
        Schema::create('coach_availability', function (Blueprint $table) {
            // increments() (int(11)) to match users.id — see
            // 2026_08_15_010000_create_coach_profiles_table.php for the
            // same convention used throughout the coaching feature.
            $table->increments('id');

            $table->integer('coach_id');
            $table->foreign('coach_id')->references('id')->on('users')->cascadeOnDelete();

            // 0 = Sunday .. 6 = Saturday (matches JS Date#getDay()/dayjs, so
            // the frontend never has to remap indices).
            $table->unsignedTinyInteger('day_of_week');

            $table->time('start_time');
            $table->time('end_time');

            // Lets a coach temporarily pause a slot without deleting it.
            $table->boolean('is_active')->default(true);

            $table->timestamps();

            // A coach can't define the exact same slot twice.
            $table->unique(
                ['coach_id', 'day_of_week', 'start_time', 'end_time'],
                'coach_availability_unique_slot'
            );
            $table->index(['coach_id', 'day_of_week']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('coach_availability');
    }
};
