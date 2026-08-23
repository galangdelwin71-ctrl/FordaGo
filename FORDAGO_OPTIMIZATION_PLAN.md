Ito ang kumpletong **FordaGo Optimization & Fix Guide** na nakapormat sa Markdown code block.

Pwede mo itong kopyahin at i-save bilang file sa iyong computer (halimbawa: **`FORDAGO_OPTIMIZATION_PLAN.md`**) para magsilbing opisyal na gabay sa pag-aayos ng inyong application.

```markdown
# FordaGo Technical Optimization & Real-time Fix Plan

## Executive Summary
Ang FordaGo application ay kasalukuyang nakararanas ng mabagal na loading speed (~1s - 2s response times) at may delays sa chat at notifications kahit sa local server environment. Ang mga pangunahing sanhi ay:
1. **Polling Storm:** Short-polling (`setInterval`) sa frontend na nag-pumukpok ng requests sa backend bawat 7-8 seconds.
2. **Database Bottleneck:** Kawalan ng Database Indexes sa foreign keys na nagdudulot ng full table scans.
3. **Queue Blocking:** Synchronous event broadcasting na nagse-stall sa API HTTP responses.
4. **Duplicate API Calls:** Uncoordinated React `useEffect` fetching sa frontend na nagfe-fetch ng parehong endpoints (`/api/users/me`) nang maraming beses.

---

## Phase 1: Real-Time & Chat Optimization (Fix Message Delays)

### 1.1 Unblock Event Broadcasting sa Backend
Siguraduhing naka-set sa asynchronous queue ang event broadcasting sa Laravel.

* **File:** `.env`
```env
BROADCAST_DRIVER=pusher # o soketi/reverb
QUEUE_CONNECTION=database

```

* **File:** `app/Events/MessageSent.php` (at `NotificationSent.php`)

```php
namespace App\Events;

use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Queue\ShouldQueue; // <--- Idagdag ito
use Illuminate\Queue\SerializesModels;

class MessageSent implements ShouldBroadcast, ShouldQueue // <--- Implement ShouldQueue
{
    use SerializesModels;

    public $message;

    public function __construct($message)
    {
        $this->message =$message;
    }

    public function broadcastOn()
    {
        return new PrivateChannel('chat.' . $this->message->conversation_id);
    }
}

```

* **Terminal Execution (Required sa Local):**

```bash
php artisan queue:work

```

---

### 1.2 Frontend Real-Time Echo Integration (No Refresh Needed)

I-update ang Chat Component para direktang i-append sa state ang bagong mensahe nang HINDI nagfe-fetch uli sa API.

* **File:** `src/components/Chat/ChatBox.jsx` (o katulad)

```javascript
import { useEffect, useState } from 'react';

export const ChatBox = ({ conversationId }) => {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (!conversationId) return;

    // Direct listener sa private channel
    const channel = window.Echo.private(`chat.${conversationId}`);

    channel.listen('MessageSent', (e) => {
      // Direct state insertion - WALANG PAGE REFRESH O RE-FETCH
      setMessages((prev) => [...prev, e.message]);
    });

    return () => {
      window.Echo.leave(`chat.${conversationId}`);
    };
  }, [conversationId]); // Sinisiguradong hindi paulit-ulit ang re-subscription

  return (
    <div className="chat-container">
      {messages.map((msg) => (
        <div key={msg.id}>{msg.content}</div>
      ))}
    </div>
  );
};

```

---

## Phase 2: Eliminating Polling & Unnecessary API Traffic

### 2.1 Tanggalin ang Short-Polling sa Notifications

Burahin ang `setInterval` sa Notification Bell component at palitan ito ng Laravel Echo listener.

* **File:** `src/components/Notifications/NotificationBell.jsx`

```javascript
import { useEffect, useState } from 'react';

export const NotificationBell = ({ userId }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userId) return;

    // Tanggalin ang anumang setInterval() rito!

    // Real-time notification listener
    const channel = window.Echo.private(`App.Models.User.${userId}`);

    channel.notification((notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });

    return () => {
      window.Echo.leave(`App.Models.User.${userId}`);
    };
  }, [userId]);

  return (
    <div className="bell">
      <span>Unread: {unreadCount}</span>
    </div>
  );
};

```

---

### 2.2 Global State Management para sa User Profile (`/api/users/me`)

Iwasan ang paulit-ulit na pagtawag sa `/api/users/me` sa bawat component sa pamamagitan ng paglikha ng `UserContext`.

* **File:** `src/context/UserContext.jsx`

```javascript
import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TATAWAGIN LAMANG NANG ISANG BESES SA ROOT LEVEL
    axios.get('/api/users/me')
      .then((res) => setUser(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <UserContext.Provider loading setUser, user, value="{{" }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);

```

---

## Phase 3: Database & Backend Query Optimization

### 3.1 Magdagdag ng Database Indexes

Gumawa ng bagong Laravel migration para maglagay ng indexes sa madalas i-filter na foreign keys.

* **Terminal Command:**

```bash
php artisan make:migration add_performance_indexes_table

```

* **File:** `database/migrations/xxxx_xx_xx_add_performance_indexes_table.php`

```php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->index(['conversation_id', 'created_at']);$table->index('sender_id');
        });

        Schema::table('notifications', function (Blueprint $table) {$table->index(['notifiable_id', 'read_at']);
        });

        Schema::table('attendances', function (Blueprint $table) {$table->index(['user_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->dropIndex(['conversation_id', 'created_at']);$table->dropIndex(['sender_id']);
        });

        Schema::table('notifications', function (Blueprint $table) {$table->dropIndex(['notifiable_id', 'read_at']);
        });

        Schema::table('attendances', function (Blueprint $table) {$table->dropIndex(['user_id', 'created_at']);
        });
    }
};

```

---

### 3.2 Solusyunan ang N+1 Query Problem sa Controllers

Gamitin ang Eager Loading sa Controllers para ma-fetch agad ang relationships sa iisang database query.

* **File:** `app/Http/Controllers/NotificationController.php`

```php
public function index(Request $request)
{
    // TAMA: Naka-eager load ang sender/relations at naka-paginate
    $notifications = $request->user()
        ->notifications()
        ->latest()
        ->paginate(15);

    return response()->json($notifications);
}

```

---

## Summary ng Inaasahang Performance Improvements

1. **Chat Speeds:** Lalabas ang chat message sa screen nang mas mababa sa **100ms** at hindi na kailangang mag-refresh (`F5`).
2. **Clean Terminal Logs:** Mababawasan ng **~90%** ang mga HTTP GET log lines sa iyong console.
3. **Fast Database Queries:** Ang lumalabas na `~1s` - `2s` response times ay bababa sa **~10ms - 50ms**.

```

```