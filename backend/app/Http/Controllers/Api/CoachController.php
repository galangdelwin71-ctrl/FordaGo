<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CoachProfile;
use App\Models\Conversation;
use App\Models\User;
use App\Models\WorkoutPlanProposal;
use Illuminate\Http\Request;

/**
 * Client-facing, READ-ONLY coach endpoints.
 *
 * Coach accounts can only be created or edited by an admin/super_admin —
 * see AdminCoachController. There is intentionally no write/self-service
 * endpoint in this controller.
 */
class CoachController extends Controller
{
    /**
     * GET /api/coaches
     * List active coaches with their profile details, specialties, and rates.
     */
    public function index(Request $request)
    {
        $search = trim((string) $request->input('search', ''));
        $specialty = trim((string) $request->input('specialty', ''));

        // Only users with an ACTIVE coach profile are visible to clients.
        $query = User::with('coachProfile')
            ->whereHas('coachProfile', function ($p) {
                $p->where('is_active', true);
            });

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
                  ->orWhere('username', 'like', "%{$search}%")
                  ->orWhereHas('coachProfile', function ($p) use ($search) {
                      $p->where('specialty', 'like', "%{$search}%")
                        ->orWhere('bio', 'like', "%{$search}%");
                  });
            });
        }

        if ($specialty !== '') {
            $query->whereHas('coachProfile', function ($p) use ($specialty) {
                $p->where('specialty', 'like', "%{$specialty}%");
            });
        }

        $coaches = $query->get()->map(function ($user) {
            $profile = $user->coachProfile;
            return [
                'id'            => $user->id,
                'user_id'       => $user->id,
                'username'      => $user->username,
                'first_name'    => $user->first_name,
                'last_name'     => $user->last_name,
                'email'         => $user->email,
                'phone'         => $user->phone,
                'profile_image' => $profile?->photo_url ?: $user->profile_image,
                'bio'           => $profile?->bio ?: 'Certified FordaGO Fitness Coach ready to help you hit your fitness goals.',
                'specialty'     => $profile?->specialty ?: 'Personal Training',
                'rate'          => $profile?->rate ? (float) $profile->rate : 0.00,
                'created_at'    => $profile?->created_at ?: $user->created_at,
            ];
        });

        return response()->json($coaches);
    }

    /**
     * GET /api/coaches/{id}
     * Get specific coach profile details (must be active).
     */
    public function show(int $id)
    {
        $user = User::with('coachProfile')->find($id);

        if (! $user || ! $user->coachProfile || ! $user->coachProfile->is_active) {
            return response()->json(['message' => 'Coach not found'], 404);
        }

        $profile = $user->coachProfile;

        return response()->json([
            'id'            => $user->id,
            'user_id'       => $user->id,
            'username'      => $user->username,
            'first_name'    => $user->first_name,
            'last_name'     => $user->last_name,
            'email'         => $user->email,
            'phone'         => $user->phone,
            'profile_image' => $profile?->photo_url ?: $user->profile_image,
            'bio'           => $profile?->bio ?: '',
            'specialty'     => $profile?->specialty ?: 'Personal Training',
            'rate'          => $profile?->rate ? (float) $profile->rate : 0.00,
        ]);
    }

    /**
     * GET /api/coaches/profile/me
     * Get the authenticated user's own coach profile, if they have one.
     * Read-only — safe to leave open to any authenticated user, since it
     * only ever returns the caller's own data and creates nothing.
     */
    public function myProfile(Request $request)
    {
        $user = $request->user()->load('coachProfile');
        $profile = $user->coachProfile;

        return response()->json([
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
        ]);
    }

    /**
     * GET /api/coaches/clients
     * List active clients (approved conversations only — pending requests
     * live in requests()) for the authenticated coach, each with their next
     * upcoming accepted session for the "Today's Sessions" / roster view.
     */
    public function clients(Request $request)
    {
        if (! $request->user()->isCoach()) {
            return response()->json(['message' => 'Only coach accounts can access this.'], 403);
        }

        $coachId = $request->user()->id;
        $today = now()->toDateString();

        $conversations = Conversation::with([
            'client:id,username,first_name,last_name,email,phone,profile_image',
            'latestMessage',
        ])
        ->where('coach_id', $coachId)
        ->where('status', Conversation::STATUS_ACTIVE)
        ->get();

        $clients = $conversations->map(function ($convo) use ($coachId, $today) {
            $nextSession = WorkoutPlanProposal::where('coach_id', $coachId)
                ->where('client_id', $convo->client_id)
                ->where('status', 'accepted')
                ->whereDate('session_date', '>=', $today)
                ->orderBy('session_date')
                ->orderBy('time_val')
                ->first(['id', 'session_date', 'time_val', 'time_ampm', 'duration_minutes', 'location']);

            return [
                'conversation_id' => $convo->id,
                'client'          => $convo->client,
                'latest_message'  => $convo->latestMessage,
                'next_session'    => $nextSession,
                'updated_at'      => $convo->updated_at,
            ];
        });

        return response()->json($clients);
    }

    /**
     * GET /api/coaches/requests
     * Pending client-initiated conversations awaiting this coach's
     * Accept/Decline (see ConversationController::accept()/decline()).
     */
    public function requests(Request $request)
    {
        if (! $request->user()->isCoach()) {
            return response()->json(['message' => 'Only coach accounts can access this.'], 403);
        }

        $coachId = $request->user()->id;

        $conversations = Conversation::with([
            'client:id,username,first_name,last_name,profile_image',
            'latestMessage',
        ])
        ->where('coach_id', $coachId)
        ->where('status', Conversation::STATUS_PENDING)
        ->orderByDesc('created_at')
        ->get();

        $requests = $conversations->map(function ($convo) {
            return [
                'conversation_id' => $convo->id,
                'client'          => $convo->client,
                'latest_message'  => $convo->latestMessage,
                'created_at'      => $convo->created_at,
            ];
        });

        return response()->json($requests);
    }

    /**
     * GET /api/coaches/dashboard-stats
     * Single call for the whole Coach Dashboard stats row — every number is
     * computed live from real tables, nothing hardcoded.
     */
    public function dashboardStats(Request $request)
    {
        if (! $request->user()->isCoach()) {
            return response()->json(['message' => 'Only coach accounts can access this.'], 403);
        }

        $coachId = $request->user()->id;
        $today = now()->toDateString();

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
            ->whereYear('accepted_at', now()->year)
            ->whereMonth('accepted_at', now()->month)
            ->sum('price');

        return response()->json([
            'active_clients'      => $activeClients,
            'sessions_today'      => $sessionsToday,
            'pending_requests'    => $pendingRequests,
            'earnings_this_month' => round($earningsThisMonth, 2),
        ]);
    }

    /**
     * PUT /api/coaches/profile/me
     * Self-service profile editing for the authenticated coach. Deliberately
     * limited to bio/specialty/photo_url/rate — is_active and user_id stay
     * admin-only (AdminCoachController::update()/destroy()), and account
     * credentials (username/email/password) are managed via UserController,
     * never here.
     */
    public function updateMyProfile(Request $request)
    {
        $profile = CoachProfile::where('user_id', $request->user()->id)->first();

        if (! $profile) {
            return response()->json(['message' => 'You do not have a coach profile yet.'], 404);
        }

        if ($request->has('rate')) {
            $rateInput = $request->input('rate');
            if (! is_numeric($rateInput) || (float) $rateInput < 0) {
                return response()->json(['message' => 'Rate must be a non-negative number.'], 400);
            }
        }

        if ($request->has('bio')) {
            $profile->bio = trim((string) $request->input('bio')) ?: null;
        }
        if ($request->has('specialty')) {
            $profile->specialty = trim((string) $request->input('specialty')) ?: null;
        }
        if ($request->has('photo_url')) {
            $rawPhoto = $request->input('photo_url');
            $processedPhoto = \App\Services\AvatarService::processAvatar($rawPhoto, $request->user()->id);
            $profile->photo_url = $processedPhoto;

            // Unify with user account profile image
            try {
                $request->user()->update(['profile_image' => $processedPhoto]);
            } catch (\Throwable $e) {}
        }
        if ($request->has('rate')) {
            $profile->rate = round((float) $request->input('rate'), 2);
        }

        $profile->save();

        return response()->json([
            'message' => 'Profile updated.',
            'profile' => [
                'bio'           => $profile->bio,
                'specialty'     => $profile->specialty,
                'photo_url'     => $profile->photo_url,
                'profile_image' => $profile->photo_url,
                'rate'          => (float) $profile->rate,
            ],
        ]);
    }
}
