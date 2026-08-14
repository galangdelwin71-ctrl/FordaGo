<?php

namespace App\Http\Controllers\Api;

use App\Events\MessageSent;
use App\Events\ProposalAccepted;
use App\Events\ProposalSent;
use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\Notification;
use App\Models\User;
use App\Models\WorkoutPlanItem;
use App\Models\WorkoutPlanProposal;
use App\Models\WorkoutSession;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProposalController extends Controller
{
    /**
     * GET /api/proposals
     * List all proposals for the authenticated user (as coach or client).
     */
    public function index(Request $request)
    {
        $userId = $request->user()->id;
        $status = $request->input('status'); // 'pending', 'accepted', 'expired', or null for all

        $query = WorkoutPlanProposal::with([
            'items',
            'coach:id,username,first_name,last_name,profile_image',
            'client:id,username,first_name,last_name,profile_image',
        ])
        ->where(function ($q) use ($userId) {
            $q->where('coach_id', $userId)
              ->orWhere('client_id', $userId);
        });

        if ($status && in_array($status, ['pending', 'accepted', 'expired'], true)) {
            $query->where('status', $status);
        }

        $proposals = $query->orderByDesc('created_at')->get();

        return response()->json($proposals);
    }

    /**
     * GET /api/proposals/{id}
     * Get specific proposal details.
     */
    public function show(int $id, Request $request)
    {
        $userId = $request->user()->id;

        $proposal = WorkoutPlanProposal::with([
            'items',
            'coach:id,username,first_name,last_name,profile_image',
            'client:id,username,first_name,last_name,profile_image',
        ])->find($id);

        if (! $proposal) {
            return response()->json(['message' => 'Proposal not found.'], 404);
        }

        if ((int) $proposal->coach_id !== (int) $userId && (int) $proposal->client_id !== (int) $userId) {
            return response()->json(['message' => 'Unauthorized to view this proposal.'], 403);
        }

        return response()->json($proposal);
    }

    /**
     * POST /api/proposals
     * Create a new workout plan proposal from coach to client.
     */
    public function store(Request $request)
    {
        $request->validate([
            'conversation_id'   => 'required|integer',
            'session_date'      => 'required|date',
            'time_val'          => 'required|string|max:10',
            'time_ampm'         => 'required|in:AM,PM,am,pm',
            'duration_minutes'  => 'required|integer|min:1',
            'price'             => 'required|numeric|min:0',
            'location'          => 'nullable|string|max:150',
            'items'             => 'required|array|min:1',
            'items.*.name'      => 'required|string|max:100',
            'items.*.sets'      => 'nullable|integer|min:0',
            'items.*.reps'      => 'nullable|integer|min:0',
            'items.*.description' => 'nullable|string|max:255',
        ]);

        $userId = $request->user()->id;
        $conversationId = (int) $request->input('conversation_id');

        $conversation = Conversation::find($conversationId);
        if (! $conversation) {
            return response()->json(['message' => 'Conversation not found.'], 404);
        }

        // Only the coach of this conversation can propose a workout plan
        if ((int) $conversation->coach_id !== (int) $userId) {
            return response()->json(['message' => 'Only the coach can create a workout proposal.'], 403);
        }

        $clientId = $conversation->client_id;

        $proposal = DB::transaction(function () use ($request, $conversation, $userId, $clientId) {
            // 1. Create chat message of type 'proposal'
            $message = Message::create([
                'conversation_id' => $conversation->id,
                'sender_id'       => $userId,
                'body'            => '📋 Proposed a new workout session plan.',
                'type'            => 'proposal',
            ]);

            // 2. Create the proposal record linked to the message
            $proposal = WorkoutPlanProposal::create([
                'conversation_id'  => $conversation->id,
                'coach_id'         => $userId,
                'client_id'        => $clientId,
                'session_date'     => $request->input('session_date'),
                'time_val'         => $request->input('time_val'),
                'time_ampm'        => strtoupper($request->input('time_ampm')),
                'duration_minutes' => (int) $request->input('duration_minutes'),
                'price'            => (float) $request->input('price'),
                'location'         => $request->input('location') ?: 'FordaGO Gym',
                'status'           => 'pending',
                'message_id'       => $message->id,
            ]);

            // 3. Insert proposal workout items
            $items = $request->input('items', []);
            foreach ($items as $index => $item) {
                WorkoutPlanItem::create([
                    'proposal_id' => $proposal->id,
                    'name'        => trim($item['name']),
                    'description' => $item['description'] ?? null,
                    'sets'        => (int) ($item['sets'] ?? 3),
                    'reps'        => (int) ($item['reps'] ?? 10),
                    'order'       => $index + 1,
                ]);
            }

            $conversation->touch();

            return $proposal;
        });

        // Load all relations
        $proposal->load([
            'items',
            'coach:id,username,first_name,last_name,profile_image',
            'client:id,username,first_name,last_name,profile_image',
            'message',
        ]);

        // Broadcast real-time events via Reverb
        try {
            if ($proposal->message) {
                broadcast(new MessageSent($proposal->message))->toOthers();
            }
            broadcast(new ProposalSent($proposal))->toOthers();
        } catch (\Throwable $e) {
            \Log::warning('Broadcast ProposalSent failed: ' . $e->getMessage());
        }

        return response()->json($proposal, 201);
    }

    /**
     * POST /api/proposals/{id}/accept
     * "Use" button logic: Client accepts the proposal -> updates status -> auto-creates WorkoutSession.
     */
    public function accept(int $id, Request $request)
    {
        $userId = $request->user()->id;

        $proposal = WorkoutPlanProposal::with(['items', 'coach', 'client'])->find($id);

        if (! $proposal) {
            return response()->json(['message' => 'Proposal not found.'], 404);
        }

        // Authorization: Only the assigned client can accept the proposal
        if ((int) $proposal->client_id !== (int) $userId) {
            return response()->json(['message' => 'Only the designated client can accept this proposal.'], 403);
        }

        if ($proposal->status === 'accepted') {
            return response()->json([
                'message'  => 'This proposal has already been accepted and added to your schedule.',
                'proposal' => $proposal,
            ]);
        }

        if ($proposal->status === 'expired') {
            return response()->json(['message' => 'This proposal has expired or was cancelled.'], 400);
        }

        $result = DB::transaction(function () use ($proposal, $userId) {
            // 1. Update proposal status
            $proposal->update([
                'status'      => 'accepted',
                'accepted_at' => now(),
            ]);

            // 2. Map proposal items into exercises JSON format expected by WorkoutSession
            $exercises = $proposal->items->map(function ($item) {
                return [
                    'name' => $item->name,
                    'sets' => (int) $item->sets,
                    'reps' => (int) $item->reps,
                    'done' => false,
                ];
            })->toArray();

            $coachUser = $proposal->coach;
            $coachName = trim(($coachUser->first_name ?? '') . ' ' . ($coachUser->last_name ?? ''))
                ?: ($coachUser->username ?? 'Coach');

            $clientSessionId = 'coach-plan-' . $proposal->id . '-' . time();
            $sessionTitle = 'Coaching Session w/ ' . $coachName;

            // 3. Auto-create WorkoutSession in workout_sessions table (personal tracker)
            $workoutSession = WorkoutSession::create([
                'user_id'           => $userId,
                'session_date'      => $proposal->session_date,
                'client_session_id' => $clientSessionId,
                'title'             => $sessionTitle,
                'is_rest_day'       => false,
                'status'            => 'upcoming',
                'exercises'         => $exercises,
                'actual_minutes'    => null,
                'time_val'          => $proposal->time_val,
                'time_ampm'         => $proposal->time_ampm,
                'location'          => $proposal->location ?: 'FordaGO Gym',
                'coach'             => $coachName,
                'custom_target'     => $proposal->duration_minutes . ' mins',
            ]);

            // 4. Create in-app notification for the coach
            $clientUser = $proposal->client;
            $clientName = trim(($clientUser->first_name ?? '') . ' ' . ($clientUser->last_name ?? ''))
                ?: ($clientUser->username ?? 'Client');

            Notification::create([
                'user_id' => $proposal->coach_id,
                'title'   => 'Proposal Accepted! 🎉',
                'message' => "{$clientName} accepted your workout proposal for {$proposal->session_date} ({$proposal->time_val} {$proposal->time_ampm}).",
            ]);

            return [
                'proposal'        => $proposal,
                'workout_session' => $workoutSession,
            ];
        });

        // Broadcast real-time ProposalAccepted event via Reverb
        try {
            broadcast(new ProposalAccepted($result['proposal']))->toOthers();
        } catch (\Throwable $e) {
            \Log::warning('Broadcast ProposalAccepted failed: ' . $e->getMessage());
        }

        return response()->json([
            'message'         => 'Proposal accepted! Workout session has been added to your schedule.',
            'proposal'        => $result['proposal'],
            'workout_session' => $result['workout_session'],
        ]);
    }

    /**
     * POST /api/proposals/{id}/cancel
     * Cancel or expire a proposal (by coach or client).
     */
    public function cancel(int $id, Request $request)
    {
        $userId = $request->user()->id;

        $proposal = WorkoutPlanProposal::find($id);

        if (! $proposal) {
            return response()->json(['message' => 'Proposal not found.'], 404);
        }

        if ((int) $proposal->coach_id !== (int) $userId && (int) $proposal->client_id !== (int) $userId) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        if ($proposal->status === 'accepted') {
            return response()->json(['message' => 'Cannot cancel an already accepted proposal.'], 400);
        }

        $proposal->update(['status' => 'expired']);

        return response()->json([
            'message'  => 'Proposal cancelled.',
            'proposal' => $proposal,
        ]);
    }
}
