<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\Request;

/**
 * Ported from server/routes/attendance.js.
 */
class AttendanceController extends Controller
{
    private const GYM_QR_CODE = 'FORDAGO_GYM_CHECKIN_V1';

    private function parseDate(?string $value): ?string
    {
        $input = trim((string) $value);
        return preg_match('/^\d{4}-\d{2}-\d{2}$/', $input) ? $input : null;
    }

    /**
     * POST /api/attendance/checkin
     */
    public function checkin(Request $request)
    {
        if ($request->input('qr_code') !== self::GYM_QR_CODE) {
            return response()->json(['message' => 'Invalid QR code. Please scan the official gym QR code.'], 400);
        }

        $user = User::find($request->user()->id);
        if (! $user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        // Already checked in today?
        $today = now()->toDateString();
        $existing = Attendance::where('user_id', $user->id)
            ->whereDate('check_in_time', $today)
            ->first();

        if ($existing) {
            return response()->json([
                'message'    => 'Already checked in today.',
                'attendance' => $existing,
            ], 409);
        }

        if ($user->membership_status !== 'active') {
            $msg = $user->membership_type === 'premium'
                ? 'Your Premium account is pending admin payment verification. Please wait for approval.'
                : 'Your Daily Pass account is pending admin verification. Please wait for approval.';
            return response()->json(['message' => $msg], 403);
        }

        if ($user->membership_type === 'premium') {
            if (! $user->membership_expiry || $user->membership_expiry->isPast()) {
                return response()->json(['message' => 'Your Premium membership has expired. Please renew at the gym counter.'], 403);
            }
        }

        $paymentStatus = $user->membership_type === 'premium' ? 'paid' : 'pending';

        $attendance = Attendance::create([
            'user_id'        => $user->id,
            'membership_type' => $user->membership_type,
            'payment_status' => $paymentStatus,
        ]);

        // Notify admin for daily pass check-ins
        if ($user->membership_type === 'daily') {
            try {
                $admin = User::where('role', 'admin')->first();
                if ($admin) {
                    Notification::create([
                        'user_id' => $admin->id,
                        'title'   => "Payment Pending: {$user->username}",
                        'message' => "{$user->username} is requesting check-in (Daily Pass ₱40). Please collect payment and confirm to complete their attendance.",
                    ]);
                }
            } catch (\Throwable) {
                // best-effort
            }
        }

        return response()->json([
            'message' => $user->membership_type === 'daily'
                ? 'Check-in request submitted. Waiting for admin to confirm your payment.'
                : 'Check-in successful! Welcome to the gym 💪',
            'attendance_id'   => $attendance->id,
            'payment_status'  => $paymentStatus,
            'membership_type' => $user->membership_type,
        ]);
    }

    /**
     * GET /api/attendance/my
     */
    public function my(Request $request)
    {
        $rows = Attendance::query()
            ->leftJoin('users as confirmer', 'confirmer.id', '=', 'attendance.confirmed_by')
            ->where('attendance.user_id', $request->user()->id)
            ->orderByDesc('attendance.check_in_time')
            ->limit(30)
            ->select('attendance.*', 'confirmer.username as confirmed_by_name')
            ->get();

        return response()->json($rows);
    }

    /**
     * GET /api/attendance/today
     */
    public function today()
    {
        $today = now()->toDateString();

        $rows = Attendance::query()
            ->join('users', 'users.id', '=', 'attendance.user_id')
            ->whereDate('attendance.check_in_time', $today)
            ->orderByDesc('attendance.check_in_time')
            ->select('attendance.*', 'users.username', 'users.email', 'users.membership_type as user_plan')
            ->get();

        return response()->json($rows);
    }

    /**
     * GET /api/attendance/by-date?date=YYYY-MM-DD
     */
    public function byDate(Request $request)
    {
        $date = $this->parseDate($request->query('date')) ?? now()->toDateString();

        $rows = Attendance::query()
            ->join('users', 'users.id', '=', 'attendance.user_id')
            ->whereDate('attendance.check_in_time', $date)
            ->orderByDesc('attendance.check_in_time')
            ->select('attendance.*', 'users.username', 'users.email', 'users.membership_type as user_plan')
            ->get();

        return response()->json($rows);
    }

    /**
     * GET /api/attendance/pending
     */
    public function pending()
    {
        $rows = Attendance::query()
            ->join('users', 'users.id', '=', 'attendance.user_id')
            ->where('attendance.payment_status', 'pending')
            ->orderByDesc('attendance.check_in_time')
            ->select('attendance.*', 'users.username', 'users.email', 'users.phone')
            ->get();

        return response()->json($rows);
    }

    /**
     * PUT /api/attendance/{id}/confirm
     */
    public function confirm(Request $request, int $id)
    {
        $attendance = Attendance::find($id);
        if (! $attendance) {
            return response()->json(['message' => 'Attendance record not found'], 404);
        }

        $attendance->update([
            'payment_status' => 'paid',
            'confirmed_by'   => $request->user()->id,
            'confirmed_at'   => now(),
        ]);

        try {
            Notification::create([
                'user_id' => $attendance->user_id,
                'title'   => 'Check-in Confirmed! ✅',
                'message' => 'Your ₱40 daily pass payment has been confirmed by the admin. Your attendance has been recorded. Enjoy your workout! 💪',
            ]);
        } catch (\Throwable) {
            // best-effort
        }

        return response()->json(['message' => 'Attendance confirmed and payment recorded.']);
    }

    /**
     * PUT /api/attendance/{id}/reject
     */
    public function reject(int $id)
    {
        $attendance = Attendance::find($id);
        if (! $attendance) {
            return response()->json(['message' => 'Attendance record not found'], 404);
        }

        $userId = $attendance->user_id;
        $attendance->delete();

        try {
            Notification::create([
                'user_id' => $userId,
                'title'   => 'Check-in Rejected',
                'message' => 'Your check-in request was not confirmed. Please visit the admin counter for assistance.',
            ]);
        } catch (\Throwable) {
            // best-effort
        }

        return response()->json(['message' => 'Attendance request rejected.']);
    }

    /**
     * GET /api/attendance/qr-code
     */
    public function qrCode()
    {
        return response()->json(['qr_code' => self::GYM_QR_CODE]);
    }
}
