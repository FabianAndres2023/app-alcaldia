package gov.tulua.app;

import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.webkit.WebSettings;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
  }

  @Override
  public void onStart() { // ← debe ser public
    super.onStart();

    // Asegura que el Bridge y el WebView ya están listos
    new Handler(Looper.getMainLooper()).post(() -> {
      if (getBridge() == null) return;
      WebView webView = getBridge().getWebView();
      if (webView == null) return;

      WebSettings ws = webView.getSettings();

      // User-Agent de escritorio
      String desktopUA =
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        + "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

      try {
        ws.setUserAgentString(desktopUA);
        ws.setUseWideViewPort(true);
        ws.setLoadWithOverviewMode(true);
        ws.setSupportZoom(true);
        ws.setBuiltInZoomControls(true);
        ws.setDisplayZoomControls(false);
      } catch (Throwable ignore) {
        // Evita crasheos si algún fabricante limita ajustes
      }
    });
  }
}
