<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Models\User;
use App\Services\SmsService;
use Illuminate\Http\Request;

/**
 * Ported from server/routes/notification.js.
 */
class NotificationController extends Controller
{
    private function formatHomeWorkoutList(array $exercises): string
    {
        $lines = array_filter(
            array_slice(array_map('trim', $exercises), 0, 4),
            fn ($e) => $e !== ''
        );

        if (empty($lines)) {
            return 'Open Schedule to view your home workout alternatives.';
        }

        $numbered = array_values(array_map(
            fn ($line, $i) => ($i + 1).") {$line}",
            $lines,
            array_keys($lines)
        ));

        return "Home workout:\n" . implode("\n", $numbered);
    }

    /**
     * GET /api/notifications
     * Staff: all notifications. Members: own notices (any time) + broadcasts
     * (user_id IS NULL) that were sent on/after the member's own signup date.
     * Without that second condition every member — including one who just
     * created their account seconds ago — would see the FULL history of
     * every broadcast/system notice ever sent (old QA/test broadcasts,
     * announcements meant for a different cohort, etc.), which is not
     * accurate for them.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $isStaff = in_array($user->role, ['admin', 'super_admin', 'employee'], true);

        if ($isStaff) {
            return response()->json(Notification::orderByDesc('created_at')->get());
        }

        $rows = Notification::where(fn ($q) => $q
                ->where('user_id', $user->id)
                ->orWhere(fn ($broadcast) => $broadcast
                    ->whereNull('user_id')
                    ->where('created_at', '>=', $user->created_at)
                )
            )
            ->orderByDesc('created_at')
            ->get();

        return response()->json($rows);
    }

    /**
     * POST /api/notifications
     */
    public function store(Request $request)
    {
        $message = trim((string) $request->input('message', ''));
        if (! $message) {
            return response()->json(['message' => 'Message is required'], 400);
        }

        $isAdmin = in_array($request->user()->role, ['admin', 'super_admin', 'employee'], true);
        $targetUserId = $isAdmin
            ? ($request->input('user_id') ?: null)
            : $request->user()->id;

        $notification = Notification::create([
            'user_id' => $targetUserId,
            'title'   => $request->input('title') ?: 'Notice',
            'message' => $message,
        ]);

        return response()->json(['id' => $notification->id, 'message' => 'Notification sent'], 201);
    }

    /**
     * POST /api/notifications/missed-workout-alert
     */
    public function missedWorkoutAlert(Request $request)
    {
        $sessionTitle  = trim((string) $request->input('sessionTitle', ''));
        $dayLabel      = trim((string) $request->input('dayLabel', ''));
        $homeExercises = is_array($request->input('homeExercises')) ? $request->input('homeExercises') : [];
        $sessionKey    = trim((string) $request->input('sessionKey', ''));

        if (! $sessionTitle || ! $dayLabel) {
            return response()->json(['message' => 'sessionTitle and dayLabel are required.'], 400);
        }

        $title = "Missed Workout: {$sessionTitle}";
        $body  = "You missed your {$sessionTitle} session on {$dayLabel}.\n\n"
               . $this->formatHomeWorkoutList($homeExercises);

        // Dedup on (user_id, session_key) when the client sends one — the
        // frontend already builds a stable key per session/day (see
        // NotificationCenterService.notifyMissedWorkout()), so a retry or a
        // reinstalled/cleared client re-reporting the same missed session
        // updates the existing row instead of creating a duplicate. Falls
        // back to a plain create() for older clients that don't send one yet.
        if ($sessionKey !== '') {
            Notification::updateOrCreate(
                ['user_id' => $request->user()->id, 'session_key' => $sessionKey],
                ['title' => $title, 'message' => $body]
            );
        } else {
            Notification::create([
                'user_id' => $request->user()->id,
                'title'   => $title,
                'message' => $body,
            ]);
        }

        // SMS (best-effort)
        $user      = User::find($request->user()->id);
        $smsPhone  = $user?->phone ? SmsService::normalizePhoneNumber($user->phone) : '';
        $username  = $user?->username ?? 'Member';
        $smsResult = ['sent' => false, 'skippedReason' => 'No phone number on file'];

        if ($smsPhone !== '') {
            $preview = implode(' | ', array_filter(
                array_slice(array_map('trim', $homeExercises), 0, 2),
                fn ($e) => $e !== ''
            ));

            $smsMessage = $preview
                ? "FordaGO: Hi {$username}, you missed {$sessionTitle} ({$dayLabel}). Home workout: {$preview}. Open app for full guide."
                : "FordaGO: Hi {$username}, you missed {$sessionTitle} ({$dayLabel}). Open app for your home workout guide.";

            $smsResult = SmsService::send($smsPhone, $smsMessage);
        }

        return response()->json([
            'message'   => 'Missed workout alert delivered.',
            'smsSent'   => (bool) $smsResult['sent'],
            'smsReason' => $smsResult['sent']
                ? null
                : ($smsResult['skippedReason'] ?? $smsResult['error'] ?? 'SMS not sent'),
        ], 201);
    }

    /**
     * PATCH /api/notifications/read
     */
    public function markRead(Request $request)
    {
        $ids = $request->input('ids');
        if (! is_array($ids) || empty($ids)) {
            return response()->json(['message' => 'ids array is required'], 400);
        }

        Notification::whereIn('id', $ids)
            ->where(fn ($q) => $q
                ->where('user_id', $request->user()->id)
                ->orWhereNull('user_id')
            )
            ->update(['is_read' => true]);

        return response()->json(['message' => 'Marked as read']);
    }

    /**
     * DELETE /api/notifications/{id}
     */
    public function destroy(int $id)
    {
        $notification = Notification::find($id);
        if (! $notification) {
            return response()->json(['message' => 'Notification not found'], 404);
        }
        $notification->delete();
        return response()->json(['message' => 'Notification deleted']);
    }
}
