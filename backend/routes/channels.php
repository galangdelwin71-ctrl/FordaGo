<?php

use App\Models\Conversation;
use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

/*
|--------------------------------------------------------------------------
| Broadcast Channels
|--------------------------------------------------------------------------
*/

Broadcast::routes(['prefix' => 'api', 'middleware' => ['auth:sanctum']]);

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
