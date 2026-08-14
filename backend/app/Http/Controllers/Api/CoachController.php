<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CoachProfile;
use App\Models\Conversation;
use App\Models\User;
use Illuminate\Http\Request;

class CoachController extends Controller
{
    /**
     * GET /api/coaches
     * List all coaches with their profile details, specialties, and rates.
     */
    public function index(Request $request)
    {
        $search = trim((string) $request->input('search', ''));
        $specialty = trim((string) $request->input('specialty', ''));

        // Query users who have a coachProfile or role='coach'/'employee'/'admin'
        $query = User::with('coachProfile')
            ->whereHas('coachProfile');

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
     * Get specific coach profile details.
     */
    public function show(int $id)
    {
        $user = User::with('coachProfile')->find($id);

        if (! $user) {
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
     * Get the authenticated user's own coach profile.
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
            'has_profile'   => (bool) $profile,
        ]);
    }

    /**
     * PUT /api/coaches/profile
     * Update or create the authenticated user's coach profile.
     */
    public function updateProfile(Request $request)
    {
        $request->validate([
            'bio'        => 'nullable|string|max:1000',
            'specialty'  => 'nullable|string|max:100',
            'photo_url'  => 'nullable|string',
            'rate'       => 'nullable|numeric|min:0',
        ]);

        $user = $request->user();

        $profile = CoachProfile::updateOrCreate(
            ['user_id' => $user->id],
            [
                'bio'       => $request->input('bio'),
                'specialty' => $request->input('specialty', 'Personal Training'),
                'photo_url' => $request->input('photo_url') ?: $user->profile_image,
                'rate'      => $request->input('rate', 0.00),
            ]
        );

        return response()->json([
            'message' => 'Coach profile updated successfully',
            'profile' => $profile,
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
