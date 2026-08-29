package io.ionic.starter;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.BitmapShader;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Rect;
import android.graphics.Shader;
import android.graphics.Typeface;
import android.os.Build;
import android.util.Base64;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.app.Person;
import androidx.core.app.RemoteInput;
import androidx.core.graphics.drawable.IconCompat;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

import org.json.JSONObject;

import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
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
        if (conversationIdStr == null || conversationIdStr.trim().isEmpty()) {
            return false;
        }
        try {
            SharedPreferences[] prefSources = new SharedPreferences[] {
                getSharedPreferences("CapacitorStorage", Context.MODE_PRIVATE),
                android.preference.PreferenceManager.getDefaultSharedPreferences(this)
            };

            String[] keyPatterns = new String[] {
                "fordago_mute_convo_" + conversationIdStr,
                "_cap_fordago_mute_convo_" + conversationIdStr,
                "mute_convo_" + conversationIdStr,
                "_cap_mute_convo_" + conversationIdStr
            };

            for (SharedPreferences prefs : prefSources) {
                if (prefs == null) continue;
                for (String k : keyPatterns) {
                    String raw = prefs.getString(k, null);
                    if (raw != null && !raw.trim().isEmpty()) {
                        try {
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
                            if (obj.optBoolean("isMuted", false)) {
                                return true;
                            }
                        } catch (Exception ignored) {}
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

        // If chat message, format with Messenger-style MessagingStyle + Sender Avatar + Direct Reply
        if ("chat".equals(type) && conversationIdStr != null) {
            String senderName = data.get("senderName");
            if (senderName == null || senderName.trim().isEmpty()) {
                senderName = title;
            }
            String senderAvatarUrl = data.get("senderAvatar");

            Bitmap rawAvatar = fetchAvatarBitmap(senderAvatarUrl);
            if (rawAvatar == null) {
                rawAvatar = createInitialAvatarBitmap(senderName);
            }

            Bitmap circularAvatar = getCircularBitmap(rawAvatar);

            Person sender = new Person.Builder()
                .setName(senderName)
                .setIcon(IconCompat.createWithBitmap(circularAvatar))
                .build();

            NotificationCompat.MessagingStyle messagingStyle = new NotificationCompat.MessagingStyle(sender)
                .setConversationTitle(null)
                .addMessage(body, System.currentTimeMillis(), sender);

            builder.setStyle(messagingStyle)
                   .setLargeIcon(circularAvatar);

            RemoteInput remoteInput = new RemoteInput.Builder(KEY_TEXT_REPLY)
                .setLabel("Reply...")
                .build();

            Intent replyIntent = new Intent(this, DirectReplyReceiver.class);
            replyIntent.setAction("io.ionic.starter.ACTION_DIRECT_REPLY");
            replyIntent.putExtra("conversationId", conversationIdStr);
            replyIntent.putExtra("notificationId", notifId);
            replyIntent.putExtra("senderTitle", senderName);

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

    private Bitmap fetchAvatarBitmap(String avatarUrl) {
        if (avatarUrl == null || avatarUrl.trim().isEmpty()) {
            return null;
        }

        avatarUrl = avatarUrl.trim();

        try {
            // Handle Base64 data URL
            if (avatarUrl.startsWith("data:image")) {
                int commaIdx = avatarUrl.indexOf(',');
                if (commaIdx != -1) {
                    String base64Data = avatarUrl.substring(commaIdx + 1);
                    byte[] decoded = Base64.decode(base64Data, Base64.DEFAULT);
                    return BitmapFactory.decodeByteArray(decoded, 0, decoded.length);
                }
            }

            // Handle relative storage path fallback
            if (avatarUrl.startsWith("/")) {
                avatarUrl = "http://168.144.141.27:8000" + avatarUrl;
            } else if (avatarUrl.startsWith("http://localhost") || avatarUrl.startsWith("http://127.0.0.1")) {
                avatarUrl = avatarUrl.replace("http://localhost:8000", "http://168.144.141.27:8000")
                                     .replace("http://127.0.0.1:8000", "http://168.144.141.27:8000")
                                     .replace("http://localhost", "http://168.144.141.27:8000")
                                     .replace("http://127.0.0.1", "http://168.144.141.27:8000");
            } else if (avatarUrl.startsWith("http://168.144.141.27/") && !avatarUrl.contains(":8000")) {
                avatarUrl = avatarUrl.replace("http://168.144.141.27/", "http://168.144.141.27:8000/");
            }

            // Handle HTTP/HTTPS URL with generous 5s network timeout
            URL url = new URL(avatarUrl);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setDoInput(true);
            conn.setInstanceFollowRedirects(true);
            conn.setConnectTimeout(5000);
            conn.setReadTimeout(5000);
            conn.setRequestProperty("User-Agent", "FordaGO-Android");
            conn.connect();

            int responseCode = conn.getResponseCode();
            if (responseCode >= 200 && responseCode < 300) {
                InputStream is = conn.getInputStream();
                Bitmap bitmap = BitmapFactory.decodeStream(is);
                is.close();
                conn.disconnect();
                return bitmap;
            }
            conn.disconnect();
            return null;
        } catch (Exception e) {
            Log.w(TAG, "Could not fetch avatar bitmap from " + avatarUrl + ": " + e.getMessage());
            return null;
        }
    }

    private Bitmap getCircularBitmap(Bitmap bitmap) {
        if (bitmap == null) return null;
        try {
            int width = bitmap.getWidth();
            int height = bitmap.getHeight();
            int size = Math.min(width, height);

            int x = (width - size) / 2;
            int y = (height - size) / 2;
            Bitmap squared = Bitmap.createBitmap(bitmap, x, y, size, size);

            Bitmap output = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888);
            Canvas canvas = new Canvas(output);
            Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG);
            BitmapShader shader = new BitmapShader(squared, Shader.TileMode.CLAMP, Shader.TileMode.CLAMP);
            paint.setShader(shader);

            float r = size / 2f;
            canvas.drawCircle(r, r, r, paint);
            return output;
        } catch (Exception e) {
            return bitmap;
        }
    }

    private Bitmap createInitialAvatarBitmap(String name) {
        int size = 192;
        Bitmap bitmap = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bitmap);

        // Gold circle background
        Paint bgPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        bgPaint.setColor(Color.parseColor("#FFD700"));
        canvas.drawCircle(size / 2f, size / 2f, size / 2f, bgPaint);

        String initial = (name != null && !name.trim().isEmpty())
            ? name.trim().substring(0, 1).toUpperCase()
            : "F";

        Paint textPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        textPaint.setColor(Color.parseColor("#121212"));
        textPaint.setTextSize(96);
        textPaint.setTypeface(Typeface.create(Typeface.DEFAULT, Typeface.BOLD));
        textPaint.setTextAlign(Paint.Align.CENTER);

        Rect bounds = new Rect();
        textPaint.getTextBounds(initial, 0, initial.length(), bounds);
        float y = (size / 2f) + (bounds.height() / 2f) - bounds.bottom;
        canvas.drawText(initial, size / 2f, y, textPaint);

        return bitmap;
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
