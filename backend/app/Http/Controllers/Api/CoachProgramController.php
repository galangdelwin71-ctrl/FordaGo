<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CoachProgram;
use App\Models\CoachProgramItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Self-service reusable workout plan templates ("Create Program" Quick
 * Action). A coach builds a program once, then the frontend can hydrate the
 * Propose Workout Plan form from one of these instead of starting blank.
 * Every query is scoped to the authenticated coach — no cross-coach access.
 */
class CoachProgramController extends Controller
{
    /**
     * GET /api/coaches/programs
     * List the authenticated coach's own saved programs with their items.
     */
    public function index(Request $request)
    {
        if (! $request->user()->isCoach()) {
            return response()->json(['message' => 'Only coach accounts can access this.'], 403);
        }

        $programs = CoachProgram::with('items')
            ->where('coach_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->get();

        return response()->json($programs);
    }

    /**
     * GET /api/coaches/programs/{id}
     */
    public function show(int $id, Request $request)
    {
        if (! $request->user()->isCoach()) {
            return response()->json(['message' => 'Only coach accounts can access this.'], 403);
        }

        $program = CoachProgram::with('items')
            ->where('coach_id', $request->user()->id)
            ->find($id);

        if (! $program) {
            return response()->json(['message' => 'Program not found.'], 404);
        }

        return response()->json($program);
    }

    /**
     * POST /api/coaches/programs
     * Create a new reusable program with its exercise items.
     */
    public function store(Request $request)
    {
        if (! $request->user()->isCoach()) {
            return response()->json(['message' => 'Only coach accounts can access this.'], 403);
        }

        $validated = $request->validate([
            'name'                 => 'required|string|max:100',
            'workout_type'         => 'nullable|string|max:100',
            'target'               => 'nullable|string|max:150',
            'duration_minutes'     => 'nullable|integer|min:1|max:600',
            'price'                => 'nullable|numeric|min:0',
            'description'          => 'nullable|string|max:500',
            // Public group-class fields: a class occurrence needs a date,
            // time and capacity so members know what they're avail-ing.
            'is_public'            => 'nullable|boolean',
            'capacity'             => 'nullable|integer|min:1|max:500|required_if:is_public,true',
            'session_date'         => 'nullable|date|after_or_equal:today|required_if:is_public,true',
            'time_val'             => 'nullable|string|max:10|required_if:is_public,true',
            'time_ampm'            => 'nullable|in:AM,PM,am,pm|required_if:is_public,true',
            'location'             => 'nullable|string|max:150',
            'items'                => 'required|array|min:1',
            'items.*.name'         => 'required|string|max:100',
            'items.*.description'  => 'nullable|string|max:255',
            'items.*.sets'         => 'nullable|integer|min:0|max:50',
            'items.*.reps'         => 'nullable|integer|min:0|max:200',
        ]);

        $coachId = $request->user()->id;

        $program = DB::transaction(function () use ($validated, $coachId) {
            $isPublic = (bool) ($validated['is_public'] ?? false);

            $program = CoachProgram::create([
                'coach_id'         => $coachId,
                'name'             => trim($validated['name']),
                'workout_type'     => $validated['workout_type'] ?? null,
                'target'           => $validated['target'] ?? null,
                'duration_minutes' => $validated['duration_minutes'] ?? 60,
                'price'            => $validated['price'] ?? null,
                'description'      => $validated['description'] ?? null,
                'is_public'        => $isPublic,
                'capacity'         => $isPublic ? $validated['capacity'] : null,
                'session_date'     => $isPublic ? $validated['session_date'] : null,
                'time_val'         => $isPublic ? $validated['time_val'] : null,
                'time_ampm'        => $isPublic ? strtoupper($validated['time_ampm']) : null,
                'location'         => $validated['location'] ?? null,
            ]);

            foreach ($validated['items'] as $index => $item) {
                CoachProgramItem::create([
                    'program_id'  => $program->id,
                    'name'        => trim($item['name']),
                    'description' => $item['description'] ?? null,
                    'sets'        => $item['sets'] ?? 3,
                    'reps'        => $item['reps'] ?? 10,
                    'order'       => $index + 1,
                ]);
            }

            return $program;
        });

        return response()->json($program->load('items'), 201);
    }

    /**
     * PUT /api/coaches/programs/{id}
     * Update a program's own fields and/or fully replace its items.
     */
    public function update(int $id, Request $request)
    {
        if (! $request->user()->isCoach()) {
            return response()->json(['message' => 'Only coach accounts can access this.'], 403);
        }

        $program = CoachProgram::where('coach_id', $request->user()->id)->find($id);

        if (! $program) {
            return response()->json(['message' => 'Program not found.'], 404);
        }

        $validated = $request->validate([
            'name'                 => 'sometimes|string|max:100',
            'workout_type'         => 'nullable|string|max:100',
            'target'               => 'nullable|string|max:150',
            'duration_minutes'     => 'nullable|integer|min:1|max:600',
            'price'                => 'nullable|numeric|min:0',
            'description'          => 'nullable|string|max:500',
            'is_public'            => 'nullable|boolean',
            'capacity'             => 'nullable|integer|min:1|max:500|required_if:is_public,true',
            'session_date'         => 'nullable|date|after_or_equal:today|required_if:is_public,true',
            'time_val'             => 'nullable|string|max:10|required_if:is_public,true',
            'time_ampm'            => 'nullable|in:AM,PM,am,pm|required_if:is_public,true',
            'location'             => 'nullable|string|max:150',
            'items'                => 'sometimes|array|min:1',
            'items.*.name'         => 'required_with:items|string|max:100',
            'items.*.description'  => 'nullable|string|max:255',
            'items.*.sets'         => 'nullable|integer|min:0|max:50',
            'items.*.reps'         => 'nullable|integer|min:0|max:200',
        ]);

        // Coaches already have active bookings tied to this program's
        // schedule — block edits to the class occurrence itself once
        // someone has availed a seat, so no one gets silently rescheduled.
        if (($validated['is_public'] ?? $program->is_public)
            && $program->activeBookings()->exists()
            && (array_key_exists('session_date', $validated) || array_key_exists('time_val', $validated) || array_key_exists('capacity', $validated))
        ) {
            return response()->json([
                'message' => 'This class already has bookings. Cancel it or create a new class instead of changing the schedule.',
            ], 409);
        }

        DB::transaction(function () use ($program, $validated) {
            $program->fill(array_intersect_key($validated, array_flip([
                'name', 'workout_type', 'target', 'duration_minutes', 'price', 'description', 'location',
            ])));

            if (array_key_exists('is_public', $validated)) {
                $isPublic = (bool) $validated['is_public'];
                $program->is_public = $isPublic;

                if ($isPublic) {
                    $program->capacity = $validated['capacity'] ?? $program->capacity;
                    $program->session_date = $validated['session_date'] ?? $program->session_date;
                    $program->time_val = $validated['time_val'] ?? $program->time_val;
                    $program->time_ampm = isset($validated['time_ampm']) ? strtoupper($validated['time_ampm']) : $program->time_ampm;
                } else {
                    $program->capacity = null;
                    $program->session_date = null;
                    $program->time_val = null;
                    $program->time_ampm = null;
                }
            } elseif ($program->is_public) {
                $program->capacity = $validated['capacity'] ?? $program->capacity;
                $program->session_date = $validated['session_date'] ?? $program->session_date;
                $program->time_val = $validated['time_val'] ?? $program->time_val;
                $program->time_ampm = isset($validated['time_ampm']) ? strtoupper($validated['time_ampm']) : $program->time_ampm;
            }

            $program->save();

            if (array_key_exists('items', $validated)) {
                // Full replace keeps ordering trivial and avoids having to
                // diff/patch individual item rows for a template that's
                // edited far less often than it's read.
                $program->items()->delete();
                foreach ($validated['items'] as $index => $item) {
                    CoachProgramItem::create([
                        'program_id'  => $program->id,
                        'name'        => trim($item['name']),
                        'description' => $item['description'] ?? null,
                        'sets'        => $item['sets'] ?? 3,
                        'reps'        => $item['reps'] ?? 10,
                        'order'       => $index + 1,
                    ]);
                }
            }
        });

        return response()->json($program->fresh('items'));
    }

    /**
     * DELETE /api/coaches/programs/{id}
     */
    public function destroy(int $id, Request $request)
    {
        if (! $request->user()->isCoach()) {
            return response()->json(['message' => 'Only coach accounts can access this.'], 403);
        }

        $program = CoachProgram::where('coach_id', $request->user()->id)->find($id);

        if (! $program) {
            return response()->json(['message' => 'Program not found.'], 404);
        }

        $program->delete(); // cascades to coach_program_items via FK

        return response()->json(['message' => 'Program deleted.']);
    }
}
