<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CoachProfile;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

/**
 * Admin/super_admin-only coach account management.
 *
 * All routes here are locked to role:admin,super_admin (see routes/api.php).
 * There is intentionally no self-service "become a coach" path anywhere
 * in the app — a coach profile can only ever be created from here.
 */
class AdminCoachController extends Controller
{
    private function normalizePhone(?string $value): string
    {
        return substr(preg_replace('/\D/', '', (string) $value), 0, 20);
    }

    private function isValidPhone(string $value): bool
    {
        return (bool) preg_match('/^\d{11}$/', $value);
    }

    /**
     * GET /api/admin/coaches
     * List every coach profile — active and inactive — with owning user info.
     */
    public function index()
    {
        $profiles = CoachProfile::with([
            'user:id,username,first_name,last_name,email,phone,profile_image',
            'creator:id,username,first_name,last_name',
        ])->orderByDesc('created_at')->get();

        $coaches = $profiles->map(function (CoachProfile $profile) {
            return [
                'user_id'       => $profile->user_id,
                'username'      => $profile->user?->username,
                'first_name'    => $profile->user?->first_name,
                'last_name'     => $profile->user?->last_name,
                'email'         => $profile->user?->email,
                'phone'         => $profile->user?->phone,
                'profile_image' => $profile->photo_url ?: $profile->user?->profile_image,
                'bio'           => $profile->bio,
                'specialty'     => $profile->specialty,
                'rate'          => (float) $profile->rate,
                'is_active'     => (bool) $profile->is_active,
                'created_by'    => $profile->creator?->username,
                'created_at'    => $profile->created_at,
            ];
        });

        return response()->json($coaches);
    }

    /**
     * POST /api/admin/coaches
     * Create a coach profile two ways:
     *   - promote an existing user:  { "user_id": 42, "bio": ..., ... }
     *   - create a brand-new account: { "username", "email", "password", ..., "bio": ..., ... }
     */
    public function store(Request $request)
    {
        $bio        = trim((string) $request->input('bio', ''));
        $specialty  = trim((string) $request->input('specialty', ''));
        $photoUrl   = trim((string) $request->input('photo_url', ''));
        $rateInput  = $request->input('rate', 0);

        if (! is_numeric($rateInput) || (float) $rateInput < 0) {
            return response()->json(['message' => 'Rate must be a non-negative number.'], 400);
        }
        $rate = round((float) $rateInput, 2);

        $userId = $request->input('user_id');

        try {
            $coachProfile = DB::transaction(function () use ($request, $userId, $bio, $specialty, $photoUrl, $rate) {
                if ($userId) {
                    // ── Promote an existing user ──────────────────────────
                    $user = User::find((int) $userId);
                    if (! $user) {
                        abort(404, 'User not found.');
                    }
                    if ($user->coachProfile()->exists()) {
                        abort(409, 'This user already has a coach profile.');
                    }
                } else {
                    // ── Create a brand-new account ────────────────────────
                    $username = trim((string) $request->input('username', ''));
                    $rawEmail = strtolower(trim((string) $request->input('email', '')));
                    $password = is_string($request->input('password')) ? $request->input('password') : '';
                    $firstName = trim((string) $request->input('first_name', ''));
                    $lastName  = trim((string) $request->input('last_name', ''));
                    $rawPhone  = trim((string) $request->input('phone', ''));
                    $phone     = $this->normalizePhone($rawPhone);
                    $gender    = strtolower(trim((string) $request->input('gender', ''))) ?: null;

                    if (! $username || ! $rawEmail || ! $password) {
                        abort(400, 'Username, email and password are required for a new coach account.');
                    }
                    if ($firstName === '' || $lastName === '') {
                        abort(400, 'First name and last name are required for a new coach account.');
                    }
                    if (! preg_match('/^[^@\s]+@[^@\s]+\.[^@\s]+$/', $rawEmail)) {
                        abort(400, 'Invalid email format.');
                    }
                    if (strlen($password) < 8 || strlen($password) > 128) {
                        abort(400, 'Password must be 8-128 characters.');
                    }
                    if ($rawPhone !== '' && ! $this->isValidPhone($phone)) {
                        abort(400, 'Phone number must be exactly 11 digits (e.g. 09171234567).');
                    }
                    if ($gender && ! in_array($gender, ['male', 'female', 'other'], true)) {
                        abort(400, 'Invalid gender.');
                    }
                    if (User::where('username', $username)->orWhere('email', $rawEmail)->exists()) {
                        abort(409, 'Username or email already exists.');
                    }

                    $user = User::create([
                        'username'          => $username,
                        'email'             => $rawEmail,
                        'password'          => Hash::make($password),
                        'role'              => 'user',
                        'phone'             => $phone !== '' ? $phone : null,
                        'gender'            => $gender,
                        'first_name'        => $firstName,
                        'last_name'         => $lastName,
                        'membership_status' => 'active',
                    ]);
                }

                return CoachProfile::create([
                    'user_id'    => $user->id,
                    'bio'        => $bio ?: null,
                    'specialty'  => $specialty ?: null,
                    'photo_url'  => $photoUrl ?: null,
                    'rate'       => $rate,
                    'is_active'  => true,
                    'created_by' => request()->user()->id,
                ]);
            });
        } catch (\Symfony\Component\HttpKernel\Exception\HttpException $e) {
            return response()->json(['message' => $e->getMessage()], $e->getStatusCode());
        }

        return response()->json([
            'message' => 'Coach profile created.',
            'user_id' => $coachProfile->user_id,
        ], 201);
    }

    /**
     * PUT /api/admin/coaches/{userId}
     * Edit an existing coach profile's details (and optionally is_active).
     */
    public function update(Request $request, int $userId)
    {
        $profile = CoachProfile::where('user_id', $userId)->first();
        if (! $profile) {
            return response()->json(['message' => 'Coach profile not found.'], 404);
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
            $profile->photo_url = trim((string) $request->input('photo_url')) ?: null;
        }
        if ($request->has('rate')) {
            $profile->rate = round((float) $request->input('rate'), 2);
        }
        if ($request->has('is_active')) {
            $profile->is_active = $request->boolean('is_active');
        }

        $profile->save();

        return response()->json(['message' => 'Coach profile updated.']);
    }

    /**
     * DELETE /api/admin/coaches/{userId}
     * Deactivate a coach (soft — sets is_active=false). We intentionally do
     * NOT hard-delete the coach_profiles row: that would sever the audit
     * trail (created_by) and any historical conversations/proposals still
     * reference the user_id directly, so deactivating is the safe default.
     */
    public function destroy(int $userId)
    {
        $profile = CoachProfile::where('user_id', $userId)->first();
        if (! $profile) {
            return response()->json(['message' => 'Coach profile not found.'], 404);
        }

        $profile->update(['is_active' => false]);

        return response()->json(['message' => 'Coach deactivated.']);
    }
}
