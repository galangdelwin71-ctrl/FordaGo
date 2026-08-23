<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CoachProfile;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ConversationController extends Controller
{
    /**
     * GET /api/conversations
     * List all conversations for the authenticated user (as coach or client).
     */
    public function index(Request $request)
    {
        $userId = $request->user()->id;

        $conversations = Conversation::with([
            'coach:id,username,first_name,last_name,profile_image',
            'coach.coachProfile',
            'client:id,username,first_name,last_name,profile_image',
            'latestMessage.sender:id,username,first_name,last_name',
        ])
        ->where(function ($q) use ($userId) {
            $q->where('coach_id', $userId)
              ->orWhere('client_id', $userId);
        })
        ->get();

        // Single aggregated query for all unread counts — replaces the old
        // N+1 loop (one Message::count() per conversation row).
        $conversationIds = $conversations->pluck('id');
        $unreadCounts = \DB::table('messages')
            ->select('conversation_id', \DB::raw('COUNT(*) as unread_count'))
            ->whereIn('conversation_id', $conversationIds)
            ->where('sender_id', '!=', $userId)
            ->whereNull('read_at')
            ->groupBy('conversation_id')
            ->pluck('unread_count', 'conversation_id');

        $result = $conversations->map(function ($convo) use ($userId, $unreadCounts) {
            $isCoach = ((int) $convo->coach_id === (int) $userId);
            $partner = $isCoach ? $convo->client : $convo->coach;

            return [
                'id'              => $convo->id,
                'coach_id'        => $convo->coach_id,
                'client_id'       => $convo->client_id,
                'is_coach'        => $isCoach,
                'status'          => $convo->status,
                'partner'         => $partner,
                'partner_role'    => $isCoach ? 'client' : 'coach',
                'latest_message'  => $convo->latestMessage,
                'unread_count'    => (int) ($unreadCounts[$convo->id] ?? 0),
                'updated_at'      => $convo->latestMessage?->created_at ?: $convo->updated_at,
            ];
        })
        ->sortByDesc('updated_at')
        ->values();

        return response()->json($result);
    }

    /**
     * POST /api/conversations/start
     * Find or create a conversation between the authenticated user and a partner.
     */
    public function start(Request $request)
    {
        $request->validate([
            'coach_id'        => 'nullable|integer',
            'client_id'       => 'nullable|integer',
            'target_user_id'  => 'nullable|integer',
        ]);

        $authId = $request->user()->id;
        $targetId = $request->input('coach_id')
            ?: $request->input('client_id')
            ?: $request->input('target_user_id');

        if (! $targetId) {
            return response()->json(['message' => 'Target coach or client ID is required.'], 400);
        }

        if ((int) $authId === (int) $targetId) {
            return response()->json(['message' => 'Cannot create a conversation with yourself.'], 400);
        }

        $targetUser = User::find($targetId);
        if (! $targetUser) {
            return response()->json(['message' => 'Target user not found.'], 404);
        }

        // Determine who is coach and who is client
        $authHasCoachProfile = CoachProfile::where('user_id', $authId)->exists();
        $targetHasCoachProfile = CoachProfile::where('user_id', $targetId)->exists();

        if ($authHasCoachProfile && ! $targetHasCoachProfile) {
            $coachId = $authId;
            $clientId = $targetId;
        } elseif ($targetHasCoachProfile && ! $authHasCoachProfile) {
            $coachId = $targetId;
            $clientId = $authId;
        } else {
            // Default: if coach_id explicitly given, use that
            if ($request->filled('coach_id') && (int) $request->input('coach_id') === (int) $targetId) {
                $coachId = $targetId;
                $clientId = $authId;
            } else {
                $coachId = $authId;
                $clientId = $targetId;
            }
        }

        // A client starting a fresh thread with a coach requires that
        // coach's approval (Requests tab). A coach reaching out to a
        // prospective client doesn't need to approve their own message —
        // that thread is active immediately. Only applies to brand-new
        // conversations; firstOrCreate() never touches the status of one
        // that already exists.
        $initialStatus = ((int) $authId === (int) $clientId)
            ? Conversation::STATUS_PENDING
            : Conversation::STATUS_ACTIVE;

        $conversation = Conversation::firstOrCreate(
            ['coach_id' => $coachId, 'client_id' => $clientId],
            ['status' => $initialStatus, 'created_at' => now(), 'updated_at' => now()]
        );

        $conversation->loadMissing([
            'coach:id,username,first_name,last_name,profile_image',
            'coach.coachProfile',
            'client:id,username,first_name,last_name,profile_image',
        ]);

        $isCoach = ((int) $conversation->coach_id === (int) $authId);

        return response()->json([
            'id'           => $conversation->id,
            'coach_id'     => $conversation->coach_id,
            'client_id'    => $conversation->client_id,
            'is_coach'     => $isCoach,
            'status'       => $conversation->status,
            'coach'        => $conversation->coach,
            'client'       => $conversation->client,
            'partner'      => $isCoach ? $conversation->client : $conversation->coach,
            'partner_role' => $isCoach ? 'client' : 'coach',
            'created_at'   => $conversation->created_at,
        ], 201);
    }

    /**
     * GET /api/conversations/{id}
     * Get single conversation details with permission check.
     */
    public function show(int $id, Request $request)
    {
        $userId = $request->user()->id;

        $conversation = Conversation::with([
            'coach:id,username,first_name,last_name,profile_image',
            'coach.coachProfile',
            'client:id,username,first_name,last_name,profile_image',
        ])->find($id);

        if (! $conversation) {
            return response()->json(['message' => 'Conversation not found.'], 404);
        }

        if ((int) $conversation->coach_id !== (int) $userId && (int) $conversation->client_id !== (int) $userId) {
            return response()->json(['message' => 'Unauthorized to view this conversation.'], 403);
        }

        $isCoach = ((int) $conversation->coach_id === (int) $userId);

        return response()->json([
            'id'           => $conversation->id,
            'coach_id'     => $conversation->coach_id,
            'client_id'    => $conversation->client_id,
            'is_coach'     => $isCoach,
            'status'       => $conversation->status,
            'coach'        => $conversation->coach,
            'client'       => $conversation->client,
            'partner'      => $isCoach ? $conversation->client : $conversation->coach,
            'partner_role' => $isCoach ? 'client' : 'coach',
            'created_at'   => $conversation->created_at,
        ]);
    }

    /**
     * POST /api/conversations/{id}/accept
     * Coach accepts a pending client request -> conversation becomes active
     * and shows up in the coach's normal Messages/My Clients list.
     */
    public function accept(int $id, Request $request)
    {
        $userId = $request->user()->id;

        $conversation = Conversation::find($id);
        if (! $conversation) {
            return response()->json(['message' => 'Conversation not found.'], 404);
        }

        if ((int) $conversation->coach_id !== (int) $userId) {
            return response()->json(['message' => 'Only the coach can accept this request.'], 403);
        }

        if (! $conversation->isPending()) {
            return response()->json([
                'message'      => 'This request is not pending.',
                'conversation' => $conversation,
            ], 400);
        }

        $conversation->update(['status' => Conversation::STATUS_ACTIVE]);

        Notification::create([
            'user_id' => $conversation->client_id,
            'title'   => 'Request Accepted',
            'message' => 'Your coach accepted your request. You can now chat and book sessions.',
        ]);

        return response()->json([
            'message'      => 'Request accepted.',
            'conversation' => $conversation,
        ]);
    }

    /**
     * POST /api/conversations/{id}/decline
     * Coach declines a pending client request. Kept (not deleted) for audit
     * — hidden from both sides' active lists by the frontend filtering on
     * status, same as ProposalController::cancel()'s 'expired' pattern.
     */
    public function decline(int $id, Request $request)
    {
        $userId = $request->user()->id;

        $conversation = Conversation::find($id);
        if (! $conversation) {
            return response()->json(['message' => 'Conversation not found.'], 404);
        }

        if ((int) $conversation->coach_id !== (int) $userId) {
            return response()->json(['message' => 'Only the coach can decline this request.'], 403);
        }

        if (! $conversation->isPending()) {
            return response()->json([
                'message'      => 'This request is not pending.',
                'conversation' => $conversation,
            ], 400);
        }

        $conversation->update(['status' => Conversation::STATUS_DECLINED]);

        return response()->json([
            'message'      => 'Request declined.',
            'conversation' => $conversation,
        ]);
    }

    /**
     * DELETE /api/conversations/{id}
     * Coach or client deletes/removes the conversation/client relationship.
     */
    public function destroy(int $id, Request $request)
    {
        $userId = $request->user()->id;

        $conversation = Conversation::find($id);
        if (! $conversation) {
            return response()->json(['message' => 'Conversation not found.'], 404);
        }

        if ((int) $conversation->coach_id !== (int) $userId && (int) $conversation->client_id !== (int) $userId) {
            return response()->json(['message' => 'Unauthorized to remove this client conversation.'], 403);
        }

        Message::where('conversation_id', $id)->delete();
        $conversation->delete();

        return response()->json(['message' => 'Client conversation removed successfully.']);
    }
}
