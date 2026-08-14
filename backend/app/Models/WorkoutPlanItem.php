<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WorkoutPlanItem extends Model
{
    protected $table = 'workout_plan_items';

    protected $fillable = [
        'proposal_id',
        'name',
        'description',
        'sets',
        'reps',
        'order',
    ];

    protected function casts(): array
    {
        return [
            'sets'  => 'integer',
            'reps'  => 'integer',
            'order' => 'integer',
        ];
    }

    // ── Relationships ────────────────────────────────

    public function proposal()
    {
        return $this->belongsTo(WorkoutPlanProposal::class, 'proposal_id');
    }
}
