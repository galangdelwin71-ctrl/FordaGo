<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Drop in case a previous failed migration left a partial table
        Schema::dropIfExists('workout_sessions');

        Schema::create('workout_sessions', function (Blueprint $table) {
            // increments() (int(11)) to match users.id — see
            // 2026_08_08_000000_create_workouts_table.php for why we never
            // use id()/bigIncrements() in this database.
            $table->increments('id');
            $table->integer('user_id');
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();

            // Calendar date of the workout (local date, not a timestamp) —
            // this is what streak/heatmap calculations key off of.
            $table->date('session_date');

            // The id the frontend (WorkoutTrackerService) already generates
            // for this session. Used to upsert instead of creating
            // duplicates when the same session is synced more than once.
            $table->string('client_session_id', 100);

            $table->string('title');

            // Explicit flag — never infer "rest day" by string-matching the
            // title. This is what makes the streak logic correct.
            $table->boolean('is_rest_day')->default(false);

            $table->enum('status', ['upcoming', 'optional', 'missed', 'done'])
                ->default('upcoming');

            // [{name, sets, reps, done}, ...]
            $table->json('exercises')->nullable();

            $table->unsignedInteger('actual_minutes')->nullable();
            $table->timestamp('started_at')->nullable();

            $table->string('time_val', 10)->nullable();
            $table->string('time_ampm', 2)->nullable();
            $table->string('location')->nullable();
            $table->string('coach')->nullable();
            $table->string('custom_target')->nullable();

            $table->timestamps();

            // One row per (user, client-generated session, date) — this is
            // the upsert key the API uses to guarantee idempotent syncs.
            $table->unique(
                ['user_id', 'client_session_id', 'session_date'],
                'workout_sessions_user_client_date_unique'
            );
            $table->index(['user_id', 'session_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('workout_sessions');
    }
};
