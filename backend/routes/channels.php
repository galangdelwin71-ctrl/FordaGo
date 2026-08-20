<?php

use App\Models\Conversation;
use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

/*
|--------------------------------------------------------------------------
| Broadcast Channels
|--------------------------------------------------------------------------
*/

// Deliberately NO 'prefix' => 'api' here -- this registers the auth
// endpoint at bare `/broadcasting/auth`, matching EchoService's
// authEndpoint (`${API_BASE_URL}/broadcasting/auth`, see api.config.ts's
// doc-comment) and config/cors.php's `paths` allowlist, which lists
// 'broadcasting/auth' as its own top-level entry (not 'api/broadcasting/auth').
// Adding an 'api' prefix here silently moves the real route to
// /api/broadcasting/auth while the frontend keeps requesting the
// un-prefixed path, so every channel subscription (ChatPage's Echo
// listener, coaching-panel unread badges, etc.) fails before ever
// reaching this file's authorization callbacks below.
// Sanctum's bearer-token guard (config/sanctum.php: falls back to the
// token guard when there's no 'web' session) authenticates fine here
// without the route needing to sit inside the api() route group.
Broadcast::routes(['middleware' => ['auth:sanctum']]);

// Private user channel (for personal notifications / alerts)
Broadcast::channel('user.{id}', function (User $user, $id) {
    return (int) $user->id === (int) $id;
});

// Private conversation channel (only the assigned coach & client can listen)
Broadcast::channel('conversation.{conversationId}', function (User $user, $conversationId) {
    $conversation = Conversation::find($conversationId);
    if (! $conversation) {
        return false;
    }

    return (int) $user->id === (int) $conversation->coach_id
        || (int) $user->id === (int) $conversation->client_id;
});
