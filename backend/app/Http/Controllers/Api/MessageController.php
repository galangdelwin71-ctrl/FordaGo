<?php

namespace App\Http\Controllers\Api;

use App\Events\MessageSent;
use App\Events\MessagesRead;
use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\Message;
use Illuminate\Http\Request;

class MessageController extends Controller
{
    /**
     * GET /api/conversations/{conversationId}/messages
     * List all messages in a conversation, and mark incoming messages as read.
     */
    public function index(int $conversationId, Request $request)
    {
        $userId = $request->user()->id;

        $conversation = Conversation::find($conversationId);
        if (! $conversation) {
            return response()->json(['message' => 'Conversation not found.'], 404);
        }

        if ((int) $conversation->coach_id !== (int) $userId && (int) $conversation->client_id !== (int) $userId) {
            return response()->json(['message' => 'Unauthorized to view messages in this conversation.'], 403);
        }

        // Fetch messages with sender & proposal details
        $messages = Message::with([
            'sender:id,username,first_name,last_name,profile_image,role',
            'proposal.items',
            'proposal.coach:id,username,first_name,last_name,profile_image',
            'proposal.client:id,username,first_name,last_name,profile_image',
        ])
        ->where('conversation_id', $conversationId)
        ->orderBy('created_at', 'asc')
        ->get();

        // Mark unread messages sent by the partner as read
        $readNow = now();
        $affected = Message::where('conversation_id', $conversationId)
            ->where('sender_id', '!=', $userId)
            ->whereNull('read_at')
            ->update(['read_at' => $readNow]);

        if ($affected > 0) {
            try {
                broadcast(new MessagesRead($conversationId, $userId, $readNow->toISOString()));
            } catch (\Throwable $e) {
                \Log::warning('Broadcasting MessagesRead failed: ' . $e->getMessage());
            }
        }

        return response()->json($messages);
    }

    /**
     * POST /api/conversations/{conversationId}/messages
     * Send a new chat message in the conversation and broadcast via WebSocket.
     */
    public function store(int $conversationId, Request $request)
    {
        $request->validate([
            'body' => 'required|string|max:3000',
            'type' => 'nullable|in:text,proposal',
        ]);

        $userId = $request->user()->id;

        $conversation = Conversation::find($conversationId);
        if (! $conversation) {
            return response()->json(['message' => 'Conversation not found.'], 404);
        }

        if ((int) $conversation->coach_id !== (int) $userId && (int) $conversation->client_id !== (int) $userId) {
            return response()->json(['message' => 'Unauthorized to send messages in this conversation.'], 403);
        }

        if ($conversation->isDeclined()) {
            return response()->json(['message' => 'This conversation was declined and can no longer receive messages.'], 400);
        }

        // A coach replying to a pending request implicitly accepts it —
        // matches ConversationController::accept(), just without requiring
        // an extra tap when the coach just answers in chat.
        if ($conversation->isPending() && (int) $conversation->coach_id === (int) $userId) {
            $conversation->status = Conversation::STATUS_ACTIVE;
        }

        $message = Message::create([
            'conversation_id' => $conversationId,
            'sender_id'       => $userId,
            'body'            => trim($request->input('body')),
            'type'            => $request->input('type', 'text'),
        ]);

        // Touch conversation updated_at
        $conversation->touch();

        // Load relations for event broadcasting & response
        $message->load([
            'sender:id,username,first_name,last_name,profile_image,role',
            'proposal.items',
        ]);

        // Broadcast real-time message event via Laravel Reverb
        try {
            broadcast(new MessageSent($message));
        } catch (\Throwable $e) {
            // Log broadcast error but don't fail message delivery
            \Log::warning('Broadcasting MessageSent failed: ' . $e->getMessage());
        }

        return response()->json($message, 201);
    }

    /**
     * PATCH /api/conversations/{conversationId}/read
     * Mark all unread messages from partner as read.
     */
    public function markRead(int $conversationId, Request $request)
    {
        $userId = $request->user()->id;

        $conversation = Conversation::find($conversationId);
        if (! $conversation) {
            return response()->json(['message' => 'Conversation not found.'], 404);
        }

        if ((int) $conversation->coach_id !== (int) $userId && (int) $conversation->client_id !== (int) $userId) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $readNow = now();
        $affected = Message::where('conversation_id', $conversationId)
            ->where('sender_id', '!=', $userId)
            ->whereNull('read_at')
            ->update(['read_at' => $readNow]);

        if ($affected > 0) {
            try {
                broadcast(new MessagesRead($conversationId, $userId, $readNow->toISOString()))->toOthers();
            } catch (\Throwable $e) {
                \Log::warning('Broadcasting MessagesRead failed: ' . $e->getMessage());
            }
        }

        return response()->json([
            'message' => 'Marked as read.',
            'count'   => $affected,
        ]);
    }
}
