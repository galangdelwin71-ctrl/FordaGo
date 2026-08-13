<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ClassSession;
use Illuminate\Http\Request;

/**
 * Ported from server/routes/schedule.js.
 */
class ScheduleController extends Controller
{
    /** GET /api/schedule */
    public function index()
    {
        return response()->json(
            ClassSession::orderBy('date')->orderBy('time')->get()
        );
    }

    /** POST /api/schedule */
    public function store(Request $request)
    {
        $title = trim((string) $request->input('title', ''));
        $date  = trim((string) $request->input('date', ''));

        if (! $title || ! $date) {
            return response()->json(['message' => 'Title and date are required'], 400);
        }

        $session = ClassSession::create([
            'title'    => $title,
            'date'     => $date,
            'time'     => $request->input('time') ?: null,
            'location' => $request->input('location') ?: null,
            'coach'    => $request->input('coach') ?: null,
        ]);

        return response()->json($session, 201);
    }

    /** PUT /api/schedule/{id} */
    public function update(Request $request, int $id)
    {
        $session = ClassSession::find($id);
        if (! $session) {
            return response()->json(['message' => 'Session not found'], 404);
        }

        $session->update([
            'title'    => $request->input('title', $session->title),
            'date'     => $request->input('date', $session->date),
            'time'     => $request->input('time') ?: null,
            'location' => $request->input('location') ?: null,
            'coach'    => $request->input('coach') ?: null,
        ]);

        return response()->json(['message' => 'Session updated']);
    }

    /** DELETE /api/schedule/{id} */
    public function destroy(int $id)
    {
        $session = ClassSession::find($id);
        if (! $session) {
            return response()->json(['message' => 'Session not found'], 404);
        }

        $session->delete();
        return response()->json(['message' => 'Session deleted']);
    }
}
