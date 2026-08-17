<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CoachProgramItem extends Model
{
    protected $table = 'coach_program_items';

    protected $fillable = [
        'program_id',
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

    public function program()
    {
        return $this->belongsTo(CoachProgram::class, 'program_id');
    }
}
