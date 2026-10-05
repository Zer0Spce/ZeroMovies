package com.zerostreams.app;

import android.app.Activity;
import android.os.Bundle;
import android.view.*;
import android.webkit.*;
import android.widget.*;
import android.graphics.Color;
import android.net.Uri;

public class BrowserPlayerActivity extends Activity {
    private WebView web;
    private TextView status;
    private FrameLayout screen;
    private View fullscreen;
    private WebChromeClient.CustomViewCallback fullscreenCallback;
    @Override public void onCreate(Bundle saved) {
        super.onCreate(saved);String address=getIntent().getStringExtra("url");if(address==null||!address.startsWith("https://")){finish();return;}
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        LinearLayout root=new LinearLayout(this);root.setOrientation(LinearLayout.VERTICAL);root.setBackgroundColor(Color.BLACK);
        LinearLayout controls=new LinearLayout(this);Button back=new Button(this);back.setText("Back");back.setOnClickListener(v->finish());controls.addView(back);
        Button reload=new Button(this);reload.setText("Reload player");reload.setOnClickListener(v->{status.setText("Loading player…");web.reload();});controls.addView(reload);
        status=new TextView(this);status.setText("Loading player…");status.setTextColor(Color.WHITE);status.setTextSize(14);controls.addView(status,new LinearLayout.LayoutParams(0,-2,1));root.addView(controls);
        web=new WebView(this);WebSettings settings=web.getSettings();settings.setJavaScriptEnabled(true);settings.setDomStorageEnabled(true);settings.setMediaPlaybackRequiresUserGesture(false);settings.setAllowFileAccess(false);settings.setAllowContentAccess(false);settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);settings.setSupportMultipleWindows(false);settings.setJavaScriptCanOpenWindowsAutomatically(false);
        // No JavaScript/native bridge. Popups and top-level cross-site ad redirects stay closed.
        String host=Uri.parse(address).getHost();web.setWebViewClient(new WebViewClient(){
            @Override public boolean shouldOverrideUrlLoading(WebView v,WebResourceRequest request){return !"https".equals(request.getUrl().getScheme()) || (request.isForMainFrame()&&!java.util.Objects.equals(host,request.getUrl().getHost()));}
            @Override public void onPageFinished(WebView v,String url){status.setText("External player · use Back to change server");}
            @Override public void onReceivedError(WebView v,WebResourceRequest request,WebResourceError error){if(request.isForMainFrame())status.setText("Player unavailable. Try another server.");}
        });
        web.setWebChromeClient(new WebChromeClient(){
            @Override public void onShowCustomView(View view,CustomViewCallback callback){if(fullscreen!=null){callback.onCustomViewHidden();return;}fullscreen=view;fullscreenCallback=callback;root.setVisibility(View.GONE);screen.addView(view,new FrameLayout.LayoutParams(-1,-1));}
            @Override public void onHideCustomView(){closeFullscreen();}
        });root.addView(web,new LinearLayout.LayoutParams(-1,0,1));screen=new FrameLayout(this);screen.setBackgroundColor(Color.BLACK);screen.addView(root,new FrameLayout.LayoutParams(-1,-1));setContentView(screen);web.loadUrl(address);web.requestFocus();
    }
    private void closeFullscreen(){if(fullscreen==null)return;screen.removeView(fullscreen);fullscreen=null;screen.getChildAt(0).setVisibility(View.VISIBLE);if(fullscreenCallback!=null){fullscreenCallback.onCustomViewHidden();fullscreenCallback=null;}}
    @Override public void onBackPressed(){if(fullscreen!=null)closeFullscreen();else super.onBackPressed();}
    @Override protected void onPause(){if(web!=null)web.onPause();super.onPause();}
    @Override protected void onResume(){super.onResume();if(web!=null)web.onResume();}
    @Override protected void onDestroy(){if(web!=null){web.stopLoading();web.destroy();}super.onDestroy();}
}
