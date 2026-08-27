<?php

namespace App\Events;

use App\Models\Notification;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Broadcast on user.{id} (or notifications.global for broadcasts) whenever a
 * new server notification is persisted so the Ionic frontend can update its
 * notification list and badge count in real-time via WebSocket.
 */
class NotificationSent implements ShouldBroadcast
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
     * Broadcast on the recipient's private channel or public announcements channel.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        if (! $this->userId) {
            return [
                new Channel('notifications.global'),
            ];
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
