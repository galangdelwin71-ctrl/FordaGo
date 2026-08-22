<?php

namespace App\Events;

use App\Models\Notification;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Broadcast on user.{id} whenever a new server notification is persisted
 * so the Ionic frontend can update its notification list and badge count
 * in real-time via WebSocket instead of waiting for the 15s poll interval.
 */
class NotificationSent implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Notification $notification;
    /** The user_id to notify. NULL for broadcast notifications (sent to every user). */
    public ?int $userId;

    public function __construct(Notification $notification, ?int $userId)
    {
        $this->notification = $notification;
        $this->userId       = $userId;
    }

    /**
     * Broadcast on the recipient's private channel.
     * NULL user_id means it was a broadcast notification — skip WebSocket push
     * (the next poll will pick it up; every user's channel would need to be
     * enumerated otherwise, which is impractical).
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        if (! $this->userId) {
            return [];
        }

        return [
            new PrivateChannel('user.' . $this->userId),
        ];
    }

    public function broadcastAs(): string
    {
        return 'notification.sent';
    }

    /**
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'notification' => [
                'id'         => $this->notification->id,
                'title'      => $this->notification->title,
                'message'    => $this->notification->message,
                'is_read'    => (bool) $this->notification->is_read,
                'created_at' => $this->notification->created_at?->toISOString(),
            ],
        ];
    }
}
