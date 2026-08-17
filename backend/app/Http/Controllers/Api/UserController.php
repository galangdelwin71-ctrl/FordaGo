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

        // Same flag AuthController::login() returns, exposed here too so an
        // existing session (token already issued before this field existed,
        // or the app's own periodic /users/me refresh) picks up coach status
        // without forcing a re-login. See AuthController::login() for why
        // this can't just be $user->role — coach accounts keep role='user'.
        $payload = $user->toArray();
        $payload['has_coach_profile'] = $user->isCoach();

        return response()->json($payload);
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
        $username  = trim((string) $request->input('username', '')) ?: trim("{$firstName} {$lastName}");
        $email          = $request->input('email');
        $rawPhone       = $request->input('phone');
        $phoneProvided  = ! is_null($rawPhone) && trim((string) $rawPhone) !== '';
        $normalizedPhone = $phoneProvided ? $this->normalizePhone($rawPhone) : null;

        if ($phoneProvided && ! $this->isValidPhone($normalizedPhone)) {
            return response()->json(['message' => 'Phone number must be exactly 11 digits (e.g. 09171234567).'], 400);
        }

        $user = User::find($id);
        if (! $user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        if ($isAdmin) {
            $user->fill([
                'username'          => $username ?: $user->username,
                'first_name'        => $firstName ?: $user->first_name,
                'last_name'         => $lastName  ?: $user->last_name,
                'email'             => $email     ?? $user->email,
                'role'              => $request->input('role', $user->role),
                'phone'             => $normalizedPhone,
                'gender'            => $request->input('gender') ?: null,
                'profile_image'     => $request->input('profile_image') ?: null,
                'membership_type'   => $request->input('membership_type', $user->membership_type),
                'payment_method'    => $request->input('payment_method', $user->payment_method),
                'membership_expiry' => $request->input('membership_expiry') ?: null,
            ])->save();
        } else {
            $user->fill([
                'username'      => $username ?: $user->username,
                'first_name'    => $firstName ?: $user->first_name,
                'last_name'     => $lastName  ?: $user->last_name,
                'email'         => $email     ?? $user->email,
                'phone'         => $normalizedPhone,
                'gender'        => $request->input('gender') ?: null,
                'profile_image' => $request->input('profile_image') ?: null,
            ])->save();
        }

        return response()->json(['message' => 'User updated']);
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

        Notification::create([
            'user_id' => $user->id,
            'title'   => $membershipType === 'premium' ? 'Premium Payment Verified' : 'Account Verified',
            'message' => $inAppMessage,
        ]);

        // SMS notification (best-effort)
        $smsPhone = SmsService::normalizePhoneNumber($user->phone);
        if ($smsPhone !== '') {
            $smsMessage = $membershipType === 'premium'
                ? "FordaGO: Hi {$user->username}, your Premium payment is verified. You can now log in. Membership valid until {$membershipExpiry}."
                : "FordaGO: Hi {$user->username}, your Daily Pass account is verified. You can now log in. Please pay at each attendance QR scan.";

            SmsService::send($smsPhone, $smsMessage);
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
}
