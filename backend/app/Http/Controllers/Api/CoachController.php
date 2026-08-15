<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CoachProfile;
use App\Models\Conversation;
use App\Models\User;
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
     * List all distinct clients who have a conversation with the authenticated coach.
     */
    public function clients(Request $request)
    {
        $coachId = $request->user()->id;

        $conversations = Conversation::with([
            'client:id,username,first_name,last_name,email,phone,profile_image',
            'latestMessage',
        ])
        ->where('coach_id', $coachId)
        ->get();

        $clients = $conversations->map(function ($convo) {
            return [
                'conversation_id' => $convo->id,
                'client'          => $convo->client,
                'latest_message'  => $convo->latestMessage,
                'updated_at'      => $convo->updated_at,
            ];
        });

        return response()->json($clients);
    }
}
