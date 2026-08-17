<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CoachAvailability;
use Illuminate\Http\Request;

/**
 * Self-service weekly availability for the authenticated coach ("Set
 * Availability" Quick Action on the Coach Dashboard). Every query is scoped
 * to $request->user()->id — a coach can only ever see or touch their own
 * slots, there is no admin/cross-coach access here by design.
 */
class CoachAvailabilityController extends Controller
{
    /**
     * GET /api/coaches/availability
     * List the authenticated coach's own weekly slots, grouped by day.
     */
    public function index(Request $request)
    {
        if (! $request->user()->isCoach()) {
            return response()->json(['message' => 'Only coach accounts can access this.'], 403);
        }

        $slots = CoachAvailability::where('coach_id', $request->user()->id)
            ->orderBy('day_of_week')
            ->orderBy('start_time')
            ->get();

        return response()->json($slots);
    }

    /**
     * POST /api/coaches/availability
     * Add a new weekly slot for the authenticated coach.
     */
    public function store(Request $request)
    {
        if (! $request->user()->isCoach()) {
            return response()->json(['message' => 'Only coach accounts can access this.'], 403);
        }

        $validated = $request->validate([
            'day_of_week' => 'required|integer|min:0|max:6',
            'start_time'  => 'required|date_format:H:i',
            'end_time'    => 'required|date_format:H:i|after:start_time',
            'is_active'   => 'nullable|boolean',
        ]);

        $coachId = $request->user()->id;

        $exists = CoachAvailability::where('coach_id', $coachId)
            ->where('day_of_week', $validated['day_of_week'])
            ->where('start_time', $validated['start_time'])
            ->where('end_time', $validated['end_time'])
            ->exists();

        if ($exists) {
            return response()->json(['message' => 'This exact slot already exists.'], 409);
        }

        $slot = CoachAvailability::create([
            'coach_id'    => $coachId,
            'day_of_week' => $validated['day_of_week'],
            'start_time'  => $validated['start_time'],
            'end_time'    => $validated['end_time'],
            'is_active'   => $validated['is_active'] ?? true,
        ]);

        return response()->json($slot, 201);
    }

    /**
     * PUT /api/coaches/availability/{id}
     * Update one of the authenticated coach's own slots.
     */
    public function update(int $id, Request $request)
    {
        if (! $request->user()->isCoach()) {
            return response()->json(['message' => 'Only coach accounts can access this.'], 403);
        }

        $slot = CoachAvailability::where('coach_id', $request->user()->id)->find($id);

        if (! $slot) {
            return response()->json(['message' => 'Availability slot not found.'], 404);
        }

        $validated = $request->validate([
            'day_of_week' => 'sometimes|integer|min:0|max:6',
            'start_time'  => 'sometimes|date_format:H:i',
            'end_time'    => 'sometimes|date_format:H:i',
            'is_active'   => 'sometimes|boolean',
        ]);

        $slot->fill($validated);

        // Validate the resulting pair regardless of which field(s) changed,
        // so a partial update can never leave start >= end.
        if ($slot->start_time >= $slot->end_time) {
            return response()->json(['message' => 'end_time must be after start_time.'], 422);
        }

        $slot->save();

        return response()->json($slot);
    }

    /**
     * DELETE /api/coaches/availability/{id}
     * Remove one of the authenticated coach's own slots.
     */
    public function destroy(int $id, Request $request)
    {
        if (! $request->user()->isCoach()) {
            return response()->json(['message' => 'Only coach accounts can access this.'], 403);
        }

        $slot = CoachAvailability::where('coach_id', $request->user()->id)->find($id);

        if (! $slot) {
            return response()->json(['message' => 'Availability slot not found.'], 404);
        }

        $slot->delete();

        return response()->json(['message' => 'Availability slot removed.']);
    }
}
