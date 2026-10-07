package io.ionic.starter;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        createNotificationChannels();
    }

    @Override
    public void onStart() {
        super.onStart();
        if (bridge != null && bridge.getWebView() != null) {
            WebView webView = bridge.getWebView();
            WebSettings settings = webView.getSettings();
            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
            settings.setDomStorageEnabled(true);
            settings.setLoadsImagesAutomatically(true);
            settings.setMediaPlaybackRequiresUserGesture(false);
            settings.setJavaScriptCanOpenWindowsAutomatically(true);
            settings.setAllowFileAccess(true);
        }
    }

    private void createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager == null) return;

            // 1. High-priority real-time alerts & FCM background push channel
            NotificationChannel alertsChannel = new NotificationChannel(
                "fordago-alerts-v3",
                "FordaGO Alerts & Messages",
                NotificationManager.IMPORTANCE_HIGH
            );
            alertsChannel.setDescription("Real-time push notifications for chat messages, gym announcements, and updates");
            alertsChannel.enableLights(true);
            alertsChannel.setLightColor(Color.parseColor("#FFD700"));
            alertsChannel.enableVibration(true);
            alertsChannel.setLockscreenVisibility(android.app.Notification.VISIBILITY_PUBLIC);
            manager.createNotificationChannel(alertsChannel);

            // 2. High-priority workout reminders and alarms
            NotificationChannel alarmsChannel = new NotificationChannel(
                "fordago-alarms-v3",
                "FordaGO Workout Alarms & Reminders",
                NotificationManager.IMPORTANCE_HIGH
            );
            alarmsChannel.setDescription("Instant alerts and alarms for scheduled workouts, reminders, and gym updates");
            alarmsChannel.enableLights(true);
            alarmsChannel.setLightColor(Color.parseColor("#FFD700"));
            alarmsChannel.enableVibration(true);
            alarmsChannel.setLockscreenVisibility(android.app.Notification.VISIBILITY_PUBLIC);
            manager.createNotificationChannel(alarmsChannel);

            // 3. General notifications fallback
            NotificationChannel v2Channel = new NotificationChannel(
                "fordago-alerts-v2",
                "FordaGO Announcements",
                NotificationManager.IMPORTANCE_HIGH
            );
            v2Channel.setDescription("General gym announcements and account alerts");
            v2Channel.enableLights(true);
            v2Channel.setLightColor(Color.parseColor("#FFD700"));
            v2Channel.enableVibration(true);
            manager.createNotificationChannel(v2Channel);
        }
    }
}

