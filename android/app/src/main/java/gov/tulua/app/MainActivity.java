package tulua.app;

import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.content.Intent;
import android.net.Uri;
import androidx.annotation.Nullable;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

  private static String pendingUrl = null; // ⚠️ Guarda la URL temporal si la app se abre desde notificación

  @Override
  protected void onCreate(@Nullable Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    handleNotificationIntent(getIntent()); // ✅ Captura el intent si viene de una notificación
  }

  @Override
  public void onStart() {
    super.onStart();

    // ⚙️ Configurar WebView
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

    // ⚡ Si hay una URL pendiente (por app cerrada)
    if (pendingUrl != null) {
      String url = pendingUrl;
      pendingUrl = null;
      openExternalUrl(url); // 🚀 abrir directamente el enlace
    }
  }

  @Override
  protected void onNewIntent(Intent intent) {
    super.onNewIntent(intent);
    setIntent(intent);
    handleNotificationIntent(intent); // 🔥 Captura nuevos intents (app ya abierta)
  }

  // 📩 Captura el intent que contiene la URL de la notificación
  private void handleNotificationIntent(Intent intent) {
    if (intent == null) return;

    Bundle extras = intent.getExtras();
    String url = null;

    if (extras != null) {
      // 🔍 Buscar URL en posibles claves
      if (extras.containsKey("url")) {
        url = extras.getString("url");
      } else if (extras.containsKey("link")) {
        url = extras.getString("link");
      } else if (extras.containsKey("gcm.notification.url")) {
        url = extras.getString("gcm.notification.url");
      }
    }

    // 🧭 También revisar si el intent trae datos directos
    if (url == null && intent.getData() != null) {
      url = intent.getDataString();
    }

    if (url != null && !url.trim().isEmpty()) {
      System.out.println("🔗 Notificación con URL detectada: " + url);

      if (getBridge() != null && getBridge().getWebView() != null) {
        // ✅ Si la app está abierta o en segundo plano → abrir directo
        openExternalUrl(url);
      } else {
        // 🚀 Si estaba cerrada → guardar URL para abrirla después
        pendingUrl = url;
      }
    }
  }

  // 🌐 Función para abrir la URL en el navegador externo
  private void openExternalUrl(String url) {
    try {
      Intent browserIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
      browserIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
      startActivity(browserIntent);
    } catch (Exception e) {
      System.out.println("❌ Error al abrir URL externa: " + e.getMessage());
    }
  }
}
