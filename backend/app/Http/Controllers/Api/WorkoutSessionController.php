<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ClassSession;
use App\Models\WorkoutSession;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Validation\Rule;

/**
 * Backed by the `workout_sessions` table (see
 * database/migrations/2026_08_11_100000_create_workout_sessions_table.php).
 *
 * This persists the per-user personal workout tracker that used to live
 * only in the frontend's WorkoutTrackerService localStorage
 * (`fordago_schedule_sessions_v2_{userId}`). It is NOT the gym class
 * schedule (see ScheduleController for that — untouched, still separate).
 *
 * Every endpoint here is scoped to $request->user()->id — a user can only
 * ever read or write their own sessions.
 */
class WorkoutSessionController extends Controller
{
    /**
     * GET /api/workout-sessions
     * Optional ?from=YYYY-MM-DD&to=YYYY-MM-DD to bound the range (e.g. the
     * dashboard's 28-day heatmap window). Without params, returns
     * everything for the user — per-user volume stays small for a gym app,
     * so this is safe to keep simple rather than force month pagination.
     */
    public function index(Request $request)
    {
        $userId = $request->user()->id;

        // Auto-sync any admin class sessions that mentioned this user.
        // IMPORTANT: this is wrapped in a daily cache per-user so the
        // expensive `ClassSession::all()` + `updateOrCreate` loop only
        // runs ONCE every 24 hours instead of on every GET request.
        $cacheKey = "workout_session_sync_{$userId}_" . now()->toDateString();
        if (! Cache::has($cacheKey)) {
            try {
                $classSessions = ClassSession::all();
                foreach ($classSessions as $cs) {
                    $mIds = $cs->member_ids;
                    if (is_string($mIds)) {
                        $mIds = json_decode($mIds, true);
                    }
                    if (is_array($mIds) && in_array($userId, $mIds)) {
                        $timeVal = null;
                        $timeAmpm = 'AM';
                        if ($cs->time) {
                            $timeParts = explode(':', $cs->time);
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

                        WorkoutSession::updateOrCreate(
                            [
                                'user_id'           => $userId,
                                'client_session_id' => 'admin_class_' . $cs->id,
                                'session_date'      => $cs->date,
                            ],
                            [
                                'title'         => $cs->title,
                                'is_rest_day'   => false,
                                'status'        => 'upcoming',
                                'time_val'      => $timeVal,
                                'time_ampm'     => $timeAmpm,
                                'duration'      => $cs->duration ?: '60 min',
                                'location'      => $cs->location ?: 'Gym Floor B',
                                'coach'         => $cs->coach ?: null,
                                'custom_target' => $cs->description ?: null,
                                'exercises'     => [],
                            ]
                        );
                    }
                }
            } catch (\Throwable $e) {}

            // Mark as synced for today — expire at midnight so tomorrow's
            // class sessions are still picked up automatically.
            $secondsUntilMidnight = now()->endOfDay()->diffInSeconds(now());
            Cache::put($cacheKey, true, $secondsUntilMidnight);
        }

        $query = WorkoutSession::where('user_id', $userId);

        $from = $request->query('from');
        $to   = $request->query('to');
        if (is_string($from) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $from)) {
            $query->whereDate('session_date', '>=', $from);
        }
        if (is_string($to) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $to)) {
            $query->whereDate('session_date', '<=', $to);
        }

        // 30-second cache per user+range: prevents the 287kB payload from
        // being re-fetched on every page open when multiple components load.
        $rangeCacheKey = "workout_sessions.{$userId}." . ($from ?? 'all') . '.' . ($to ?? 'all');
        $rows = Cache::remember($rangeCacheKey, 30, function () use ($query) {
            $sessions = $query->orderBy('session_date')->get();
            $grouped = $sessions->groupBy(fn ($s) => substr((string) $s->session_date, 0, 10));
            $cleaned = [];
            foreach ($grouped as $date => $dateSessions) {
                $hasNonRest = $dateSessions->contains(fn ($s) => ! $s->is_rest_day);
                if ($hasNonRest) {
                    foreach ($dateSessions as $s) {
                        if (! $s->is_rest_day) {
                            $cleaned[] = $s->toArray();
                        }
                    }
                } else {
                    foreach ($dateSessions as $s) {
                        $cleaned[] = $s->toArray();
                    }
                }
            }
            return $cleaned;
        });

        return response()->json($rows);
    }

    /**
     * POST /api/workout-sessions
     * Upsert: creates the row, or updates it in place if the same
     * (user_id, client_session_id, session_date) already exists — so
     * calling this twice with the same session never creates a duplicate.
     */
    public function store(Request $request)
    {
        $validated = $this->validatePayload($request, forCreate: true);

        // If storing an active workout on this date, remove any stale rest-day records on this date
        if (! empty($validated['is_rest_day'])) {
            // User marked this date as Rest Day -> clean up non-rest records
            WorkoutSession::where('user_id', $request->user()->id)
                ->where('session_date', $validated['session_date'])
                ->where('is_rest_day', false)
                ->delete();
        } else {
            // User added a real workout -> clean up any rest day records on this date
            WorkoutSession::where('user_id', $request->user()->id)
                ->where('session_date', $validated['session_date'])
                ->where('is_rest_day', true)
                ->delete();
        }

        $session = WorkoutSession::updateOrCreate(
            [
                'user_id'            => $request->user()->id,
                'client_session_id'  => $validated['client_session_id'],
                'session_date'       => $validated['session_date'],
            ],
            $validated
        );

        // Invalidate the cached session list for this user
        Cache::forget("workout_sessions.{$request->user()->id}.all.all");
        Cache::forget("workout_session_sync_{$request->user()->id}_" . now()->toDateString());

        return response()->json($session, 201);
    }

    /**
     * PATCH /api/workout-sessions/{clientSessionId}
     * Partial update (status, exercises, actual_minutes, started_at, ...).
     * session_date must be included in the body — it's part of the
     * identifying key alongside the URL's clientSessionId, since a custom
     * session id is only guaranteed unique per-date, not globally.
     */
    public function update(Request $request, string $clientSessionId)
    {
        $sessionDate = $request->input('session_date');
        if (! is_string($sessionDate) || ! preg_match('/^\d{4}-\d{2}-\d{2}$/', $sessionDate)) {
            return response()->json(['message' => 'session_date (YYYY-MM-DD) is required to locate the session.'], 400);
        }

        $session = WorkoutSession::where('user_id', $request->user()->id)
            ->where('client_session_id', $clientSessionId)
            ->where('session_date', $sessionDate)
            ->first();

        if (! $session) {
            return response()->json(['message' => 'Session not found.'], 404);
        }

        $validated = $this->validatePayload($request, forCreate: false);
        // Never let a partial update blank out identifying fields.
        unset($validated['client_session_id'], $validated['session_date'], $validated['user_id']);

        $session->update($validated);

        // Invalidate the cached session list for this user
        Cache::forget("workout_sessions.{$request->user()->id}.all.all");
        Cache::forget("workout_session_sync_{$request->user()->id}_" . now()->toDateString());

        return response()->json($session);
    }

    /** DELETE /api/workout-sessions/{clientSessionId}?session_date=YYYY-MM-DD */
    public function destroy(Request $request, string $clientSessionId)
    {
        $sessionDate = $request->query('session_date');
        if (! is_string($sessionDate) || ! preg_match('/^\d{4}-\d{2}-\d{2}$/', $sessionDate)) {
            return response()->json(['message' => 'session_date (YYYY-MM-DD) query param is required.'], 400);
        }

        $deleted = WorkoutSession::where('user_id', $request->user()->id)
            ->where('client_session_id', $clientSessionId)
            ->where('session_date', $sessionDate)
            ->delete();

        // Invalidate the cached session list for this user
        Cache::forget("workout_sessions.{$request->user()->id}.all.all");
        Cache::forget("workout_session_sync_{$request->user()->id}_" . now()->toDateString());

        return response()->noContent();
    }

    /** DELETE /api/workout-sessions/date/{sessionDate}?keep_done=1 */
    public function deleteByDate(Request $request, string $sessionDate)
    {
        if (! preg_match('/^\d{4}-\d{2}-\d{2}$/', $sessionDate)) {
            return response()->json(['message' => 'session_date (YYYY-MM-DD) is required.'], 400);
        }

        $query = WorkoutSession::where('user_id', $request->user()->id)
            ->where('session_date', $sessionDate);

        if ($request->boolean('keep_done', false)) {
            $query->where('status', '!=', 'done');
        }

        $query->delete();

        // Invalidate the cached session list for this user
        Cache::forget("workout_sessions.{$request->user()->id}.all.all");
        Cache::forget("workout_session_sync_{$request->user()->id}_" . now()->toDateString());

        return response()->noContent();
    }

    /**
     * Shared validation for store()/update(). forCreate=true requires the
     * identifying fields; forCreate=false makes everything optional since
     * PATCH may only touch e.g. { status, exercises }.
     */
    private function validatePayload(Request $request, bool $forCreate): array
    {
        $req = $forCreate ? 'required' : 'sometimes';

        return $request->validate([
            'client_session_id' => [$forCreate ? 'required' : 'sometimes', 'string', 'max:100'],
            'session_date'      => [$forCreate ? 'required' : 'sometimes', 'date_format:Y-m-d'],
            'title'             => [$req, 'string', 'max:255'],
            'is_rest_day'       => ['sometimes', 'boolean'],
            'status'            => [$req, Rule::in(['upcoming', 'optional', 'missed', 'done'])],
            'exercises'         => ['sometimes', 'nullable', 'array'],
            'actual_minutes'    => ['sometimes', 'nullable', 'integer', 'min:0', 'max:1440'],
            'started_at'        => ['sometimes', 'nullable', 'date'],
            'time_val'          => ['sometimes', 'nullable', 'string', 'max:10'],
            'time_ampm'         => ['sometimes', 'nullable', 'string', 'max:2'],
            'location'          => ['sometimes', 'nullable', 'string', 'max:255'],
            'coach'             => ['sometimes', 'nullable', 'string', 'max:255'],
            'custom_target'     => ['sometimes', 'nullable', 'string', 'max:255'],
        ]);
    }
}
