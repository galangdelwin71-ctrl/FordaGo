<?php

namespace App\Events;

use App\Models\WorkoutPlanProposal;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ProposalSent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public WorkoutPlanProposal $proposal;

    /**
     * Create a new event instance.
     */
    public function __construct(WorkoutPlanProposal $proposal)
    {
        $this->proposal = $proposal->loadMissing([
            'items',
            'coach:id,username,first_name,last_name,profile_image',
            'client:id,username,first_name,last_name,profile_image',
        ]);
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('conversation.' . $this->proposal->conversation_id),
            new PrivateChannel('user.' . $this->proposal->client_id),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'proposal.sent';
    }

    /**
     * Get the data to broadcast.
     *
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'proposal' => $this->proposal->toArray(),
            'conversation_id' => $this->proposal->conversation_id,
        ];
    }
}
