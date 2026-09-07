<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ActivityLogController extends Controller
{
    /**
     * GET /api/admin/activity-logs
     * Returns paginated activity log records and overview metrics.
     */
    public function index(Request $request): JsonResponse
    {
        $query = ActivityLog::query()->orderBy('created_at', 'desc');

        // Filter: action_type
        $actionType = $request->input('action_type');
        if ($actionType && $actionType !== 'all') {
            if ($actionType === 'auth') {
                $query->whereIn('action_type', ['login', 'logout']);
            } elseif ($actionType === 'member') {
                $query->whereIn('action_type', ['member_approval', 'member_reject', 'member_update', 'attendance_checkin']);
            } elseif ($actionType === 'inventory') {
                $query->whereIn('action_type', ['inventory_add', 'inventory_update', 'inventory_delete']);
            } elseif ($actionType === 'system') {
                $query->whereIn('action_type', ['equipment_update', 'staff_update', 'system_setting', 'report_export']);
            } else {
                $query->where('action_type', $actionType);
            }
        }

        // Filter: staff / user_id
        if ($request->filled('user_id') && $request->input('user_id') !== 'all') {
            $query->where('user_id', $request->input('user_id'));
        }

        // Filter: date range
        if ($request->filled('start_date')) {
            $query->whereDate('created_at', '>=', $request->input('start_date'));
        }
        if ($request->filled('end_date')) {
            $query->whereDate('created_at', '<=', $request->input('end_date'));
        }

        // Search: keyword in username, full_name, description, or IP
        if ($request->filled('search')) {
            $s = trim($request->input('search'));
            $query->where(function ($q) use ($s) {
                $q->where('username', 'like', "%{$s}%")
                  ->orWhere('full_name', 'like', "%{$s}%")
                  ->orWhere('action_title', 'like', "%{$s}%")
                  ->orWhere('description', 'like', "%{$s}%")
                  ->orWhere('ip_address', 'like', "%{$s}%");
            });
        }

        $perPage = max(5, min(100, (int) $request->input('per_page', 25)));
        $logs = $query->paginate($perPage);

        // Calculate summary metrics for today
        $todayStart = now()->startOfDay();
        $todayEnd = now()->endOfDay();

        $loginsToday = ActivityLog::where('action_type', 'login')
            ->whereBetween('created_at', [$todayStart, $todayEnd])
            ->count();

        $modificationsToday = ActivityLog::whereNotIn('action_type', ['login', 'logout'])
            ->whereBetween('created_at', [$todayStart, $todayEnd])
            ->count();

        $activeStaffCount = ActivityLog::where('action_type', 'login')
            ->where('created_at', '>=', now()->subHours(8))
            ->whereNull('logout_at')
            ->distinct('user_id')
            ->count('user_id');

        // Staff list for filtering dropdown
        $staffUsers = User::whereIn('role', ['admin', 'super_admin', 'employee'])
            ->select('id', 'username', 'first_name', 'last_name', 'role')
            ->orderBy('username')
            ->get()
            ->map(function ($u) {
                $name = trim(($u->first_name ?? '') . ' ' . ($u->last_name ?? ''));
                return [
                    'id'       => $u->id,
                    'username' => $u->username,
                    'name'     => $name ?: $u->username,
                    'role'     => $u->role,
                ];
            });

        return response()->json([
            'logs'    => $logs,
            'metrics' => [
                'logins_today'        => $loginsToday,
                'modifications_today' => $modificationsToday,
                'active_staff_now'    => $activeStaffCount,
            ],
            'staff_list' => $staffUsers,
        ]);
    }
}
