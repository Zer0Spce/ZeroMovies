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
    private volatile boolean blockAds;
    private TextView status;
    private FrameLayout screen;
    private View fullscreen;
    private WebChromeClient.CustomViewCallback fullscreenCallback;
    @Override public void onCreate(Bundle saved) {
        super.onCreate(saved);boolean reader=getIntent().getBooleanExtra("reader",false);if(reader)setRequestedOrientation(android.content.pm.ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED);String address=getIntent().getStringExtra("url");if(address==null||!address.startsWith("https://")){finish();return;}
        blockAds=!reader&&getSharedPreferences("zero",MODE_PRIVATE).getBoolean("blockAds",true);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        LinearLayout root=new LinearLayout(this);root.setOrientation(LinearLayout.VERTICAL);root.setBackgroundColor(Color.BLACK);
        LinearLayout controls=new LinearLayout(this);Button back=new Button(this);back.setText("Back");back.setOnClickListener(v->finish());controls.addView(back);
        Button reload=new Button(this);reload.setText(reader?"Reload reader":"Reload player");reload.setOnClickListener(v->{status.setText(reader?"Loading reader…":"Loading player…");web.reload();});controls.addView(reload);
        if(!reader){Button ads=new Button(this);ads.setText(blockAds?"Ads blocked":"Blocking off");ads.setOnClickListener(v->{blockAds=!blockAds;getSharedPreferences("zero",MODE_PRIVATE).edit().putBoolean("blockAds",blockAds).apply();ads.setText(blockAds?"Ads blocked":"Blocking off");web.reload();});controls.addView(ads);}
        status=new TextView(this);status.setText(reader?"Loading reader…":"Loading player…");status.setTextColor(Color.WHITE);status.setTextSize(14);controls.addView(status,new LinearLayout.LayoutParams(0,-2,1));root.addView(controls);
        web=new WebView(this);WebSettings settings=web.getSettings();settings.setJavaScriptEnabled(true);settings.setDomStorageEnabled(true);settings.setMediaPlaybackRequiresUserGesture(false);settings.setAllowFileAccess(false);settings.setAllowContentAccess(false);settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);settings.setSupportMultipleWindows(false);settings.setJavaScriptCanOpenWindowsAutomatically(false);
        // No JavaScript/native bridge. Popups and top-level cross-site ad redirects stay closed.
        String host=Uri.parse(address).getHost();web.setWebViewClient(new WebViewClient(){
            @Override public boolean shouldOverrideUrlLoading(WebView v,WebResourceRequest request){return !"https".equals(request.getUrl().getScheme()) || (request.isForMainFrame()&&!java.util.Objects.equals(host,request.getUrl().getHost()));}
            @Override public WebResourceResponse shouldInterceptRequest(WebView v,WebResourceRequest request){if(blockAds&&!request.isForMainFrame()&&AdBlockRules.blocks(request.getUrl().getHost()))return new WebResourceResponse("text/plain","UTF-8",new java.io.ByteArrayInputStream(new byte[0]));return null;}
            @Override public void onPageFinished(WebView v,String url){status.setText(reader?"Publisher reader · use Back to return":"External player · use Back to change server");}
            @Override public void onReceivedError(WebView v,WebResourceRequest request,WebResourceError error){if(request.isForMainFrame())status.setText("Player unavailable. Try another server.");}
        });
        web.setWebChromeClient(new WebChromeClient(){
            @Override public boolean onCreateWindow(WebView view,boolean dialog,boolean gesture,android.os.Message message){return false;}
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
