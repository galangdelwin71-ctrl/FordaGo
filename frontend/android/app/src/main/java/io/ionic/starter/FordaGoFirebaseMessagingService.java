package io.ionic.starter;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.os.Build;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.app.RemoteInput;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

import org.json.JSONObject;

import java.util.Map;

public class FordaGoFirebaseMessagingService extends FirebaseMessagingService {
    private static final String TAG = "FordaGoFCM";
    public static final String CHANNEL_ID = "fordago-alerts-v3";
    public static final String CHANNEL_NAME = "FordaGo Notifications";
    public static final String KEY_TEXT_REPLY = "key_text_reply";

    @Override
    public void onMessageReceived(@NonNull RemoteMessage remoteMessage) {
        super.onMessageReceived(remoteMessage);

        Map<String, String> data = remoteMessage.getData();
        String title = data.get("title");
        String body = data.get("body");

        if (title == null && remoteMessage.getNotification() != null) {
            title = remoteMessage.getNotification().getTitle();
        }
        if (body == null && remoteMessage.getNotification() != null) {
            body = remoteMessage.getNotification().getBody();
        }

        if (title == null) title = "FordaGo";
        if (body == null) body = "New message";

        String type = data.get("type");
        String conversationIdStr = data.get("conversationId");

        // Check if this is a chat message and whether the conversation is MUTED or SNOOZED
        if ("chat".equals(type) && conversationIdStr != null) {
            if (isConversationMuted(conversationIdStr)) {
                Log.d(TAG, "Notification suppressed: Conversation " + conversationIdStr + " is muted or snoozed.");
                return;
            }
        }

        showNotification(title, body, data);
    }

    private boolean isConversationMuted(String conversationIdStr) {
        try {
            SharedPreferences prefs = getSharedPreferences("CapacitorStorage", Context.MODE_PRIVATE);
            String raw = prefs.getString("fordago_mute_convo_" + conversationIdStr, null);
            if (raw == null) {
                raw = prefs.getString("mute_convo_" + conversationIdStr, null);
            }
            if (raw == null) return false;

            JSONObject obj = new JSONObject(raw);
            if (obj.has("mutedUntil")) {
                Object mutedUntilObj = obj.get("mutedUntil");
                if ("infinite".equals(mutedUntilObj) || "forever".equals(mutedUntilObj)) {
                    return true;
                }
                if (mutedUntilObj instanceof Number) {
                    long until = ((Number) mutedUntilObj).longValue();
                    if (System.currentTimeMillis() < until) {
                        return true;
                    }
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Error checking mute status", e);
        }
        return false;
    }

    private void showNotification(String title, String body, Map<String, String> data) {
        createNotificationChannel();

        String type = data.get("type");
        String conversationIdStr = data.get("conversationId");
        int notifId = (int) (System.currentTimeMillis() % 1000000000);
        if (conversationIdStr != null) {
            try {
                notifId = Integer.parseInt(conversationIdStr) * 1000 + (int) (System.currentTimeMillis() % 1000);
            } catch (Exception ignored) {}
        }

        // Tap action: open MainActivity
        Intent intent = new Intent(this, MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        for (Map.Entry<String, String> entry : data.entrySet()) {
            intent.putExtra(entry.getKey(), entry.getValue());
        }
        if (conversationIdStr != null) {
            intent.putExtra("conversationId", conversationIdStr);
            intent.putExtra("targetRoute", "/chat/" + conversationIdStr);
        }

        PendingIntent pendingIntent = PendingIntent.getActivity(
            this,
            notifId,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0)
        );

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle(title)
            .setContentText(body)
            .setAutoCancel(true)
            .setColor(Color.parseColor("#FFD700"))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setDefaults(NotificationCompat.DEFAULT_ALL)
            .setContentIntent(pendingIntent);

        // If chat message, add DIRECT REPLY action!
        if ("chat".equals(type) && conversationIdStr != null) {
            RemoteInput remoteInput = new RemoteInput.Builder(KEY_TEXT_REPLY)
                .setLabel("Reply...")
                .build();

            Intent replyIntent = new Intent(this, DirectReplyReceiver.class);
            replyIntent.setAction("io.ionic.starter.ACTION_DIRECT_REPLY");
            replyIntent.putExtra("conversationId", conversationIdStr);
            replyIntent.putExtra("notificationId", notifId);
            replyIntent.putExtra("senderTitle", title);

            PendingIntent replyPendingIntent = PendingIntent.getBroadcast(
                this,
                notifId,
                replyIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S ? PendingIntent.FLAG_MUTABLE : 0)
            );

            NotificationCompat.Action replyAction = new NotificationCompat.Action.Builder(
                R.mipmap.ic_launcher,
                "Reply",
                replyPendingIntent
            )
            .addRemoteInput(remoteInput)
            .setAllowGeneratedReplies(true)
            .build();

            builder.addAction(replyAction);
        }

        NotificationManagerCompat notificationManager = NotificationManagerCompat.from(this);
        try {
            notificationManager.notify(notifId, builder.build());
        } catch (SecurityException e) {
            Log.w(TAG, "Notification permission missing", e);
        }
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                CHANNEL_NAME,
                NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("Notifications for chat messages and workouts");
            channel.enableLights(true);
            channel.setLightColor(Color.YELLOW);
            channel.enableVibration(true);

            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }
}
