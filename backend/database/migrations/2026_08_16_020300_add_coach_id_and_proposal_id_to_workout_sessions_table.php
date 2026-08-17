<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Links a personal workout_sessions row back to the coach and proposal
     * that generated it (ProposalController::accept()), so "sessions today
     * for this coach" is a direct indexed query instead of joining through
     * workout_plan_proposals. Both columns are nullable — purely-personal
     * sessions a member creates themselves (not from a coach proposal)
     * simply leave them null, which is the existing, unaffected behaviour.
     */
    public function up(): void
    {
        Schema::table('workout_sessions', function (Blueprint $table) {
            $table->integer('coach_id')->nullable()->after('user_id');
            $table->foreign('coach_id')->references('id')->on('users')->nullOnDelete();

            $table->unsignedInteger('proposal_id')->nullable()->after('coach_id');
            $table->foreign('proposal_id')->references('id')->on('workout_plan_proposals')->nullOnDelete();

            $table->index(['coach_id', 'session_date']);
        });

        $this->backfillFromExistingProposalSessions();
    }

    /**
     * Best-effort backfill for rows created before this migration.
     * ProposalController::accept() has always stamped
     * client_session_id = "coach-plan-{proposalId}-{unixTime}" for every
     * session it auto-creates, so that pattern is a reliable, read-only way
     * to recover the (coach_id, proposal_id) pair for historical rows
     * without depending on application code that may change later.
     * Sessions that don't match the pattern (member-created, non-coach
     * sessions) are left untouched, which is correct — they were never
     * linked to a coach in the first place.
     */
    private function backfillFromExistingProposalSessions(): void
    {
        DB::table('workout_sessions')
            ->where('client_session_id', 'like', 'coach-plan-%')
            ->orderBy('id')
            ->select(['id', 'client_session_id'])
            ->chunkById(200, function ($rows) {
                foreach ($rows as $row) {
                    if (! preg_match('/^coach-plan-(\d+)-/', $row->client_session_id, $matches)) {
                        continue;
                    }

                    $proposalId = (int) $matches[1];
                    $proposal = DB::table('workout_plan_proposals')
                        ->where('id', $proposalId)
                        ->first(['id', 'coach_id']);

                    if ($proposal !== null) {
                        DB::table('workout_sessions')
                            ->where('id', $row->id)
                            ->update([
                                'proposal_id' => $proposal->id,
                                'coach_id'    => $proposal->coach_id,
                            ]);
                    }
                }
            });
    }

    public function down(): void
    {
        Schema::table('workout_sessions', function (Blueprint $table) {
            $table->dropForeign(['coach_id']);
            $table->dropForeign(['proposal_id']);
            $table->dropIndex(['coach_id', 'session_date']);
            $table->dropColumn(['coach_id', 'proposal_id']);
        });
    }
};
