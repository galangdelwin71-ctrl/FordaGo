<?php

namespace App\Console\Commands;

use App\Events\NotificationSent;
use App\Models\Notification;
use App\Models\WorkoutSession;
use App\Services\FcmService;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class CheckWorkoutNotifications extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'workouts:check-notifications';

    /**
     * The console command description.
     */
    protected $description = 'Check today\'s workout sessions and send 30-minute upcoming reminders and missed workout alerts via FCM';

    /**
     * Home workout exercise guides per workout title.
     */
    private array $homeWorkoutMap = [
        'Upper Body'           => ['3 × 15 Push-ups', '3 × 12 Tricep Dips', '3 × 10 Pike Push-ups', '2 × 15 Diamond Push-ups'],
        'Lower Body / Leg Day' => ['3 × 15 Squats', '3 × 12 Lunges each leg', '3 × 20 Calf Raises', '2 × 30s Wall Sit'],
        'Cardio & Core'        => ['3 × 20 Mountain Climbers', '3 × 15 Burpees', '3 × 30 Bicycle Crunches', '2 min Jump Rope'],
        'Full Body'            => ['3 × 10 Burpees', '3 × 12 Push-ups', '3 × 15 Squats', '3 × 20 Jumping Jacks'],
        'Mobility & Stretch'   => ['2 min Hip Flexor Stretch', '2 min Hamstring Stretch', '90s Shoulder Mobility', '2 min Cat-Cow Flow'],
    ];

    /**
     * Execute the console command.
     */
    public function handle(FcmService $fcmService): int
    {
        // Use Asia/Manila (PHT, UTC+8) for local gym members
        $now = Carbon::now('Asia/Manila');
        $todayStr = $now->toDateString();

        $this->info("Checking workout notifications for {$todayStr} at {$now->toTimeString()} (Asia/Manila)");

        // Fetch today's upcoming non-rest sessions
        $sessions = WorkoutSession::with('user')
            ->whereDate('session_date', $todayStr)
            ->where('is_rest_day', false)
            ->where('status', 'upcoming')
            ->whereNull('started_at')
            ->whereNotNull('time_val')
            ->get();

        $reminderCount = 0;
        $missedCount   = 0;

        foreach ($sessions as $session) {
            $user = $session->user;
            if (! $user) {
                continue;
            }

            // Parse session scheduled time in Asia/Manila
            $timeVal = trim((string) $session->time_val);
            $timeAmpm = strtoupper(trim((string) $session->time_ampm));
            if (! preg_match('/^(\d{1,2}):(\d{2})$/', $timeVal, $matches)) {
                continue;
            }

            $hour = (int) $matches[1];
            $minute = (int) $matches[2];
            if ($timeAmpm === 'PM' && $hour < 12) {
                $hour += 12;
            } elseif ($timeAmpm === 'AM' && $hour === 12) {
                $hour = 0;
            }

            $sessionDate = substr((string) $session->session_date, 0, 10);
            $scheduledAt = Carbon::createFromFormat(
                'Y-m-d H:i:s',
                "{$sessionDate} " . sprintf('%02d:%02d:00', $hour, $minute),
                'Asia/Manila'
            );

            // diff in minutes: positive if scheduledAt is in the future, negative if in the past
            $diffMinutes = $now->diffInMinutes($scheduledAt, false);

            // 1. 30-MINUTE UPCOMING WORKOUT REMINDER
            // Fires when the session is between 25 and 35 minutes away
            if ($diffMinutes >= 25 && $diffMinutes <= 35) {
                $reminderKey = "fcm_upcoming_30m_{$session->id}_{$todayStr}";
                if (! Cache::has($reminderKey)) {
                    Cache::put($reminderKey, true, now()->endOfDay()->addHours(6));

                    $title = "⏰ Upcoming Workout in 30 Minutes: {$session->title}";
                    $body  = "Your {$session->title} workout is scheduled at {$session->time_val} {$session->time_ampm}. Get ready!";

                    // In-app notification record
                    $sessionKey = "upcoming-{$todayStr}-" . ($session->client_session_id ?? $session->id);
                    $notif = Notification::updateOrCreate(
                        ['user_id' => $user->id, 'session_key' => $sessionKey],
                        ['title' => $title, 'message' => $body]
                    );

                    try {
                        broadcast(new NotificationSent($notif, $user->id))->toOthers();
                    } catch (\Throwable $e) {
                        Log::warning("Broadcasting upcoming notification failed: " . $e->getMessage());
                    }

                    // High-priority FCM push to ring the phone outside the app
                    $fcmService->sendToUser($user->id, $title, $body, [
                        'type'        => 'upcoming_workout',
                        'targetRoute' => '/schedule',
                        'channel_id'  => 'fordago-alerts-v3',
                    ]);

                    $this->line("Sent 30-min reminder to User {$user->id} ({$user->username}) for {$session->title}");
                    $reminderCount++;
                }
            }

            // 2. MISSED WORKOUT ALERT
            // Fires when scheduled start time has passed by >= 1 minute
            if ($diffMinutes <= -1) {
                $missedKey = "fcm_missed_{$session->id}_{$todayStr}";
                if (! Cache::has($missedKey)) {
                    Cache::put($missedKey, true, now()->endOfDay()->addHours(6));

                    // Update session status to missed in database
                    $session->status = 'missed';
                    $session->save();

                    // Home workout guide
                    $homeAlternatives = $this->homeWorkoutMap[$session->title] ?? $this->homeWorkoutMap['Full Body'];
                    $formattedExercises = implode(' • ', $homeAlternatives);

                    $title = "Missed Workout: {$session->title}";
                    $body  = "You missed your {$session->title} session scheduled for {$session->time_val} {$session->time_ampm}.\n\nHome workout: {$formattedExercises}";

                    // In-app notification record
                    $sessionKey = "missed-{$todayStr}-" . ($session->client_session_id ?? $session->id);
                    $notif = Notification::updateOrCreate(
                        ['user_id' => $user->id, 'session_key' => $sessionKey],
                        ['title' => $title, 'message' => $body]
                    );

                    try {
                        broadcast(new NotificationSent($notif, $user->id))->toOthers();
                    } catch (\Throwable $e) {
                        Log::warning("Broadcasting missed notification failed: " . $e->getMessage());
                    }

                    // High-priority FCM push to ring the phone outside the app
                    $fcmService->sendToUser($user->id, $title, "You missed your {$session->title} workout scheduled for {$session->time_val} {$session->time_ampm}. Check FordaGo for home workout alternatives!", [
                        'type'        => 'missed_workout',
                        'targetRoute' => '/schedule',
                        'channel_id'  => 'fordago-alarms-v3',
                    ]);

                    $this->line("Sent missed alert to User {$user->id} ({$user->username}) for {$session->title}");
                    $missedCount++;
                }
            }
        }

        $this->info("Done. Reminders sent: {$reminderCount}, Missed alerts sent: {$missedCount}");
        return 0;
    }
}
