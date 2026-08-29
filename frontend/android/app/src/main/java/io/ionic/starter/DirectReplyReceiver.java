package io.ionic.starter;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.os.Bundle;
import android.util.Log;

import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.app.RemoteInput;

import org.json.JSONObject;

import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

public class DirectReplyReceiver extends BroadcastReceiver {
    private static final String TAG = "DirectReplyReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        Bundle remoteInput = RemoteInput.getResultsFromIntent(intent);
        if (remoteInput == null) {
            return;
        }

        CharSequence replyTextChar = remoteInput.getCharSequence(FordaGoFirebaseMessagingService.KEY_TEXT_REPLY);
        if (replyTextChar == null || replyTextChar.toString().trim().isEmpty()) {
            return;
        }

        final String replyText = replyTextChar.toString().trim();
        final String conversationId = intent.getStringExtra("conversationId");
        final int notificationId = intent.getIntExtra("notificationId", (int) System.currentTimeMillis());
        final String senderTitle = intent.getStringExtra("senderTitle");

        if (conversationId == null) {
            return;
        }

        // Show immediate visual confirmation on the notification banner
        NotificationCompat.Builder repliedBuilder = new NotificationCompat.Builder(context, FordaGoFirebaseMessagingService.CHANNEL_ID)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle(senderTitle != null ? senderTitle : "FordaGo")
            .setContentText("You: " + replyText)
            .setColor(Color.parseColor("#FFD700"))
            .setTimeoutAfter(3000);

        NotificationManagerCompat notificationManager = NotificationManagerCompat.from(context);
        try {
            notificationManager.notify(notificationId, repliedBuilder.build());
        } catch (Exception e) {
            Log.w(TAG, "Failed to update reply notification", e);
        }

        // Send message in background thread to backend
        new Thread(() -> {
            try {
                SharedPreferences[] prefSources = new SharedPreferences[] {
                    context.getSharedPreferences("CapacitorStorage", Context.MODE_PRIVATE),
                    android.preference.PreferenceManager.getDefaultSharedPreferences(context)
                };

                String token = null;
                for (SharedPreferences p : prefSources) {
                    if (p == null) continue;
                    if (token == null) token = p.getString("token", null);
                    if (token == null) token = p.getString("_cap_token", null);
                    if (token == null) token = p.getString("auth_token", null);
                    if (token == null) token = p.getString("_cap_auth_token", null);
                    if (token != null) break;
                }

                if (token == null) {
                    Log.e(TAG, "Cannot send reply: Auth token is missing in SharedPreferences.");
                    return;
                }

                // Remove surrounding quotes or backslashes if stored via JSON
                token = token.trim();
                if (token.startsWith("\"") && token.endsWith("\"") && token.length() > 2) {
                    token = token.substring(1, token.length() - 1);
                }
                if (token.startsWith("Bearer ")) {
                    token = token.substring(7);
                }

                URL url = new URL("http://168.144.141.27:8000/api/conversations/" + conversationId + "/messages");
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("POST");
                conn.setRequestProperty("Content-Type", "application/json; charset=UTF-8");
                conn.setRequestProperty("Accept", "application/json");
                conn.setRequestProperty("Authorization", "Bearer " + token);
                conn.setDoOutput(true);
                conn.setConnectTimeout(10000);
                conn.setReadTimeout(10000);

                JSONObject jsonBody = new JSONObject();
                jsonBody.put("body", replyText);
                jsonBody.put("type", "text");

                byte[] input = jsonBody.toString().getBytes(StandardCharsets.UTF_8);
                try (OutputStream os = conn.getOutputStream()) {
                    os.write(input, 0, input.length);
                    os.flush();
                }

                int responseCode = conn.getResponseCode();
                Log.d(TAG, "Direct reply POST status: " + responseCode);

                if (responseCode >= 200 && responseCode < 300) {
                    Log.i(TAG, "Direct reply sent successfully!");
                } else {
                    Log.w(TAG, "Direct reply HTTP error: " + responseCode);
                }
                conn.disconnect();
            } catch (Exception e) {
                Log.e(TAG, "Failed to send direct reply via HTTP", e);
            }
        }).start();
    }
}
