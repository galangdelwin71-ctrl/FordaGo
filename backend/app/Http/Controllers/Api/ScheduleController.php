<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ClassSession;
use App\Models\Notification;
use App\Models\User;
use App\Models\WorkoutSession;
use Carbon\Carbon;
use Illuminate\Http\Request;

/**
 * Ported from server/routes/schedule.js.
 */
class ScheduleController extends Controller
{
    /**
     * Automatically clean up sessions that have already ended.
     */
    private function cleanupExpiredSessions(): void
    {
        try {
            $now = Carbon::now();
            $todayStr = $now->toDateString();

            // 1. Delete sessions whose date is before today
            $pastSessions = ClassSession::where('date', '<', $todayStr)->get();
            foreach ($pastSessions as $ps) {
                WorkoutSession::where('client_session_id', 'admin_class_' . $ps->id)->delete();
                $ps->delete();
            }

            // 2. Delete today's sessions if 2 hours past scheduled start time
            $todaySessions = ClassSession::where('date', $todayStr)->get();
            foreach ($todaySessions as $ts) {
                if ($ts->time) {
                    try {
                        $sessionDateTime = Carbon::parse($todayStr . ' ' . $ts->time);
                        if ($now->greaterThan($sessionDateTime->copy()->addHours(2))) {
                            WorkoutSession::where('client_session_id', 'admin_class_' . $ts->id)->delete();
                            $ts->delete();
                        }
                    } catch (\Throwable $e) {}
                }
            }
        } catch (\Throwable $e) {
            // Log or ignore cleanup error so schedule fetching still succeeds
        }
    }

    /**
     * Automatically sync scheduled session into each mentioned member's personal WorkoutSession tracker.
     */
    private function syncWorkoutSessionsForMembers(ClassSession $session, string $title, string $date, ?string $time, ?string $location, ?string $coach, ?string $description, ?array $memberIds): void
    {
        if (! is_array($memberIds) || count($memberIds) === 0) {
            WorkoutSession::where('client_session_id', 'admin_class_' . $session->id)->delete();
            return;
        }

        $timeVal = null;
        $timeAmpm = 'AM';
        if ($time) {
            $timeParts = explode(':', $time);
            $hour = (int) ($timeParts[0] ?? 0);
            $min = $timeParts[1] ?? '00';
            if ($hour >= 12) {
                $timeAmpm = 'PM';
                $displayHour = $hour > 12 ? $hour - 12 : 12;
            } else {
                $timeAmpm = 'AM';
                $displayHour = $hour === 0 ? 12 : $hour;
            }
            $timeVal = sprintf('%02d:%s', $displayHour, substr($min, 0, 2));
        }

        // Remove workout sessions for any un-mentioned members
        WorkoutSession::where('client_session_id', 'admin_class_' . $session->id)
            ->whereNotIn('user_id', $memberIds)
            ->delete();

        foreach ($memberIds as $userId) {
            $user = User::find($userId);
            if (! $user) continue;

            WorkoutSession::updateOrCreate(
                [
                    'user_id'           => $user->id,
                    'client_session_id' => 'admin_class_' . $session->id,
                    'session_date'      => $date,
                ],
                [
                    'title'         => $title,
                    'is_rest_day'   => false,
                    'status'        => 'upcoming',
                    'time_val'      => $timeVal,
                    'time_ampm'     => $timeAmpm,
                    'location'      => $location ?: 'Gym Floor B',
                    'coach'         => $coach ?: null,
                    'custom_target' => $description ?: null,
                    'exercises'     => [],
                ]
            );
        }
    }

    /** GET /api/schedule */
    public function index()
    {
        $this->cleanupExpiredSessions();

        return response()->json(
            ClassSession::orderBy('date', 'asc')->orderBy('time', 'asc')->get()
        );
    }

    /** POST /api/schedule */
    public function store(Request $request)
    {
        $this->cleanupExpiredSessions();

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

        // 1. Automatically add to mentioned members' schedule
        $this->syncWorkoutSessionsForMembers($session, $title, $date, $time, $location, $coach, $description, is_array($memberIds) ? $memberIds : []);

        // 2. Send notifications to all mentioned members
        if (is_array($memberIds) && count($memberIds) > 0) {
            foreach ($memberIds as $userId) {
                $user = User::find($userId);
                if ($user) {
                    Notification::create([
                        'user_id' => $user->id,
                        'title'   => 'New Session on Your Schedule: ' . $title,
                        'message' => "Admin scheduled '{$title}' on {$date}" . ($time ? " at {$time}" : '') . ($location ? " ({$location})" : '') . ". It has been automatically added to your Schedule tab!",
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
        $this->cleanupExpiredSessions();

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

        // Sync updated schedule into mentioned members' personal trackers
        $this->syncWorkoutSessionsForMembers($session, $title, $date, $time, $location, $coach, $description, is_array($memberIds) ? $memberIds : []);

        return response()->json(['message' => 'Session updated', 'session' => $session]);
    }

    /** DELETE /api/schedule/{id} */
    public function destroy(int $id)
    {
        $session = ClassSession::find($id);
        if (! $session) {
            return response()->json(['message' => 'Session not found'], 404);
        }

        // Clean up from member personal trackers as well
        WorkoutSession::where('client_session_id', 'admin_class_' . $id)->delete();

        $session->delete();
        return response()->json(['message' => 'Session deleted']);
    }
}
