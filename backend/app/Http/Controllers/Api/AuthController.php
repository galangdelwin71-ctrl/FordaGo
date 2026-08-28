<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Models\PasswordReset;
use App\Models\User;
use App\Services\MailService;
use App\Services\SmsService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;

class AuthController extends Controller
{
    private const MAX_FAILED_ATTEMPTS = 5;
    private const LOCKOUT_SECONDS = 15 * 60;
    private const RESET_CODE_TTL_SECONDS = 10 * 60;
    private const RESET_CODE_RESEND_SECONDS = 60;
    private const RESET_MAX_SENDS_PER_HOUR = 5;
    private const RESET_MAX_VERIFY_ATTEMPTS = 5;
    private const RESET_TOKEN_TTL_SECONDS = 10 * 60;

    // Dummy hash for constant-time rejection (prevents user enumeration).
    // Uses $2y$ so PHP's password_verify never throws.
    private const DUMMY_HASH = '$2y$10$8K1p/a0B0f8QfCMgfHdCvuQ6fHhSdz8sRP/6IDdnh3oX1N1pAVcc6';

    // ── Helpers ──────────────────────────────────────────────────────────

    /**
     * Safe password check that handles both:
     *   $2a$ — bcryptjs (Node/npm bcryptjs)
     *   $2y$ — PHP bcrypt (Laravel Hash::make)
     * Both are the same algorithm; only the prefix letter differs.
     * Also catches any exception so a corrupt hash never returns a 500.
     */
    private function checkPassword(string $plain, ?string $hash): bool
    {
        if ($hash === null || $hash === '') {
            return false;
        }
        try {
            // Normalize $2a$/$2b$ → $2y$ so PHP's password_verify is guaranteed to
            // accept bcryptjs-generated hashes from the old Node backend.
            // (Using substr/concat here on purpose — preg_replace('$2y$') is a trap:
            // '$2' in the replacement string is parsed as an empty backreference
            // since the pattern has no capture groups, silently corrupting the hash.)
            if (preg_match('/^\$2[ab]\$/', $hash)) {
                $hash = '$2y$'.substr($hash, 4);
            }
            return (bool) password_verify($plain, $hash);
        } catch (\Throwable) {
            return false;
        }
    }

    private function normalizeEmail(?string $value): string
    {
        return strtolower(trim((string) $value));
    }

    private function normalizePhone(?string $value): string
    {
        return substr(preg_replace('/\D/', '', (string) $value), 0, 20);
    }

    private function normalizeName(?string $value): string
    {
        return trim(preg_replace('/\s+/', ' ', (string) $value));
    }

    private function isValidPhone(string $value): bool
    {
        return (bool) preg_match('/^\d{11}$/', $value);
    }

    private function isValidEmail(string $value): bool
    {
        return (bool) preg_match('/^[^@\s]+@[^@\s]+\.[^@\s]+$/', $value);
    }

    private function isStrongPassword(?string $password): bool
    {
        if (! is_string($password)) {
            return false;
        }
        $len = strlen($password);
        if ($len < 8 || $len > 128) {
            return false;
        }

        return (bool) preg_match('/[a-z]/', $password)
            && (bool) preg_match('/[A-Z]/', $password)
            && (bool) preg_match('/\d/', $password)
            && (bool) preg_match('/[^A-Za-z0-9]/', $password);
    }

    /** @return array{type:string,email:string,phone:string,value:string} */
    private function parseAccountIdentifier(?string $value): array
    {
        $raw = trim((string) $value);
        if ($raw === '') {
            return ['type' => 'unknown', 'email' => '', 'phone' => '', 'value' => ''];
        }
        if (str_contains($raw, '@')) {
            $email = $this->normalizeEmail($raw);
            return ['type' => 'email', 'email' => $email, 'phone' => '', 'value' => $email];
        }
        $digits = preg_replace('/\D/', '', $raw);
        if (str_starts_with($digits, '63') && strlen($digits) === 12) {
            $phone = '0'.substr($digits, 2);
        } elseif (strlen($digits) === 10 && str_starts_with($digits, '9')) {
            $phone = '0'.$digits;
        } else {
            $phone = $digits;
        }
        return ['type' => 'phone', 'email' => '', 'phone' => $phone, 'value' => $phone];
    }

    private function findUserByIdentifier(?string $identifierInput): ?User
    {
        $identifier = $this->parseAccountIdentifier($identifierInput);

        if ($identifier['type'] === 'email') {
            if (! $this->isValidEmail($identifier['email'])) return null;
            return User::where('email', $identifier['email'])->first();
        }
        if ($identifier['type'] === 'phone') {
            $digits = preg_replace('/\D/', '', $identifier['phone']);
            $last10 = substr($digits, -10);
            if (strlen($last10) !== 10) return null;
            $local = '0'.$last10;
            $intl  = '+63'.$last10;
            $rawIntl = '63'.$last10;

            return User::where('phone', $local)
                ->orWhere('phone', $intl)
                ->orWhere('phone', $rawIntl)
                ->orWhere('phone', $digits)
                ->orWhere('phone', 'like', '%'.$last10)
                ->first();
        }
        return null;
    }

    private function buildUniqueUsername(string $firstName, string $lastName): string
    {
        $base = $this->normalizeName("{$firstName} {$lastName}") ?: ('member-'.time());
        for ($suffix = 0; $suffix < 1000; $suffix++) {
            $candidate = $suffix === 0 ? $base : "{$base} ".($suffix + 1);
            if (! User::where('username', $candidate)->exists()) {
                return $candidate;
            }
        }
        return $base.' '.time();
    }

    private function maskEmail(?string $email): string
    {
        $value = (string) $email;
        $atIndex = strpos($value, '@');
        if ($atIndex === false || $atIndex <= 0) return $value;
        $name    = substr($value, 0, $atIndex);
        $domain  = substr($value, $atIndex + 1);
        $visible = substr($name, 0, min(2, strlen($name)));
        return $visible.str_repeat('*', max(strlen($name) - strlen($visible), 1))."@{$domain}";
    }

    private function maskPhone(?string $phone): string
    {
        $digits = preg_replace('/\D/', '', (string) $phone);
        if (strlen($digits) < 4) return str_repeat('*', strlen($digits));
        return str_repeat('*', strlen($digits) - 4).substr($digits, -4);
    }

    private function hashResetCode(string $code): string
    {
        return hash('sha256', $code.':'.config('app.key'));
    }

    private function generateResetCode(): string
    {
        return str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
    }

    private function makeResetToken(int $userId, int $resetRowId): string
    {
        return Crypt::encryptString(json_encode([
            'sub'     => $userId,
            'rid'     => $resetRowId,
            'purpose' => 'password_reset',
            'exp'     => now()->addSeconds(self::RESET_TOKEN_TTL_SECONDS)->timestamp,
        ]));
    }

    /** @return array{sub:int,rid:int}|null */
    private function readResetToken(string $token): ?array
    {
        try {
            $payload = json_decode(Crypt::decryptString($token), true);
        } catch (\Throwable) {
            return null;
        }
        if (! is_array($payload) || ($payload['purpose'] ?? null) !== 'password_reset') return null;
        if (! isset($payload['exp']) || $payload['exp'] < now()->timestamp) return null;
        return ['sub' => (int) $payload['sub'], 'rid' => (int) $payload['rid']];
    }

    // ── Routes ───────────────────────────────────────────────────────────

    public function login(Request $request)
    {
        $email    = $this->normalizeEmail($request->input('email'));
        $password = is_string($request->input('password')) ? $request->input('password') : '';

        if ($email === '' || $password === '') {
            return response()->json(['message' => 'Email and password are required.'], 400);
        }
        if (strlen($password) > 128) {
            return response()->json(['message' => 'Invalid email or password.'], 400);
        }

        $attemptKey = 'login:'.$request->ip().':'.$email;
        if (RateLimiter::tooManyAttempts($attemptKey, self::MAX_FAILED_ATTEMPTS)) {
            return response()->json(['message' => 'Too many failed attempts. Please try again later.'], 429);
        }

        $user = User::where('email', $email)->first();

        if (! $user) {
            // Constant-time dummy check to prevent user enumeration
            $this->checkPassword($password, self::DUMMY_HASH);
            RateLimiter::hit($attemptKey, self::LOCKOUT_SECONDS);
            return response()->json(['message' => 'Invalid email or password.'], 401);
        }

        if (! $this->checkPassword($password, $user->password)) {
            RateLimiter::hit($attemptKey, self::LOCKOUT_SECONDS);
            return response()->json(['message' => 'Invalid email or password.'], 401);
        }

        $isStaffRole = in_array($user->role, ['admin', 'super_admin', 'employee'], true);
        if (! $isStaffRole && $user->membership_status !== 'active') {
            $pendingMessage = $user->membership_type === 'premium'
                ? 'Your Premium account is still pending admin payment verification. Please complete payment and wait for approval before logging in.'
                : 'Your Daily Pass account is still pending admin verification. Please wait for approval before logging in.';
            return response()->json(['message' => $pendingMessage], 403);
        }

        RateLimiter::clear($attemptKey);

        // Check if premium membership expired and revert to daily if needed
        $user->checkAndExpireMembership();
        $user->refresh();

        $token = $user->createToken('api')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user'  => [
                'id'                 => $user->id,
                'username'           => $user->username,
                'first_name'         => $user->first_name ?? '',
                'last_name'          => $user->last_name  ?? '',
                'email'              => $user->email,
                'role'               => $user->role,
                'phone'              => $user->phone,
                'gender'             => $user->gender,
                'profile_image'      => $user->profile_image,
                'membership_type'    => $user->membership_type,
                'membership_status'  => $user->membership_status,
                'payment_method'     => $user->payment_method,
                'membership_expiry'  => $user->membership_expiry,
                'created_at'         => $user->created_at,
                // Coach accounts keep role = 'user' (see AdminCoachController)
                // and are distinguished only by owning a coach_profiles row.
                // Exposed here so the frontend can route/guard coach-only
                // pages right after login without an extra round trip.
                'has_coach_profile'  => $user->isCoach(),
            ],
        ]);
    }

    public function register(Request $request)
    {
        $firstName      = $this->normalizeName($request->input('firstName', $request->input('first_name')));
        $lastName       = $this->normalizeName($request->input('lastName',  $request->input('last_name')));
        $email          = $this->normalizeEmail($request->input('email'));
        $password       = is_string($request->input('password')) ? $request->input('password') : '';
        $rawPhone       = trim((string) $request->input('phone', ''));
        $phone          = $this->normalizePhone($rawPhone);
        $gender         = strtolower(trim((string) $request->input('gender', '')));
        $membershipType = $request->input('membership_type');
        $paymentMethod  = $request->input('payment_method');

        if ($firstName === '' || $lastName === '' || $email === '' || $password === '') {
            return response()->json(['message' => 'First name, last name, email, and password are required.'], 400);
        }
        if (! $this->isValidEmail($email)) {
            return response()->json(['message' => 'Invalid email format.'], 400);
        }
        if (! $this->isStrongPassword($password)) {
            return response()->json(['message' => 'Password must be 8+ chars with uppercase, lowercase, number, and special character.'], 400);
        }
        if ($rawPhone !== '' && ! $this->isValidPhone($phone)) {
            return response()->json(['message' => 'Phone number must be exactly 11 digits (e.g. 09171234567).'], 400);
        }
        if ($gender !== '' && ! in_array($gender, ['male', 'female', 'other'], true)) {
            return response()->json(['message' => 'Invalid gender selection.'], 400);
        }
        if (User::where('email', $email)->exists()) {
            return response()->json(['message' => 'Email already exists.'], 409);
        }

        $username                = $this->buildUniqueUsername($firstName, $lastName);
        $normalizedMembershipType = $membershipType === 'daily' ? 'daily' : 'premium';
        $normalizedPaymentMethod  = $paymentMethod  === 'gcash' ? 'gcash' : 'cash';

        $user = User::create([
            'username'          => $username,
            'first_name'        => $firstName,
            'last_name'         => $lastName,
            'email'             => $email,
            'password'          => Hash::make($password),
            'role'              => 'user',
            'phone'             => $phone !== '' ? $phone : null,
            'gender'            => $gender !== '' ? $gender : null,
            'membership_type'   => $normalizedMembershipType,
            'membership_status' => 'pending',
            'payment_method'    => $normalizedPaymentMethod,
            'membership_expiry' => null,
        ]);

        // Notify all staff (admin, super_admin, employee) via in-app & FCM Push
        try {
            $staffMembers = User::whereIn('role', ['admin', 'super_admin', 'employee'])->get();
            foreach ($staffMembers as $staff) {
                Notification::create([
                    'user_id' => $staff->id,
                    'title'   => "New Member Registration: {$firstName} {$lastName}",
                    'message' => $normalizedMembershipType === 'premium'
                        ? "{$firstName} {$lastName} (@{$username}) registered as Premium ({$normalizedPaymentMethod}). Please verify payment and activate account."
                        : "{$firstName} {$lastName} (@{$username}) registered as Daily Pass. Please verify and activate account before login.",
                ]);
            }

            // Push directly to Admin mobile & tablet devices
            $fcmTitle = "New Member Registration 👤";
            $fcmBody = "{$firstName} {$lastName} registered ({$normalizedMembershipType}). Pending approval.";
            app(\App\Services\FcmService::class)->sendToAdmins($fcmTitle, $fcmBody, [
                'type'        => 'admin_member',
                'targetRoute' => '/admin',
            ]);
        } catch (\Throwable $e) {
            \Log::warning('Failed to notify staff on registration: ' . $e->getMessage());
        }

        $normalizedPhone = SmsService::normalizePhoneNumber($phone);
        $smsMessage = $normalizedMembershipType === 'premium'
            ? "FordaGO: Hi {$firstName}, your Premium registration is pending admin verification. Please pay P500 via ".($normalizedPaymentMethod === 'gcash' ? 'GCash' : 'cash at the gym counter').' and wait for approval before login.'
            : "FordaGO: Hi {$firstName}, your Daily Pass registration is pending admin verification. You can log in after approval.";

        $smsResult = $normalizedPhone !== ''
            ? SmsService::send($normalizedPhone, $smsMessage)
            : ['sent' => false, 'skippedReason' => 'No phone number provided'];

        return response()->json([
            'message'     => 'Registration submitted. Please wait for admin verification before login.',
            'smsSent'     => (bool) ($smsResult['sent'] ?? false),
            'smsProvider' => $smsResult['provider'] ?? null,
            'smsReason'   => ($smsResult['sent'] ?? false) ? null : ($smsResult['skippedReason'] ?? $smsResult['error'] ?? 'SMS not sent'),
        ]);
    }

    public function changePassword(Request $request)
    {
        $currentPassword = $request->input('currentPassword');
        $newPassword     = $request->input('newPassword');

        if (! $currentPassword || ! $newPassword) {
            return response()->json(['message' => 'Both current and new password are required'], 400);
        }
        if (! $this->isStrongPassword($newPassword)) {
            return response()->json(['message' => 'New password must be 8+ chars with uppercase, lowercase, number, and special character'], 400);
        }

        $user = $request->user();
        if (! $user) {
            return response()->json(['message' => 'User not found'], 404);
        }
        if (! $this->checkPassword($currentPassword, $user->password)) {
            return response()->json(['message' => 'Current password is incorrect'], 401);
        }

        $user->update(['password' => Hash::make($newPassword)]);
        return response()->json(['message' => 'Password updated successfully']);
    }

    // ── Forgot password ───────────────────────────────────────────────────

    public function forgotPasswordLookup(Request $request)
    {
        $identifierInput = trim((string) ($request->input('identifier') ?? $request->input('email') ?? $request->input('phone') ?? ''));
        $parsed = $this->parseAccountIdentifier($identifierInput);

        if (($parsed['type'] === 'email' && ! $this->isValidEmail($parsed['email']))
            || ($parsed['type'] === 'phone' && ! $this->isValidPhone($parsed['phone']))
            || $parsed['type'] === 'unknown') {
            return response()->json(['message' => 'Enter a valid email or 11-digit phone number.'], 400);
        }

        $user = $this->findUserByIdentifier($identifierInput);
        if (! $user) {
            return response()->json(['message' => 'No account found with that email or phone number.'], 404);
        }

        $hasPhone = (bool) ($user->phone && SmsService::normalizePhoneNumber($user->phone));
        return response()->json([
            'identifierType'  => $parsed['type'],
            'identifierValue' => $parsed['value'],
            'emailMasked'     => $this->maskEmail($user->email),
            'hasPhone'        => $hasPhone,
            'phoneMasked'     => $hasPhone ? $this->maskPhone($user->phone) : null,
        ]);
    }

    public function forgotPasswordSend(Request $request)
    {
        $identifierInput = trim((string) ($request->input('identifier') ?? $request->input('email') ?? $request->input('phone') ?? ''));
        $parsed  = $this->parseAccountIdentifier($identifierInput);
        $channel = $request->input('channel') === 'sms' ? 'sms' : ($request->input('channel') === 'email' ? 'email' : '');

        if (($parsed['type'] === 'email' && ! $this->isValidEmail($parsed['email']))
            || ($parsed['type'] === 'phone' && ! $this->isValidPhone($parsed['phone']))
            || $parsed['type'] === 'unknown' || $channel === '') {
            return response()->json(['message' => 'Identifier and a valid delivery channel are required.'], 400);
        }

        $limitKey = 'reset-send:'.$request->ip().':'.$parsed['value'];
        if (RateLimiter::tooManyAttempts($limitKey.':hourly', self::RESET_MAX_SENDS_PER_HOUR)) {
            return response()->json(['message' => 'Too many code requests. Please try again later.'], 429);
        }
        if (RateLimiter::tooManyAttempts($limitKey.':cooldown', 1)) {
            return response()->json(['message' => 'Please wait a moment before requesting another code.'], 429);
        }

        $user = $this->findUserByIdentifier($identifierInput);
        if (! $user) {
            return response()->json(['message' => 'No account found with that email or phone number.'], 404);
        }

        $normalizedPhone = SmsService::normalizePhoneNumber($user->phone);
        if ($channel === 'sms' && $normalizedPhone === '') {
            return response()->json(['message' => 'No phone number on file for SMS delivery.'], 400);
        }

        $destination = $channel === 'email' ? $user->email : $normalizedPhone;
        $code        = $this->generateResetCode();
        $codeHash    = $this->hashResetCode($code);

        PasswordReset::create([
            'user_id'     => $user->id,
            'channel'     => $channel,
            'destination' => $destination,
            'code_hash'   => $codeHash,
            'expires_at'  => now()->addSeconds(self::RESET_CODE_TTL_SECONDS),
        ]);

        RateLimiter::hit($limitKey.':hourly', 3600);
        RateLimiter::hit($limitKey.':cooldown', self::RESET_CODE_RESEND_SECONDS);

        $displayName    = trim(($user->first_name ?? '').' '.($user->last_name ?? '')) ?: ($user->username ?? 'Member');
        $message        = "FordaGO: Your password reset code is {$code}. It expires in 10 minutes. If you didn't request this, ignore this message.";
        $deliveryResult = $channel === 'email'
            ? MailService::sendPasswordResetOtp($destination, $code, $displayName)
            : SmsService::send($destination, $message);

        $skippedReason = strtolower((string) ($deliveryResult['skippedReason'] ?? ''));
        $isSent = (bool) ($deliveryResult['sent'] ?? false);

        // devCode is only exposed in local/debug mode so the OTP is never
        // visible in production responses when SMS or email delivery fails.
        $isDebug = config('app.debug') && in_array(config('app.env'), ['local', 'development'], true);

        return response()->json([
            'sent'              => $isSent,
            'channel'           => $channel,
            'destinationMasked' => $channel === 'email' ? $this->maskEmail($destination) : $this->maskPhone($destination),
            'reason'            => $isSent ? null : ($deliveryResult['skippedReason'] ?? $deliveryResult['error'] ?? 'Could not send code'),
            'devCode'           => (! $isSent && $isDebug) ? $code : null,
        ]);
    }

    public function forgotPasswordVerify(Request $request)
    {
        $identifierInput = trim((string) ($request->input('identifier') ?? $request->input('email') ?? $request->input('phone') ?? ''));
        $parsed = $this->parseAccountIdentifier($identifierInput);
        $code   = trim((string) $request->input('code', ''));

        if (($parsed['type'] === 'email' && ! $this->isValidEmail($parsed['email']))
            || ($parsed['type'] === 'phone' && ! $this->isValidPhone($parsed['phone']))
            || $parsed['type'] === 'unknown' || ! preg_match('/^\d{6}$/', $code)) {
            return response()->json(['message' => 'Please enter the 6-digit code sent to you.'], 400);
        }

        $user = $this->findUserByIdentifier($identifierInput);
        if (! $user) {
            return response()->json(['message' => 'No account found with that email or phone number.'], 404);
        }

        $resetRow = PasswordReset::where('user_id', $user->id)
            ->whereNull('verified_at')
            ->whereNull('password_changed_at')
            ->where('expires_at', '>', now())
            ->orderByDesc('created_at')
            ->first();

        if (! $resetRow) {
            return response()->json(['message' => 'Code expired or not requested. Please request a new code.'], 400);
        }
        if ($resetRow->attempts >= self::RESET_MAX_VERIFY_ATTEMPTS) {
            return response()->json(['message' => 'Too many attempts. Please request a new code.'], 429);
        }
        if ($this->hashResetCode($code) !== $resetRow->code_hash) {
            $resetRow->increment('attempts');
            return response()->json(['message' => 'Invalid code. Please try again.'], 400);
        }

        $resetRow->update(['verified_at' => now()]);
        return response()->json(['resetToken' => $this->makeResetToken($user->id, $resetRow->id)]);
    }

    public function forgotPasswordReset(Request $request)
    {
        $resetToken  = (string) $request->input('resetToken', '');
        $newPassword = is_string($request->input('newPassword')) ? $request->input('newPassword') : '';

        if ($resetToken === '' || $newPassword === '') {
            return response()->json(['message' => 'Reset token and new password are required.'], 400);
        }
        if (! $this->isStrongPassword($newPassword)) {
            return response()->json(['message' => 'Password must be 8+ chars with uppercase, lowercase, number, and special character.'], 400);
        }

        $payload = $this->readResetToken($resetToken);
        if (! $payload) {
            return response()->json(['message' => 'Reset session expired. Please start again.'], 400);
        }

        $resetRow = PasswordReset::where('id', $payload['rid'])->where('user_id', $payload['sub'])->first();
        if (! $resetRow || ! $resetRow->verified_at || $resetRow->password_changed_at) {
            return response()->json(['message' => 'Reset session is no longer valid. Please start again.'], 400);
        }

        User::where('id', $payload['sub'])->update(['password' => Hash::make($newPassword)]);
        $resetRow->update(['password_changed_at' => now()]);

        return response()->json(['message' => 'Password updated successfully. You can now log in.']);
    }
}
