<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Feedback;
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
     */
    public function store(Request $request)
    {
        $request->validate([
            'rating' => 'required|integer|min:0|max:10',
            'reason' => 'nullable|string|max:1000',
        ]);

        $feedback = Feedback::create([
            'user_id' => $request->user()->id,
            'rating'  => (int) $request->input('rating'),
            'reason'  => $request->input('reason') ? trim((string) $request->input('reason')) : null,
        ]);

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
}
