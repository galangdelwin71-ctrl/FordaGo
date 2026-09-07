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
        // Auto-close stale login records older than 12 hours that were never marked as logged out
        ActivityLog::where('action_type', 'login')
            ->whereNull('logout_at')
            ->where('created_at', '<', now()->subHours(12))
            ->update(['logout_at' => now()]);

        // Active sessions: single latest login per user within the active window (last 8 hours) with no logout_at
        $activeSessionsQuery = ActivityLog::where('action_type', 'login')
            ->where('created_at', '>=', now()->subHours(8))
            ->whereNull('logout_at');

        $activeLogIds = (clone $activeSessionsQuery)
            ->selectRaw('MAX(id) as id')
            ->groupBy('user_id')
            ->pluck('id')
            ->map(fn($id) => (int)$id)
            ->toArray();

        $activeCount = count($activeLogIds);

        $query = ActivityLog::query()->with('user')->orderBy('created_at', 'desc');

        // Filter: action_type / category
        $actionType = $request->input('action_type', $request->input('category'));
        if ($actionType && $actionType !== 'all') {
            if ($actionType === 'active_sessions') {
                $query->whereIn('id', !empty($activeLogIds) ? $activeLogIds : [0]);
            } elseif ($actionType === 'auth') {
                $query->whereIn('action_type', ['login', 'logout']);
            } elseif ($actionType === 'login') {
                $query->where('action_type', 'login');
            } elseif ($actionType === 'logout') {
                $query->where('action_type', 'logout');
            } elseif ($actionType === 'member' || $actionType === 'members') {
                $query->where(function($q) {
                    $q->whereIn('action_type', ['member_approval', 'member_reject', 'member_update', 'attendance_checkin'])
                      ->orWhere('entity_type', 'user');
                });
            } elseif ($actionType === 'inventory') {
                $query->whereIn('action_type', ['inventory_add', 'inventory_update', 'inventory_delete', 'approve_order']);
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

        // Resolve target users for logs referencing users
        $targetUserIds = [];
        foreach ($logs->getCollection() as $l) {
            if ($l->entity_type === 'user' && !empty($l->entity_id)) {
                $targetUserIds[] = (int) $l->entity_id;
            }
            if (preg_match_all('/(?:user|member)\s*#(\d+)/i', ($l->description ?? '') . ' ' . ($l->action_title ?? ''), $matches)) {
                foreach ($matches[1] as $uid) {
                    $targetUserIds[] = (int) $uid;
                }
            }
        }
        $targetUserIds = array_unique(array_filter($targetUserIds));
        $resolvedUsers = empty($targetUserIds) ? collect() : User::whereIn('id', $targetUserIds)->get()->keyBy('id');

        $logs->getCollection()->transform(function ($log) use ($resolvedUsers, $activeLogIds) {
            $log->action = $log->action_type;
            $log->is_active_session = in_array((int) $log->id, $activeLogIds, true);

            $desc = $log->description ?? '';
            $title = $log->action_title ?? '';
            $targetName = null;

            if ($log->entity_type === 'user' && !empty($log->entity_id)) {
                $target = $resolvedUsers->get((int) $log->entity_id);
                if ($target) {
                    $name = trim(($target->first_name ?? '') . ' ' . ($target->last_name ?? ''));
                    $targetName = $name ?: $target->username;
                }
            }

            // Replace any "user #<id> (@username)" or "user #<id>" with real full name
            $desc = preg_replace_callback('/(?:user|member)\s*#(\d+)(?:\s*\(@?([a-zA-Z0-9_.\-]+)\))?/i', function ($m) use ($resolvedUsers) {
                $uid = (int) $m[1];
                $target = $resolvedUsers->get($uid);
                if ($target) {
                    $name = trim(($target->first_name ?? '') . ' ' . ($target->last_name ?? ''));
                    if ($name) {
                        return "{$name} (@{$target->username})";
                    }
                    return "@{$target->username}";
                }
                if (!empty($m[2])) {
                    return "@" . ltrim($m[2], '@');
                }
                return "Member (ID: {$uid})";
            }, $desc);

            $title = preg_replace_callback('/(?:user|member)\s*#(\d+)/i', function ($m) use ($resolvedUsers) {
                $uid = (int) $m[1];
                $target = $resolvedUsers->get($uid);
                if ($target) {
                    $name = trim(($target->first_name ?? '') . ' ' . ($target->last_name ?? ''));
                    return $name ?: "@{$target->username}";
                }
                return "Member";
            }, $title);

            // Clean up titles like "Updated Employee @employee1" -> if target user has a real name
            if ($targetName && preg_match('/^(Updated|Created|Deleted|Approved Membership for)\s+([A-Za-z]+)\s+@([a-zA-Z0-9_.\-]+)$/i', $title, $tm)) {
                $prefix = $tm[1];
                $roleWord = $tm[2];
                $handle = $tm[3];
                if ($targetName !== $handle) {
                    $title = "{$prefix} {$roleWord}: {$targetName}";
                }
            }

            $log->action_title = $title;
            $log->description = $desc;
            $log->action_description = $desc;
            $log->target_name = $targetName;
            $log->payload = $log->details;

            if (!$log->user && $log->username) {
                $log->user = [
                    'username'   => $log->username,
                    'first_name' => $log->full_name,
                    'last_name'  => '',
                    'role'       => $log->role,
                ];
            }
            if ($log->login_at && $log->logout_at) {
                try {
                    $loginAt = $log->login_at instanceof \Carbon\Carbon ? $log->login_at : \Carbon\Carbon::parse($log->login_at);
                    $logoutAt = $log->logout_at instanceof \Carbon\Carbon ? $log->logout_at : \Carbon\Carbon::parse($log->logout_at);
                    $log->session_duration_minutes = round($loginAt->diffInMinutes($logoutAt));
                } catch (\Throwable) {
                    $log->session_duration_minutes = null;
                }
            }
            return $log;
        });

        // Calculate summary metrics for today
        $todayStart = now()->startOfDay();
        $todayEnd = now()->endOfDay();

        $loginsToday = ActivityLog::where('action_type', 'login')
            ->whereBetween('created_at', [$todayStart, $todayEnd])
            ->count();

        $logoutsToday = ActivityLog::where('action_type', 'logout')
            ->whereBetween('created_at', [$todayStart, $todayEnd])
            ->count();

        $modificationsToday = ActivityLog::whereNotIn('action_type', ['login', 'logout'])
            ->whereBetween('created_at', [$todayStart, $todayEnd])
            ->count();

        // Staff & users list for filtering dropdown
        $staffUsers = User::whereIn('role', ['admin', 'super_admin', 'employee', 'coach'])
            ->orWhereIn('id', function($q) {
                $q->select('user_id')->from('activity_logs')->whereNotNull('user_id');
            })
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

        $totalToday = $loginsToday + $logoutsToday + $modificationsToday;

        $statsPayload = [
            'total_today'         => $totalToday,
            'logins_today'        => $loginsToday,
            'logouts_today'       => $logoutsToday,
            'modifications_today' => $modificationsToday,
            'active_sessions'     => $activeCount,
            'active_log_ids'      => $activeLogIds,
        ];

        return response()->json([
            'logs'       => $logs,
            'data'       => $logs,
            'stats'      => $statsPayload,
            'metrics'    => $statsPayload,
            'staff_list' => $staffUsers,
        ]);
    }
}
