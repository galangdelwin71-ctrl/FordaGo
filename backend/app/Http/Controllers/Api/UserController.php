<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Models\User;
use App\Services\SmsService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

/**
 * Ported from server/routes/user.js.
 */
class UserController extends Controller
{
    // ── Helpers ──────────────────────────────────────────────────────────

    private function normalizePhone(?string $value): string
    {
        return substr(preg_replace('/\D/', '', (string) $value), 0, 20);
    }

    private function isValidPhone(string $value): bool
    {
        return (bool) preg_match('/^\d{11}$/', $value);
    }

    // ── Endpoints ────────────────────────────────────────────────────────

    /**
     * GET /api/users
     * Return all users (staff only).
     */
    public function index()
    {
        $users = User::select([
            'id', 'username', 'first_name', 'last_name', 'email', 'role',
            'phone', 'gender', 'profile_image', 'membership_type',
            'membership_status', 'payment_method', 'membership_expiry',
        ])->get();

        return response()->json($users);
    }

    /**
     * GET /api/users/count
     * Total user count (staff only).
     */
    public function count()
    {
        return response()->json(['total' => User::count()]);
    }

    /**
     * GET /api/users/me
     * Return the authenticated user's own profile.
     */
    public function me(Request $request)
    {
        $user = User::select([
            'id', 'username', 'first_name', 'last_name', 'email', 'role',
            'phone', 'gender', 'profile_image', 'membership_type',
            'membership_status', 'payment_method', 'membership_expiry',
        ])->find($request->user()->id);

        if (! $user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        // Check if premium membership has expired and revert to daily if needed
        $user->checkAndExpireMembership();

        // Reload fresh user state
        $user = User::select([
            'id', 'username', 'first_name', 'last_name', 'email', 'role',
            'phone', 'gender', 'profile_image', 'membership_type',
            'membership_status', 'payment_method', 'membership_expiry',
        ])->find($request->user()->id);

        $payload = $user->toArray();
        $payload['has_coach_profile'] = $user->isCoach();

        return response()->json($payload);
    }

    /**
     * POST /api/users/membership/renew
     * Submit renewal or upgrade request for Premium Pass (₱500) requiring admin/employee verification.
     */
    public function renewOrUpgradeMembership(Request $request)
    {
        $user = User::find($request->user()->id);
        if (! $user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        $paymentMethod = $request->input('payment_method') === 'cash' ? 'cash' : 'gcash';

        // Set request to pending verification for admin/employee to confirm at counter
        $user->membership_type   = 'premium';
        $user->membership_status = 'pending';
        $user->payment_method    = $paymentMethod;
        $user->save();

        // 1. Notify all staff/admin members
        try {
            $staffList = User::whereIn('role', ['admin', 'super_admin', 'employee'])->get();
            foreach ($staffList as $staff) {
                Notification::create([
                    'user_id' => $staff->id,
                    'title'   => 'Membership Payment Verification Needed',
                    'message' => "{$user->first_name} {$user->last_name} (@{$user->username}) submitted a Premium Pass renewal request (₱500). Please verify payment at the counter.",
                    'is_read' => false,
                ]);
            }
        } catch (\Throwable $e) {
            \Log::warning('Failed to notify staff: ' . $e->getMessage());
        }

        // 2. Notify the requesting user
        try {
            Notification::create([
                'user_id' => $user->id,
                'title'   => 'Renewal Request Pending',
                'message' => "Your Premium Pass request (₱500) has been submitted. Please proceed to the gym counter to pay (Cash or Online Payment at desk) and activate your membership.",
                'is_read' => false,
            ]);
        } catch (\Throwable $e) {
            \Log::warning('Failed to notify user: ' . $e->getMessage());
        }

        return response()->json([
            'message' => 'Renewal request submitted! Please proceed to the gym counter for staff payment verification.',
            'user'    => $user,
        ]);
    }

    /**
     * POST /api/users/create
     * Admin-created accounts — immediately active, full details.
     */
    public function store(Request $request)
    {
        $creatorRole  = $request->user()->role;
        $username     = trim((string) $request->input('username', ''));
        $rawEmail     = strtolower(trim((string) $request->input('email', '')));
        $password     = is_string($request->input('password')) ? $request->input('password') : '';
        $rawPhone     = trim((string) $request->input('phone', ''));
        $phone        = $this->normalizePhone($rawPhone);
        $gender       = strtolower(trim((string) $request->input('gender', ''))) ?: null;
        $requestedRole      = strtolower(trim((string) $request->input('role', 'user')));
        $membershipType     = $request->input('membership_type') === 'daily' ? 'daily' : 'premium';
        $paymentMethod      = $request->input('payment_method') === 'gcash' ? 'gcash' : 'cash';

        if (! $username || ! $rawEmail || ! $password) {
            return response()->json(['message' => 'Username, email and password are required.'], 400);
        }
        if (! preg_match('/^[^@\s]+@[^@\s]+\.[^@\s]+$/', $rawEmail)) {
            return response()->json(['message' => 'Invalid email format.'], 400);
        }
        if (strlen($password) < 8 || strlen($password) > 128) {
            return response()->json(['message' => 'Password must be 8-128 characters.'], 400);
        }
        if ($rawPhone !== '' && ! $this->isValidPhone($phone)) {
            return response()->json(['message' => 'Phone number must be exactly 11 digits (e.g. 09171234567).'], 400);
        }
        if ($gender && ! in_array($gender, ['male', 'female', 'other'], true)) {
            return response()->json(['message' => 'Invalid gender.'], 400);
        }

        // Role permission: mirrors the Node version's allowedRoles logic
        $allowedRoles = match ($creatorRole) {
            'super_admin' => ['super_admin', 'admin', 'employee', 'user'],
            'admin'       => ['employee', 'user'],
            default       => ['user'],
        };
        $assignedRole = in_array($requestedRole, $allowedRoles, true) ? $requestedRole : 'user';

        if (User::where('username', $username)->orWhere('email', $rawEmail)->exists()) {
            return response()->json(['message' => 'Username or email already exists.'], 409);
        }

        $membershipExpiry = $membershipType === 'premium'
            ? now()->addDays(30)->toDateString()
            : null;

        $user = User::create([
            'username'          => $username,
            'email'             => $rawEmail,
            'password'          => Hash::make($password),
            'role'              => $assignedRole,
            'phone'             => $phone !== '' ? $phone : null,
            'gender'            => $gender,
            'membership_type'   => $membershipType,
            'membership_status' => 'active',
            'payment_method'    => $paymentMethod,
            'membership_expiry' => $membershipExpiry,
        ]);

        // Notify super_admin of new account creation
        try {
            $roleLabel = match ($assignedRole) {
                'super_admin' => 'Super Admin',
                'admin'       => 'Admin',
                'employee'    => 'Employee',
                default       => 'Member',
            };
            $creator = $request->user();
            $creatorLabel = trim(($creator->first_name ?? '') . ' ' . ($creator->last_name ?? '')) ?: $creator->username;
            $superAdmins = User::where('role', 'super_admin')->get();
            foreach ($superAdmins as $sa) {
                if ($sa->id === $creator->id) continue; // Don't notify yourself
                Notification::create([
                    'user_id' => $sa->id,
                    'title'   => "🆕 New {$roleLabel} Account Created",
                    'message' => "{$creatorLabel} created a new {$roleLabel} account for @{$username} ({$rawEmail}) via {$paymentMethod}.",
                    'is_read' => false,
                ]);
            }
        } catch (\Throwable $e) {
            \Log::warning('Failed to notify super_admin of new account: ' . $e->getMessage());
        }

        return response()->json(['message' => 'Account created.', 'id' => $user->id], 201);
    }

    /**
     * PUT /api/users/{id}
     * Update user profile — self or admin.
     */
    public function update(Request $request, int $id)
    {
        $isAdmin = in_array($request->user()->role, ['admin', 'super_admin'], true);
        $isSelf  = $request->user()->id === $id;

        if (! $isAdmin && ! $isSelf) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $firstName = trim((string) ($request->input('first_name') ?? $request->input('firstName') ?? ''));
        $lastName  = trim((string) ($request->input('last_name')  ?? $request->input('lastName')  ?? ''));
        $rawEmail  = $request->input('email');
        $email     = $rawEmail ? strtolower(trim((string) $rawEmail)) : null;

        $user = User::find($id);
        if (! $user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        $username = trim((string) $request->input('username', ''));
        if ($username === '') {
            $username = trim("{$firstName} {$lastName}") ?: $user->username;
        }

        // Check if username is already taken by another user
        if ($username && $username !== $user->username) {
            $taken = User::where('username', $username)->where('id', '!=', $user->id)->exists();
            if ($taken) {
                // If username derived from name collides, fallback to keeping original username
                $username = $user->username;
            }
        }

        // Check if email is already in use by another user
        if ($email && $email !== $user->email) {
            $emailTaken = User::where('email', $email)->where('id', '!=', $user->id)->exists();
            if ($emailTaken) {
                return response()->json(['message' => 'That email address is already in use by another account.'], 400);
            }
        }

        $rawPhone        = $request->input('phone');
        $phoneProvided   = ! is_null($rawPhone) && trim((string) $rawPhone) !== '';
        $normalizedPhone = $phoneProvided ? $this->normalizePhone($rawPhone) : ($rawPhone === '' ? null : $user->phone);

        if ($phoneProvided && ! $this->isValidPhone($normalizedPhone)) {
            return response()->json(['message' => 'Phone number must be exactly 11 digits (e.g. 09171234567).'], 400);
        }

        // Normalize gender to valid lowercase enum ('male', 'female', 'other')
        $rawGender = strtolower(trim((string) ($request->input('gender') ?? '')));
        $gender = in_array($rawGender, ['male', 'female', 'other'], true)
            ? $rawGender
            : ($user->gender ?: null);

        $rawProfileImage = $request->input('profile_image');
        $processedAvatar = $request->has('profile_image')
            ? \App\Services\AvatarService::processAvatar($rawProfileImage, $user->id)
            : $user->profile_image;

        // Clean full URL prefixes to keep clean relative storage paths in DB
        if ($processedAvatar && preg_match('#/storage/avatars/[^\s"\']+#', $processedAvatar, $m)) {
            $processedAvatar = $m[0];
        }

        try {
            if ($isAdmin) {
                $dataToUpdate = [
                    'username'          => $username ?: $user->username,
                    'first_name'        => $firstName ?: $user->first_name,
                    'last_name'         => $lastName  ?: $user->last_name,
                    'email'             => $email     ?? $user->email,
                    'role'              => $request->input('role', $user->role),
                    'phone'             => $normalizedPhone,
                    'gender'            => $gender,
                    'profile_image'     => $processedAvatar,
                    'membership_type'   => $request->input('membership_type', $user->membership_type),
                    'payment_method'    => $request->input('payment_method', $user->payment_method),
                    'membership_expiry' => $request->input('membership_expiry') ?: null,
                ];

                $password = $request->input('password');
                if (is_string($password) && trim($password) !== '') {
                    $password = trim($password);
                    if (strlen($password) < 8 || strlen($password) > 128) {
                        return response()->json(['message' => 'Password must be 8-128 characters.'], 400);
                    }
                    $dataToUpdate['password'] = Hash::make($password);
                }

                $user->fill($dataToUpdate)->save();
            } else {
                $user->fill([
                    'username'      => $username ?: $user->username,
                    'first_name'    => $firstName ?: $user->first_name,
                    'last_name'     => $lastName  ?: $user->last_name,
                    'email'         => $email     ?? $user->email,
                    'phone'         => $normalizedPhone,
                    'gender'        => $gender,
                    'profile_image' => $processedAvatar,
                ])->save();
            }

            // Keep Coach Profile photo in sync if user is a coach
            if ($request->has('profile_image')) {
                try {
                    \App\Models\CoachProfile::where('user_id', $user->id)->update(['photo_url' => $processedAvatar]);
                } catch (\Throwable) {}
            }

            return response()->json(['message' => 'User updated', 'profile_image' => $processedAvatar]);
        } catch (\Throwable $e) {
            \Log::error('User update failed: ' . $e->getMessage(), ['user_id' => $id]);
            return response()->json(['message' => 'Failed to update profile: ' . $e->getMessage()], 500);
        }
    }

    /**
     * PUT /api/users/{id}/membership
     * Activate membership and notify the user (staff only).
     */
    public function updateMembership(Request $request, int $id)
    {
        $membershipType = $request->input('membership_type') === 'daily' ? 'daily' : 'premium';
        $providedExpiry = $request->input('membership_expiry')
            ? trim((string) $request->input('membership_expiry'))
            : '';

        $membershipExpiry = $membershipType === 'premium'
            ? ($providedExpiry ?: now()->addDays(30)->toDateString())
            : null;

        $user = User::find($id);
        if (! $user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        $user->update([
            'membership_type'   => $membershipType,
            'membership_status' => 'active',
            'membership_expiry' => $membershipExpiry,
        ]);

        // In-app notification
        $inAppMessage = $membershipType === 'premium'
            ? "Your Premium payment has been verified by admin. You can now log in. Membership valid until {$membershipExpiry}."
            : 'Your Daily Pass account has been verified by admin. You can now log in. Payment is required each time you scan for attendance.';

        $notifTitle = $membershipType === 'premium' ? 'Premium Payment Verified ✅' : 'Account Verified ✅';
        Notification::create([
            'user_id' => $user->id,
            'title'   => $notifTitle,
            'message' => $inAppMessage,
        ]);

        // Push directly to user's device
        try {
            app(\App\Services\FcmService::class)->sendToUser($user->id, $notifTitle, $inAppMessage, [
                'type'        => 'membership_approved',
                'targetRoute' => '/dashboard',
            ]);
        } catch (\Throwable $e) {
            \Log::warning('Failed to send FCM push on membership update: ' . $e->getMessage());
        }

        return response()->json(['message' => 'Membership updated and user notified.']);
    }

    /**
     * DELETE /api/users/{id}
     * Delete a user (staff only).
     */
    public function destroy(Request $request, int $id)
    {
        $user = User::find($id);
        if (! $user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        // Employees cannot delete admin/super_admin accounts
        if ($request->user()->role === 'employee'
            && in_array($user->role, ['admin', 'super_admin'], true)) {
            return response()->json(['message' => 'Employees cannot delete admin accounts.'], 403);
        }

        $user->delete();

        return response()->json(['message' => 'User deleted']);
    }

    /**
     * PUT /api/user/fcm-token
     * Save or refresh the FCM device token for the authenticated user.
     * Called by the Angular app each time it obtains a new FCM token from Firebase.
     */
    public function updateFcmToken(Request $request)
    {
        $request->validate([
            'fcm_token' => 'required|string|max:512',
        ]);

        $request->user()->update(['fcm_token' => $request->input('fcm_token')]);

        return response()->json(['message' => 'FCM token updated.']);
    }
}

