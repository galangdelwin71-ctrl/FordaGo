<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Feedback;
use App\Models\Notification;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;

class FeedbackController extends Controller
{
    /**
     * GET /api/feedback/status
     * Returns whether the current user has already submitted feedback and account age.
     */
    public function status(Request $request)
    {
        $user = $request->user();
        $hasFeedback = Feedback::where('user_id', $user->id)->exists();

        $createdAt = $user->created_at ? Carbon::parse($user->created_at) : Carbon::now()->subDays(1);
        $daysActive = (int) $createdAt->diffInDays(Carbon::now());
        $isEligible = $daysActive >= 3 && !$hasFeedback;

        return response()->json([
            'hasSubmitted' => $hasFeedback,
            'daysActive' => $daysActive,
            'isEligible' => $isEligible,
            'createdAt' => $user->created_at,
        ]);
    }

    /**
     * POST /api/feedback
     * Submit an NPS rating (0-10) and feedback reason.
     * Notifies super_admin accounts of the new feedback.
     */
    public function store(Request $request)
    {
        $request->validate([
            'rating' => 'required|integer|min:0|max:10',
            'reason' => 'nullable|string|max:1000',
        ]);

        $user = $request->user();

        $feedback = Feedback::create([
            'user_id' => $user->id,
            'rating'  => (int) $request->input('rating'),
            'reason'  => $request->input('reason') ? trim((string) $request->input('reason')) : null,
        ]);

        // Determine sentiment label
        $rating = (int) $request->input('rating');
        $sentiment = $rating >= 9 ? '😊 Promoter' : ($rating >= 7 ? '😐 Passive' : '😞 Detractor');
        $stars = str_repeat('⭐', min($rating, 5));
        $displayName = trim(($user->first_name ?? '') . ' ' . ($user->last_name ?? '')) ?: $user->username;

        // Notify all super_admin and admin accounts
        try {
            $superAdmins = User::whereIn('role', ['super_admin', 'admin'])->get();
            foreach ($superAdmins as $admin) {
                Notification::create([
                    'user_id' => $admin->id,
                    'title'   => "⭐ New Feedback Received — Rating {$rating}/10",
                    'message' => "{$displayName} (@{$user->username}) submitted feedback. {$sentiment} · Rating: {$rating}/10 {$stars}"
                        . ($feedback->reason ? " · Comment: \"{$feedback->reason}\"" : ''),
                    'is_read' => false,
                ]);
            }
        } catch (\Throwable $e) {
            \Log::warning('Failed to notify admins of new feedback: ' . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'message' => 'Your feedback has been sent successfully.',
            'feedback' => $feedback,
        ], 201);
    }

    /**
     * GET /api/feedback
     * Admin/Staff route to list all feedback records.
     */
    public function index(Request $request)
    {
        $feedbacks = Feedback::with('user:id,username,first_name,last_name,email')
            ->orderByDesc('created_at')
            ->get();

        return response()->json($feedbacks);
    }

    /**
     * GET /api/feedback/summary
     * Returns aggregate stats for the admin dashboard.
     */
    public function summary(Request $request)
    {
        $feedbacks = Feedback::all();
        $total = $feedbacks->count();
        $avg = $total > 0 ? round($feedbacks->avg('rating'), 1) : 0;
        $promoters  = $feedbacks->filter(fn($f) => $f->rating >= 9)->count();
        $passives   = $feedbacks->filter(fn($f) => $f->rating >= 7 && $f->rating < 9)->count();
        $detractors = $feedbacks->filter(fn($f) => $f->rating < 7)->count();
        $nps = $total > 0 ? round((($promoters - $detractors) / $total) * 100) : 0;

        return response()->json([
            'total'      => $total,
            'avg_rating' => $avg,
            'promoters'  => $promoters,
            'passives'   => $passives,
            'detractors' => $detractors,
            'nps'        => $nps,
        ]);
    }
}
