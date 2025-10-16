package gov.tulua.app;

import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.content.Intent;
import androidx.annotation.Nullable;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

  private static String pendingUrl = null; // ⚠️ Guarda URL temporal

  @Override
  protected void onCreate(@Nullable Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    handleNotificationIntent(getIntent());
  }

  @Override
  public void onStart() {
    super.onStart();

    // Configurar WebView
    new Handler(Looper.getMainLooper()).post(() -> {
      if (getBridge() == null) return;
      WebView webView = getBridge().getWebView();
      if (webView == null) return;

      WebSettings ws = webView.getSettings();
      ws.setUserAgentString(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        + "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      );
      ws.setUseWideViewPort(true);
      ws.setLoadWithOverviewMode(true);
      ws.setSupportZoom(true);
      ws.setBuiltInZoomControls(true);
      ws.setDisplayZoomControls(false);
    });

    // ⚡ Si hay una URL pendiente (notificación con app cerrada)
    if (pendingUrl != null && getBridge() != null) {
      String url = pendingUrl;
      pendingUrl = null;
      new Handler(Looper.getMainLooper()).postDelayed(() -> {
        getBridge().triggerWindowJSEvent(
          "notificationActionPerformed",
          "{ \"notification\": { \"data\": { \"url\": \"" + url + "\" } } }"
        );
      }, 1500); // espera a que cargue el WebView
    }
  }

  @Override
  protected void onNewIntent(Intent intent) {
    super.onNewIntent(intent);
    setIntent(intent);
    handleNotificationIntent(intent);
  }

  private void handleNotificationIntent(Intent intent) {
    if (intent != null && intent.getExtras() != null) {
      String url = intent.getExtras().getString("url", null);
      if (url != null) {
        if (getBridge() != null && getBridge().getWebView() != null) {
          // ✅ App abierta o background
          getBridge().triggerWindowJSEvent(
            "notificationActionPerformed",
            "{ \"notification\": { \"data\": { \"url\": \"" + url + "\" } } }"
          );
        } else {
          // 🚀 App cerrada → guardar URL temporalmente
          pendingUrl = url;
        }
      }
    }
  }
}
