<?php

namespace App\Events;

use App\Models\Message;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageSent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Message $message;

    /**
     * Create a new event instance.
     */
    public function __construct(Message $message)
    {
        // Ensure relationships are loaded for frontend rendering
        $this->message = $message->loadMissing([
            'sender:id,username,first_name,last_name,profile_image,role',
            'proposal.items',
        ]);
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        $channels = [
            new PrivateChannel('conversation.' . $this->message->conversation_id),
        ];

        try {
            $conversation = $this->message->conversation;
            if ($conversation) {
                $recipientId = (int) $conversation->coach_id === (int) $this->message->sender_id
                    ? $conversation->client_id
                    : $conversation->coach_id;

                if ($recipientId) {
                    $channels[] = new PrivateChannel('user.' . $recipientId);
                }
            }
        } catch (\Throwable $e) {}

        return $channels;
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'message.sent';
    }

    /**
     * Get the data to broadcast.
     *
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'message' => $this->message->toArray(),
            'conversation_id' => $this->message->conversation_id,
        ];
    }
}
