<?php

use App\Http\Controllers\Api\AdminCoachController;
use App\Http\Controllers\Api\AttendanceController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CoachAvailabilityController;
use App\Http\Controllers\Api\CoachController;
use App\Http\Controllers\Api\CoachDashboardController;
use App\Http\Controllers\Api\CoachProgramController;
use App\Http\Controllers\Api\ConversationController;
use App\Http\Controllers\Api\EquipmentController;
use App\Http\Controllers\Api\FeedbackController;
use App\Http\Controllers\Api\InventoryController;
use App\Http\Controllers\Api\MessageController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\PersonalRecordController;
use App\Http\Controllers\Api\ProgramBookingController;
use App\Http\Controllers\Api\ProposalController;
use App\Http\Controllers\Api\ReportsController;
use App\Http\Controllers\Api\ScheduleController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\WorkoutController;
use App\Http\Controllers\Api\WorkoutSessionController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes  —  ported 1:1 from server/routes/*.js
|--------------------------------------------------------------------------
*/

// ── Auth (server/routes/auth.js) ───────────────────────────────────────────
Route::prefix('auth')->group(function () {
    Route::post('/login',    [AuthController::class, 'login']);
    Route::post('/register', [AuthController::class, 'register']);

    Route::post('/forgot-password/lookup', [AuthController::class, 'forgotPasswordLookup']);
    Route::post('/forgot-password/send',   [AuthController::class, 'forgotPasswordSend']);
    Route::post('/forgot-password/verify', [AuthController::class, 'forgotPasswordVerify']);
    Route::post('/forgot-password/reset',  [AuthController::class, 'forgotPasswordReset']);

    Route::middleware('auth:sanctum')->post('/change-password', [AuthController::class, 'changePassword']);
});

// Convenience: return the authenticated user (used by frontend on app boot)
Route::middleware('auth:sanctum')->get('/user', fn (\Illuminate\Http\Request $r) => $r->user());

// ── All routes below require a valid Sanctum token ─────────────────────────
Route::middleware('auth:sanctum')->group(function () {

    // ── Users (server/routes/user.js) ─────────────────────────────────────
    Route::prefix('users')->group(function () {
        Route::get('/',                [UserController::class, 'index'])->middleware('role:admin,super_admin,employee');
        Route::get('/count',           [UserController::class, 'count'])->middleware('role:admin,super_admin,employee');
        Route::get('/me',              [UserController::class, 'me']);
        Route::post('/membership/renew', [UserController::class, 'renewOrUpgradeMembership']);
        Route::post('/create',         [UserController::class, 'store'])->middleware('role:admin,super_admin,employee');
        Route::put('/{id}',            [UserController::class, 'update'])->whereNumber('id');
        Route::put('/{id}/membership', [UserController::class, 'updateMembership'])->whereNumber('id')->middleware('role:admin,super_admin,employee');
        Route::delete('/{id}',         [UserController::class, 'destroy'])->whereNumber('id')->middleware('role:admin,super_admin,employee');
    });

    // ── Equipment (server/routes/equipment.js) ────────────────────────────
    Route::prefix('equipment')->group(function () {
        Route::get('/',          [EquipmentController::class, 'index']);
        Route::post('/scan',     [EquipmentController::class, 'scan']);
        Route::get('/scan-logs', [EquipmentController::class, 'scanLogs'])->middleware('role:admin,super_admin,employee');
        Route::post('/',         [EquipmentController::class, 'store'])->middleware('role:admin,super_admin,employee');
        Route::put('/{id}',      [EquipmentController::class, 'update'])->whereNumber('id')->middleware('role:admin,super_admin,employee');
        Route::delete('/{id}',   [EquipmentController::class, 'destroy'])->whereNumber('id')->middleware('role:admin,super_admin,employee');
    });

    // ── Inventory / Shop (server/routes/inventory.js) ─────────────────────
    Route::prefix('inventory')->group(function () {
        // Products
        Route::get('/products',            [InventoryController::class, 'products']);
        Route::post('/products',           [InventoryController::class, 'storeProduct'])->middleware('role:admin,super_admin,employee');
        Route::put('/products/{id}',       [InventoryController::class, 'updateProduct'])->whereNumber('id')->middleware('role:admin,super_admin,employee');
        Route::delete('/products/{id}',    [InventoryController::class, 'destroyProduct'])->whereNumber('id')->middleware('role:admin,super_admin,employee');
        // Orders
        Route::get('/my-orders',           [InventoryController::class, 'myOrders']);
        Route::get('/orders',              [InventoryController::class, 'orders'])->middleware('role:admin,super_admin,employee');
        Route::post('/orders',             [InventoryController::class, 'placeOrder']);
        Route::match(['put', 'post'], '/order-groups/{groupId}/cancel',  [InventoryController::class, 'cancelOrderGroup']);
        Route::match(['put', 'post'], '/order-groups/{groupId}/approve', [InventoryController::class, 'approveOrderGroup'])->middleware('role:admin,super_admin,employee');
        Route::match(['put', 'post'], '/order-groups/{groupId}/reject',  [InventoryController::class, 'rejectOrderGroup'])->middleware('role:admin,super_admin,employee');
        Route::match(['put', 'post'], '/orders/{id}/approve', [InventoryController::class, 'approveOrder'])->whereNumber('id')->middleware('role:admin,super_admin,employee');
        Route::match(['put', 'post'], '/orders/{id}/reject',  [InventoryController::class, 'rejectOrder'])->whereNumber('id')->middleware('role:admin,super_admin,employee');
    });

    // ── Schedule (server/routes/schedule.js) ──────────────────────────────
    Route::prefix('schedule')->group(function () {
        Route::get('/',        [ScheduleController::class, 'index']);
        Route::post('/',       [ScheduleController::class, 'store'])->middleware('role:admin,super_admin,employee');
        Route::put('/{id}',    [ScheduleController::class, 'update'])->whereNumber('id')->middleware('role:admin,super_admin,employee');
        Route::delete('/{id}', [ScheduleController::class, 'destroy'])->whereNumber('id')->middleware('role:admin,super_admin,employee');
    });

    // ── Attendance (server/routes/attendance.js) ───────────────────────────
    Route::prefix('attendance')->group(function () {
        Route::post('/checkin',     [AttendanceController::class, 'checkin']);
        Route::get('/my',           [AttendanceController::class, 'my']);
        Route::get('/today',        [AttendanceController::class, 'today'])->middleware('role:admin,super_admin,employee');
        Route::get('/by-date',      [AttendanceController::class, 'byDate'])->middleware('role:admin,super_admin,employee');
        Route::get('/pending',      [AttendanceController::class, 'pending'])->middleware('role:admin,super_admin,employee');
        Route::put('/{id}/confirm', [AttendanceController::class, 'confirm'])->whereNumber('id')->middleware('role:admin,super_admin,employee');
        Route::put('/{id}/reject',  [AttendanceController::class, 'reject'])->whereNumber('id')->middleware('role:admin,super_admin,employee');
        Route::get('/qr-code',      [AttendanceController::class, 'qrCode'])->middleware('role:admin,super_admin,employee');
    });

    // ── Workouts (server/routes/workout.js) ───────────────────────────────
    Route::prefix('workouts')->group(function () {
        Route::get('/',    [WorkoutController::class, 'index']);
        Route::post('/',   [WorkoutController::class, 'store']);
        Route::get('/all', [WorkoutController::class, 'all'])->middleware('role:admin,super_admin,employee');
    });

    // ── Personal workout tracker (Stage 2 — fordago-database-migration-plan.md) ──
    // NOT the gym class schedule (ScheduleController) — this is the
    // per-user daily session tracker that used to live only in
    // WorkoutTrackerService localStorage.
    Route::prefix('workout-sessions')->group(function () {
        Route::get('/',                    [WorkoutSessionController::class, 'index']);
        Route::post('/',                   [WorkoutSessionController::class, 'store']);
        Route::patch('/{clientSessionId}', [WorkoutSessionController::class, 'update']);
        Route::delete('/{clientSessionId}', [WorkoutSessionController::class, 'destroy']);
    });

    Route::prefix('personal-records')->group(function () {
        Route::get('/',        [PersonalRecordController::class, 'index']);
        Route::post('/',       [PersonalRecordController::class, 'store']);
        Route::put('/{id}',    [PersonalRecordController::class, 'update'])->whereNumber('id');
        Route::delete('/{id}', [PersonalRecordController::class, 'destroy'])->whereNumber('id');
    });

    // ── Notifications (server/routes/notification.js) ─────────────────────
    Route::prefix('notifications')->group(function () {
        Route::get('/',                      [NotificationController::class, 'index']);
        Route::post('/',                     [NotificationController::class, 'store']);
        Route::post('/missed-workout-alert', [NotificationController::class, 'missedWorkoutAlert']);
        Route::patch('/read',                [NotificationController::class, 'markRead']);
        Route::delete('/{id}',               [NotificationController::class, 'destroy'])->whereNumber('id')->middleware('role:admin,super_admin,employee');
    });

    // ── Feedback & Ratings ────────────────────────────────────────────────
    Route::prefix('feedback')->group(function () {
        Route::get('/status', [FeedbackController::class, 'status']);
        Route::post('/',      [FeedbackController::class, 'store']);
        Route::get('/',       [FeedbackController::class, 'index'])->middleware('role:admin,super_admin,employee');
    });

    // ── Reports (server/routes/reports.js) ────────────────────────────────
    Route::prefix('reports')->group(function () {
        Route::get('/my-transactions',    [ReportsController::class, 'myTransactions']);
        Route::get('/admin/transactions', [ReportsController::class, 'adminTransactions'])->middleware('role:admin,super_admin,employee');
        Route::get('/admin/attendance',   [ReportsController::class, 'adminAttendance'])->middleware('role:admin,super_admin,employee');
        Route::get('/admin/sales',        [ReportsController::class, 'adminSales'])->middleware('role:admin,super_admin,employee');
        Route::get('/admin/inventory',    [ReportsController::class, 'adminInventory'])->middleware('role:admin,super_admin,employee');
        Route::get('/admin/memberships',  [ReportsController::class, 'adminMemberships'])->middleware('role:admin,super_admin,employee');
    });

    // ── Coaching & Chat (Coaching feature) ─────────────────────────────────
    // Read-only for regular users: browsing active coaches, viewing your own
    // coach profile (if you have one), listing a coach's clients. Creating
    // or editing a coach account is admin-only — see admin/coaches below.
    // There is intentionally NO self-service "become a coach" route here.
    Route::prefix('coaches')->group(function () {
        Route::get('/',                 [CoachController::class, 'index']);
        Route::get('/dashboard-stats',  [CoachController::class, 'dashboardStats']);
        Route::get('/requests',         [CoachController::class, 'requests']);
        Route::get('/profile/me',       [CoachController::class, 'myProfile']);
        Route::put('/profile/me',       [CoachController::class, 'updateMyProfile']);
        Route::get('/clients',          [CoachController::class, 'clients']);

        // Self-service weekly availability ("Set Availability").
        Route::get('/availability',     [CoachAvailabilityController::class, 'index']);
        Route::post('/availability',    [CoachAvailabilityController::class, 'store']);
        Route::put('/availability/{id}',    [CoachAvailabilityController::class, 'update'])->whereNumber('id');
        Route::delete('/availability/{id}', [CoachAvailabilityController::class, 'destroy'])->whereNumber('id');

        // Self-service reusable workout templates ("Create Program").
        Route::get('/programs',         [CoachProgramController::class, 'index']);
        Route::post('/programs',        [CoachProgramController::class, 'store']);
        Route::get('/programs/{id}',    [CoachProgramController::class, 'show'])->whereNumber('id');
        Route::put('/programs/{id}',    [CoachProgramController::class, 'update'])->whereNumber('id');
        Route::delete('/programs/{id}', [CoachProgramController::class, 'destroy'])->whereNumber('id');

        // Roster for a public group class the coach owns (see programs/public below).
        Route::get('/programs/{id}/bookings', [ProgramBookingController::class, 'roster'])->whereNumber('id');

        // Single-call dashboard endpoint — returns profile, stats, today\'s
        // sessions, conversations, clients, and requests all at once to cut
        // the 6 separate HTTP round-trips down to 1 (big win over tunnels).
        Route::get('/dashboard-full',   [CoachDashboardController::class, 'full']);

        // Keep this LAST in the group — {id} would otherwise shadow the
        // static segments above for any all-numeric path.
        Route::get('/{id}',        [CoachController::class, 'show'])->whereNumber('id');
    });

    // ── Admin-only coach account management ────────────────────────────────
    Route::prefix('admin/coaches')->middleware('role:admin,super_admin')->group(function () {
        Route::get('/',             [AdminCoachController::class, 'index']);
        Route::post('/',            [AdminCoachController::class, 'store']);
        Route::put('/{userId}',     [AdminCoachController::class, 'update'])->whereNumber('userId');
        Route::delete('/{userId}',  [AdminCoachController::class, 'destroy'])->whereNumber('userId');
    });

    Route::prefix('conversations')->group(function () {
        Route::get('/',                                  [ConversationController::class, 'index']);
        Route::post('/start',                            [ConversationController::class, 'start']);
        Route::get('/{id}',                              [ConversationController::class, 'show'])->whereNumber('id');
        Route::post('/{id}/accept',                      [ConversationController::class, 'accept'])->whereNumber('id');
        Route::post('/{id}/decline',                     [ConversationController::class, 'decline'])->whereNumber('id');
        Route::delete('/{id}',                           [ConversationController::class, 'destroy'])->whereNumber('id');
        Route::get('/{conversationId}/messages',         [MessageController::class, 'index'])->whereNumber('conversationId');
        Route::post('/{conversationId}/messages',        [MessageController::class, 'store'])->whereNumber('conversationId');
        Route::patch('/{conversationId}/read',           [MessageController::class, 'markRead'])->whereNumber('conversationId');
    });

    Route::prefix('proposals')->group(function () {
        Route::get('/',              [ProposalController::class, 'index']);
        Route::post('/',             [ProposalController::class, 'store']);
        Route::get('/{id}',          [ProposalController::class, 'show'])->whereNumber('id');
        Route::post('/{id}/accept',  [ProposalController::class, 'accept'])->whereNumber('id');
        Route::post('/{id}/cancel',  [ProposalController::class, 'cancel'])->whereNumber('id');
    });

    // ── Public group classes ("Avail" flow) ────────────────────────────────
    // Any authenticated member can browse and instant-book a seat, distinct
    // from the 1-on-1 proposal flow above. Pay-at-gym only for now — see
    // ProgramBookingController for why.
    Route::prefix('programs')->group(function () {
        Route::get('/public',            [ProgramBookingController::class, 'publicIndex']);
        Route::get('/public/{id}',       [ProgramBookingController::class, 'publicShow'])->whereNumber('id');
        Route::post('/{id}/book',        [ProgramBookingController::class, 'book'])->whereNumber('id');
        Route::post('/{id}/book/cancel', [ProgramBookingController::class, 'cancel'])->whereNumber('id');
    });

});
