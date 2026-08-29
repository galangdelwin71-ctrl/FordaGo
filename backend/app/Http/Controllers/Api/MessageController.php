<?php

namespace App\Http\Controllers\Api;

use App\Events\MessageSent;
use App\Events\MessagesRead;
use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\Message;
use App\Services\FcmService;
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

        // Fetch latest 100 messages with sender & proposal details.
        // Omit profile_image from sender since avatars are 125KB base64 strings
        // and only the chat header displays the partner avatar.
        $messages = Message::with([
            'sender:id,username,first_name,last_name,role',
            'proposal.items',
            'proposal.coach:id,username,first_name,last_name',
            'proposal.client:id,username,first_name,last_name',
        ])
        ->where('conversation_id', $conversationId)
        ->orderBy('created_at', 'desc')
        ->limit(100)
        ->get()
        ->reverse()
        ->values();

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
            'sender.coachProfile',
            'proposal.items',
        ]);

        // Execute broadcast and FCM push in terminating lifecycle so the HTTP response
        // is delivered to the sender immediately (5ms response time) without any lag.
        app()->terminating(function () use ($message, $conversation, $userId, $conversationId) {
            // 1. Broadcast real-time message event via Laravel Reverb
            try {
                broadcast(new MessageSent($message));
            } catch (\Throwable $e) {
                \Log::warning('Broadcasting MessageSent failed: ' . $e->getMessage());
            }

            // 2. Send FCM push notification to the RECIPIENT's device
            try {
                $recipientId = (int) $conversation->coach_id === (int) $userId
                    ? $conversation->client_id
                    : $conversation->coach_id;

                $recipient = \App\Models\User::find($recipientId);
                if ($recipient && $recipient->fcm_token) {
                    $senderName = trim(($message->sender->first_name ?? '') . ' ' . ($message->sender->last_name ?? ''));
                    if (! $senderName) {
                        $senderName = $message->sender->username ?? 'FordaGO';
                    }

                    $preview = mb_strlen($message->body) > 80
                        ? mb_substr($message->body, 0, 80) . '…'
                        : $message->body;

                    $senderAvatarRaw = $message->sender->profile_image ?: ($message->sender->coachProfile?->photo_url ?? '');
                    $senderAvatar = \App\Services\AvatarService::getFullUrl($senderAvatarRaw, $message->sender_id);

                    app(FcmService::class)->sendToToken(
                        $recipient->fcm_token,
                        $senderName,
                        $preview,
                        [
                            'type'           => 'chat',
                            'conversationId' => (string) $conversationId,
                            'targetRoute'    => '/chat/' . $conversationId,
                            'senderName'     => $senderName,
                            'senderAvatar'   => $senderAvatar ?: '',
                        ]
                    );
                }
            } catch (\Throwable $e) {
                \Log::warning('FCM push failed for chat message: ' . $e->getMessage());
            }
        });

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
