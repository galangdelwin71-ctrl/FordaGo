<?php

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ActivityLogger
{
    /**
     * Log a general administrative or staff action.
     */
    public static function log(
        $actorOrRequest,
        string $actionType,
        string $actionTitle,
        ?string $description = null,
        ?string $entityType = null,
        $entityId = null,
        ?array $details = null,
        $extraActorOrRequest = null
    ): ?ActivityLog {
        try {
            $actor = null;
            $request = null;

            if ($actorOrRequest instanceof User) {
                $actor = $actorOrRequest;
            } elseif ($actorOrRequest instanceof Request) {
                $request = $actorOrRequest;
                $actor = $request->user();
            }

            if ($extraActorOrRequest instanceof User) {
                $actor = $extraActorOrRequest;
            } elseif ($extraActorOrRequest instanceof Request) {
                $request = $extraActorOrRequest;
                if (!$actor) {
                    $actor = $request->user();
                }
            }

            if (!$request) {
                try {
                    $request = request();
                } catch (\Throwable) {}
            }
            if (!$actor && $request) {
                $actor = $request->user();
            }

            if (!$actor) {
                return null;
            }

            // Only log staff or administrator actions
            $role = $actor->role ?? 'member';
            if (!in_array($role, ['admin', 'super_admin', 'employee'])) {
                return null;
            }

            $fullName = trim(($actor->first_name ?? '') . ' ' . ($actor->last_name ?? ''));
            if (!$fullName) {
                $fullName = $actor->username ?? 'Administrator';
            }

            $ipAddress = ($request && method_exists($request, 'ip')) ? $request->ip() : null;
            $userAgent = ($request && method_exists($request, 'header')) ? substr($request->header('User-Agent', ''), 0, 500) : null;

            return ActivityLog::create([
                'user_id'      => $actor->id,
                'username'     => $actor->username ?? 'admin',
                'full_name'    => $fullName,
                'role'         => $role,
                'action_type'  => $actionType,
                'action_title' => $actionTitle,
                'description'  => $description,
                'entity_type'  => $entityType,
                'entity_id'    => $entityId ? (string) $entityId : null,
                'details'      => $details,
                'ip_address'   => $ipAddress,
                'user_agent'   => $userAgent,
            ]);
        } catch (\Throwable $e) {
            Log::warning('ActivityLogger failed: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Log staff login with timestamp and device details.
     */
    public static function logLogin(User $user, Request $request): ?ActivityLog
    {
        try {
            if (!in_array($user->role, ['admin', 'super_admin', 'employee'])) {
                return null;
            }

            $fullName = trim(($user->first_name ?? '') . ' ' . ($user->last_name ?? ''));
            if (!$fullName) {
                $fullName = $user->username ?? 'Administrator';
            }

            $roleLabel = match($user->role) {
                'super_admin' => 'Super Admin',
                'admin'       => 'Admin',
                'employee'    => 'Employee',
                default       => ucfirst($user->role ?? 'Staff'),
            };

            $ipAddress = $request->ip();
            $userAgent = substr($request->header('User-Agent', ''), 0, 500);

            return ActivityLog::create([
                'user_id'      => $user->id,
                'username'     => $user->username,
                'full_name'    => $fullName,
                'role'         => $user->role,
                'action_type'  => 'login',
                'action_title' => "{$roleLabel} Logged In",
                'description'  => "{$fullName} ({$roleLabel}) logged into the management control center at " . now()->format('h:i A') . ".",
                'entity_type'  => 'auth',
                'entity_id'    => (string) $user->id,
                'ip_address'   => $ipAddress,
                'user_agent'   => $userAgent,
                'login_at'     => now(),
            ]);
        } catch (\Throwable $e) {
            Log::warning('ActivityLogger::logLogin failed: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Log staff logout.
     */
    public static function logLogout(User $user, ?Request $request = null): ?ActivityLog
    {
        try {
            if (!in_array($user->role, ['admin', 'super_admin', 'employee'])) {
                return null;
            }

            $fullName = trim(($user->first_name ?? '') . ' ' . ($user->last_name ?? ''));
            if (!$fullName) {
                $fullName = $user->username ?? 'Administrator';
            }

            $roleLabel = match($user->role) {
                'super_admin' => 'Super Admin',
                'admin'       => 'Admin',
                'employee'    => 'Employee',
                default       => ucfirst($user->role ?? 'Staff'),
            };

            // Find recent login log within last 24 hours that does not have logout_at set
            $recentLogin = ActivityLog::where('user_id', $user->id)
                ->where('action_type', 'login')
                ->whereNull('logout_at')
                ->latest()
                ->first();

            $durationStr = '';
            if ($recentLogin && $recentLogin->login_at) {
                $recentLogin->update(['logout_at' => now()]);
                $mins = $recentLogin->login_at->diffInMinutes(now());
                $durationStr = $mins >= 60
                    ? sprintf('%d hr %d min', intdiv($mins, 60), $mins % 60)
                    : sprintf('%d min', max(1, $mins));
            }

            $ipAddress = $request ? $request->ip() : null;
            $userAgent = $request ? substr($request->header('User-Agent', ''), 0, 500) : null;

            $desc = "{$fullName} ({$roleLabel}) logged out of the management system.";
            if ($durationStr) {
                $desc .= " (Session duration: {$durationStr})";
            }

            return ActivityLog::create([
                'user_id'      => $user->id,
                'username'     => $user->username,
                'full_name'    => $fullName,
                'role'         => $user->role,
                'action_type'  => 'logout',
                'action_title' => "{$roleLabel} Logged Out",
                'description'  => $desc,
                'entity_type'  => 'auth',
                'entity_id'    => (string) $user->id,
                'ip_address'   => $ipAddress,
                'user_agent'   => $userAgent,
                'logout_at'    => now(),
            ]);
        } catch (\Throwable $e) {
            Log::warning('ActivityLogger::logLogout failed: ' . $e->getMessage());
            return null;
        }
    }
}
