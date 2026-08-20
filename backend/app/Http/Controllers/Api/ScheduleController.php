<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ClassSession;
use App\Models\Notification;
use App\Models\User;
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
            ClassSession::orderBy('date', 'desc')->orderBy('time', 'desc')->get()
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

        $time        = $request->input('time') ?: null;
        $location    = $request->input('location') ?: null;
        $coach       = $request->input('coach') ?: null;
        $description = $request->input('description') ?: null;
        $memberIds   = $request->input('member_ids');
        $memberNames = $request->input('member_names');

        if (is_string($memberIds)) {
            $decoded = json_decode($memberIds, true);
            if (is_array($decoded)) {
                $memberIds = $decoded;
            }
        }

        if (is_array($memberNames)) {
            $memberNames = implode(', ', $memberNames);
        }

        $session = ClassSession::create([
            'title'        => $title,
            'description'  => $description,
            'date'         => $date,
            'time'         => $time,
            'location'     => $location,
            'coach'        => $coach,
            'member_ids'   => is_array($memberIds) ? $memberIds : null,
            'member_names' => $memberNames ?: null,
        ]);

        // Send notifications to all mentioned members
        if (is_array($memberIds) && count($memberIds) > 0) {
            foreach ($memberIds as $userId) {
                $user = User::find($userId);
                if ($user) {
                    Notification::create([
                        'user_id' => $user->id,
                        'title'   => 'Upcoming Gym Session: ' . $title,
                        'message' => "You have been scheduled for '{$title}' on {$date}" . ($time ? " at {$time}" : '') . ($location ? " ({$location})" : '') . ". Get ready!",
                        'is_read' => false,
                    ]);
                }
            }
        }

        return response()->json($session, 201);
    }

    /** PUT /api/schedule/{id} */
    public function update(Request $request, int $id)
    {
        $session = ClassSession::find($id);
        if (! $session) {
            return response()->json(['message' => 'Session not found'], 404);
        }

        $title       = $request->input('title', $session->title);
        $date        = $request->input('date', $session->date);
        $time        = $request->input('time', $session->time);
        $location    = $request->input('location', $session->location);
        $coach       = $request->input('coach', $session->coach);
        $description = $request->input('description', $session->description);
        $memberIds   = $request->input('member_ids', $session->member_ids);
        $memberNames = $request->input('member_names', $session->member_names);

        if (is_string($memberIds)) {
            $decoded = json_decode($memberIds, true);
            if (is_array($decoded)) {
                $memberIds = $decoded;
            }
        }

        if (is_array($memberNames)) {
            $memberNames = implode(', ', $memberNames);
        }

        $session->update([
            'title'        => $title,
            'description'  => $description,
            'date'         => $date,
            'time'         => $time ?: null,
            'location'     => $location ?: null,
            'coach'        => $coach ?: null,
            'member_ids'   => is_array($memberIds) ? $memberIds : null,
            'member_names' => $memberNames ?: null,
        ]);

        return response()->json(['message' => 'Session updated', 'session' => $session]);
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
