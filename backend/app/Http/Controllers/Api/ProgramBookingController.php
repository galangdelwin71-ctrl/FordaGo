<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CoachProgram;
use App\Models\Notification;
use App\Models\ProgramBooking;
use App\Models\WorkoutSession;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Public group-class "avail" flow: any member can instant-book a seat in a
 * coach's posted public CoachProgram, up to its capacity. No conversation,
 * no coach approval — that's still the ProposalController flow for 1-on-1
 * coaching. No online payment gateway exists yet, so every booking starts
 * as 'pay_at_gym' (see program_bookings migration).
 */
class ProgramBookingController extends Controller
{
    /**
     * GET /api/programs/public
     * Browse all public, still-upcoming classes any authenticated user can avail of.
     */
    public function publicIndex(Request $request)
    {
        $userId = $request->user()->id;

        $programs = CoachProgram::with([
            'items',
            'coach:id,username,first_name,last_name,profile_image',
        ])
            ->withCount(['activeBookings as booked_count'])
            ->where('is_public', true)
            ->whereDate('session_date', '>=', now()->toDateString())
            ->orderBy('session_date')
            ->orderBy('time_val')
            ->get();

        return response()->json(
            $programs->map(fn (CoachProgram $program) => $this->presentPublicProgram($program, $userId))
        );
    }

    /**
     * GET /api/programs/public/{id}
     */
    public function publicShow(int $id, Request $request)
    {
        $userId = $request->user()->id;

        $program = CoachProgram::with([
            'items',
            'coach:id,username,first_name,last_name,profile_image',
        ])
            ->withCount(['activeBookings as booked_count'])
            ->where('is_public', true)
            ->find($id);

        if (! $program) {
            return response()->json(['message' => 'Class not found.'], 404);
        }

        return response()->json($this->presentPublicProgram($program, $userId));
    }

    /**
     * POST /api/programs/{id}/book
     * "Avail" button: instant-book a seat, pay at gym.
     */
    public function book(int $id, Request $request)
    {
        $userId = $request->user()->id;

        $program = CoachProgram::with('coach')->where('is_public', true)->find($id);

        if (! $program) {
            return response()->json(['message' => 'Class not found.'], 404);
        }

        if ((int) $program->coach_id === (int) $userId) {
            return response()->json(['message' => 'You cannot book your own class.'], 403);
        }

        if ($program->session_date && $program->session_date->isPast()) {
            return response()->json(['message' => 'This class has already taken place.'], 400);
        }

        $result = DB::transaction(function () use ($program, $userId) {
            // Lock the program row so two concurrent bookings can't both
            // slip in past capacity on the same last seat.
            $lockedProgram = CoachProgram::where('id', $program->id)->lockForUpdate()->first();

            $activeCount = $lockedProgram->activeBookings()->count();
            if ($lockedProgram->capacity !== null && $activeCount >= $lockedProgram->capacity) {
                return ['error' => 'This class is already full.'];
            }

            $existing = ProgramBooking::where('program_id', $lockedProgram->id)
                ->where('member_id', $userId)
                ->first();

            if ($existing && $existing->isBooked()) {
                return ['error' => 'You already availed this class.', 'status' => 200, 'booking' => $existing];
            }

            if ($existing) {
                // Re-booking after a cancel: flip the same row back on
                // instead of violating the (program_id, member_id) unique
                // constraint with a fresh insert.
                $existing->update([
                    'status'         => ProgramBooking::STATUS_BOOKED,
                    'payment_status' => 'pay_at_gym',
                    'booked_at'      => now(),
                ]);
                $booking = $existing;
            } else {
                $booking = ProgramBooking::create([
                    'program_id'     => $lockedProgram->id,
                    'member_id'      => $userId,
                    'status'         => ProgramBooking::STATUS_BOOKED,
                    'payment_status' => 'pay_at_gym',
                    'booked_at'      => now(),
                ]);
            }

            $coachUser = $lockedProgram->coach;
            $coachName = trim(($coachUser->first_name ?? '') . ' ' . ($coachUser->last_name ?? ''))
                ?: ($coachUser->username ?? 'Coach');

            $exercises = $lockedProgram->items->map(fn ($item) => [
                'name' => $item->name,
                'sets' => (int) $item->sets,
                'reps' => (int) $item->reps,
                'done' => false,
            ])->toArray();

            $workoutSession = WorkoutSession::create([
                'user_id'           => $userId,
                'coach_id'          => $lockedProgram->coach_id,
                'booking_id'        => $booking->id,
                'session_date'      => $lockedProgram->session_date,
                'client_session_id' => 'program-booking-' . $booking->id . '-' . time(),
                'title'             => $lockedProgram->name,
                'is_rest_day'       => false,
                'status'            => 'upcoming',
                'exercises'         => $exercises,
                'time_val'          => $lockedProgram->time_val,
                'time_ampm'         => $lockedProgram->time_ampm,
                'location'          => $lockedProgram->location ?: 'FordaGO Gym',
                'coach'             => $coachName,
                'custom_target'     => $lockedProgram->duration_minutes . ' mins',
            ]);

            Notification::create([
                'user_id' => $lockedProgram->coach_id,
                'title'   => 'New class booking',
                'message' => 'A member availed a seat in "' . $lockedProgram->name . '".',
            ]);

            return ['booking' => $booking, 'workout_session' => $workoutSession];
        });

        if (isset($result['error'])) {
            return response()->json(['message' => $result['error']], $result['status'] ?? 409);
        }

        return response()->json([
            'message'         => 'Class booked! Pay at the gym on session day. Added to your schedule.',
            'booking'         => $result['booking'],
            'workout_session' => $result['workout_session'],
        ], 201);
    }

    /**
     * POST /api/programs/{id}/book/cancel
     * Member cancels their own seat.
     */
    public function cancel(int $id, Request $request)
    {
        $userId = $request->user()->id;

        $booking = ProgramBooking::where('program_id', $id)
            ->where('member_id', $userId)
            ->first();

        if (! $booking || ! $booking->isBooked()) {
            return response()->json(['message' => 'You have no active booking for this class.'], 404);
        }

        DB::transaction(function () use ($booking) {
            $booking->update(['status' => ProgramBooking::STATUS_CANCELLED]);

            // Drop the auto-created personal session too, but only if the
            // member hasn't already started/finished it.
            WorkoutSession::where('booking_id', $booking->id)
                ->where('user_id', $booking->member_id)
                ->where('status', 'upcoming')
                ->delete();
        });

        return response()->json(['message' => 'Booking cancelled.', 'booking' => $booking->fresh()]);
    }

    /**
     * GET /api/coaches/programs/{id}/bookings
     * Roster for the coach who owns this program.
     */
    public function roster(int $id, Request $request)
    {
        if (! $request->user()->isCoach()) {
            return response()->json(['message' => 'Only coach accounts can access this.'], 403);
        }

        $program = CoachProgram::where('coach_id', $request->user()->id)->find($id);

        if (! $program) {
            return response()->json(['message' => 'Program not found.'], 404);
        }

        $bookings = ProgramBooking::with('member:id,username,first_name,last_name,profile_image')
            ->where('program_id', $program->id)
            ->where('status', ProgramBooking::STATUS_BOOKED)
            ->orderBy('booked_at')
            ->get();

        return response()->json($bookings);
    }

    /**
     * Shape a public program for the browse/detail endpoints: adds
     * spots_left and whether the current user already has a seat, without
     * leaking the full roster to non-owners.
     */
    private function presentPublicProgram(CoachProgram $program, int $userId): array
    {
        $bookedCount = (int) ($program->booked_count ?? $program->activeBookings()->count());
        $capacity = $program->capacity;

        $alreadyBooked = ProgramBooking::where('program_id', $program->id)
            ->where('member_id', $userId)
            ->where('status', ProgramBooking::STATUS_BOOKED)
            ->exists();

        return array_merge($program->toArray(), [
            'booked_count'   => $bookedCount,
            'spots_left'     => $capacity === null ? null : max(0, $capacity - $bookedCount),
            'is_full'        => $capacity !== null && $bookedCount >= $capacity,
            'already_booked' => $alreadyBooked,
        ]);
    }
}
