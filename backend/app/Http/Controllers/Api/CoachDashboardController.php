<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\WorkoutPlanProposal;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * GET /api/coaches/dashboard-full
 *
 * Single-call replacement for the 6 separate requests the coach
 * dashboard panel used to fire on open:
 *   1. GET /coaches/profile/me
 *   2. GET /coaches/dashboard-stats
 *   3. GET /proposals?status=accepted   (today's sessions)
 *   4. GET /conversations               (messages + unread counts)
 *   5. GET /coaches/clients
 *   6. GET /coaches/requests
 *
 * Returning all of this as one JSON payload cuts round-trips from 6 to 1
 * — particularly impactful over a Cloudflare quick-tunnel where each
 * request adds ~200-400 ms of tunnel overhead.
 *
 * The client still falls back to the individual endpoints when this one
 * is unavailable (e.g. older backend), so this is purely additive.
 */
class CoachDashboardController extends Controller
{
    public function full(Request $request)
    {
        $user = $request->user()->load('coachProfile');
        $profile = $user->coachProfile;
        $coachId = $user->id;
        $today = now()->toDateString();
        $thisYear  = now()->year;
        $thisMonth = now()->month;

        // ── 1. My Profile ──────────────────────────────────────────────────
        $myProfile = [
            'id'            => $user->id,
            'user_id'       => $user->id,
            'username'      => $user->username,
            'first_name'    => $user->first_name,
            'last_name'     => $user->last_name,
            'profile_image' => $profile?->photo_url ?: $user->profile_image,
            'bio'           => $profile?->bio ?: '',
            'specialty'     => $profile?->specialty ?: 'Personal Training',
            'rate'          => $profile?->rate ? (float) $profile->rate : 0.00,
            'is_active'     => (bool) ($profile?->is_active ?? false),
            'has_profile'   => (bool) $profile,
        ];

        // If this user has no coach profile, return early with just their info
        // so the panel still renders correctly as a member (isCoach = false).
        if (! $profile) {
            return response()->json([
                'profile'      => $myProfile,
                'stats'        => null,
                'today_sessions' => [],
                'conversations'  => [],
                'clients'        => [],
                'requests'       => [],
            ]);
        }

        // ── 2. Dashboard Stats ─────────────────────────────────────────────
        $activeClients = Conversation::where('coach_id', $coachId)
            ->where('status', Conversation::STATUS_ACTIVE)
            ->distinct()
            ->count('client_id');

        $sessionsToday = WorkoutPlanProposal::where('coach_id', $coachId)
            ->where('status', 'accepted')
            ->whereDate('session_date', $today)
            ->count();

        $pendingRequests = Conversation::where('coach_id', $coachId)
            ->where('status', Conversation::STATUS_PENDING)
            ->count();

        $earningsThisMonth = (float) WorkoutPlanProposal::where('coach_id', $coachId)
            ->where('status', 'accepted')
            ->whereYear('accepted_at', $thisYear)
            ->whereMonth('accepted_at', $thisMonth)
            ->sum('price');

        $stats = [
            'active_clients'      => $activeClients,
            'sessions_today'      => $sessionsToday,
            'pending_requests'    => $pendingRequests,
            'earnings_this_month' => round($earningsThisMonth, 2),
        ];

        // ── 3. Today's Sessions (accepted proposals for today) ─────────────
        $todayProposals = WorkoutPlanProposal::with([
            'client:id,username,first_name,last_name,profile_image',
            'items:id,proposal_id,name',
        ])
        ->where('coach_id', $coachId)
        ->where('status', 'accepted')
        ->whereDate('session_date', $today)
        ->orderBy('time_val')
        ->get();

        // ── 4. Conversations (messages + unread counts) ────────────────────
        $rawConvos = Conversation::with([
            'coach:id,username,first_name,last_name,profile_image',
            'client:id,username,first_name,last_name,profile_image',
            'latestMessage',
        ])
        ->where(function ($q) use ($coachId) {
            $q->where('coach_id', $coachId)
              ->orWhere('client_id', $coachId);
        })
        ->orderByDesc('updated_at')
        ->get();

        // Single aggregated query — replaces the old N+1 DB::table('messages')->count()
        // inside a ->map() loop that ran one SQL query per conversation row.
        $convoIds = $rawConvos->pluck('id');
        $unreadMap = DB::table('messages')
            ->select('conversation_id', DB::raw('COUNT(*) as cnt'))
            ->whereIn('conversation_id', $convoIds)
            ->where('sender_id', '!=', $coachId)
            ->whereNull('read_at')
            ->groupBy('conversation_id')
            ->pluck('cnt', 'conversation_id');

        $conversations = $rawConvos->map(function ($convo) use ($coachId, $unreadMap) {
            $isCoach = ((int) $convo->coach_id === (int) $coachId);
            $partner = $isCoach ? $convo->client : $convo->coach;

            return [
                'id'              => $convo->id,
                'coach_id'        => $convo->coach_id,
                'client_id'       => $convo->client_id,
                'is_coach'        => $isCoach,
                'status'          => $convo->status,
                'partner'         => $partner,
                'partner_role'    => $isCoach ? 'client' : 'coach',
                'latest_message'  => $convo->latestMessage,
                'unread_count'    => (int) ($unreadMap[$convo->id] ?? 0),
                'updated_at'      => $convo->latestMessage?->created_at ?: $convo->updated_at,
            ];
        });

        // ── 5. Clients (active conversations + next session) ───────────────
        // Fix N+1: load all upcoming sessions in a single query, then group
        // by client_id, instead of one query per client row.
        $activeConvos = Conversation::with([
            'client:id,username,first_name,last_name,email,phone,profile_image',
            'latestMessage',
        ])
        ->where('coach_id', $coachId)
        ->where('status', Conversation::STATUS_ACTIVE)
        ->get();

        $clientIds = $activeConvos->pluck('client_id')->unique()->values();

        // Single query for all next sessions across all clients
        $nextSessions = WorkoutPlanProposal::where('coach_id', $coachId)
            ->where('status', 'accepted')
            ->whereIn('client_id', $clientIds)
            ->whereDate('session_date', '>=', $today)
            ->orderBy('client_id')
            ->orderBy('session_date')
            ->orderBy('time_val')
            ->get(['id', 'client_id', 'session_date', 'time_val', 'time_ampm', 'duration_minutes', 'location'])
            ->keyBy('client_id'); // keep only first (earliest) per client

        $clients = $activeConvos->map(function ($convo) use ($nextSessions) {
            return [
                'conversation_id' => $convo->id,
                'client'          => $convo->client,
                'latest_message'  => $convo->latestMessage,
                'next_session'    => $nextSessions->get($convo->client_id),
                'updated_at'      => $convo->updated_at,
            ];
        });

        // ── 6. Pending Requests ────────────────────────────────────────────
        $requests = Conversation::with([
            'client:id,username,first_name,last_name,profile_image',
            'latestMessage',
        ])
        ->where('coach_id', $coachId)
        ->where('status', Conversation::STATUS_PENDING)
        ->orderByDesc('created_at')
        ->get()
        ->map(function ($convo) {
            return [
                'conversation_id' => $convo->id,
                'client'          => $convo->client,
                'latest_message'  => $convo->latestMessage,
                'created_at'      => $convo->created_at,
            ];
        });

        return response()->json([
            'profile'        => $myProfile,
            'stats'          => $stats,
            'today_proposals' => $todayProposals,
            'conversations'  => $conversations,
            'clients'        => $clients,
            'requests'       => $requests,
        ]);
    }
}
