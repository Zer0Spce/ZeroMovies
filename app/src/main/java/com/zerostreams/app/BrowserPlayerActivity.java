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
    private View remoteCursor;
    private float cursorX=-1,cursorY=-1;
    private boolean tvPlayer;
    private long lastPlayerGesture;
    private volatile boolean blockAds;
    private TextView status;
    private FrameLayout screen;
    private View fullscreen;
    private WebChromeClient.CustomViewCallback fullscreenCallback;
    @Override public void onCreate(Bundle saved) {
        super.onCreate(saved);boolean reader=getIntent().getBooleanExtra("reader",false);if(reader)setRequestedOrientation(android.content.pm.ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED);String address=getIntent().getStringExtra("url");if(address==null||!address.startsWith("https://")){finish();return;}
        tvPlayer=BuildConfig.TV&&!reader;
        blockAds=!reader&&getSharedPreferences("zero",MODE_PRIVATE).getBoolean("blockAds",true);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        LinearLayout root=new LinearLayout(this);root.setOrientation(LinearLayout.VERTICAL);root.setBackgroundColor(Color.BLACK);
        LinearLayout controls=new LinearLayout(this);Button back=new Button(this);back.setText("Back");back.setOnClickListener(v->finish());controls.addView(back);
        Button reload=new Button(this);reload.setText(reader?"Reload reader":"Reload player");reload.setOnClickListener(v->{status.setText(reader?"Loading reader…":"Loading player…");web.reload();});controls.addView(reload);
        if("vidstuck.xyz".equals(Uri.parse(address).getHost())){Button browser=new Button(this);browser.setText("Open browser");browser.setOnClickListener(v->{try{startActivity(new android.content.Intent(android.content.Intent.ACTION_VIEW,Uri.parse(address)));}catch(android.content.ActivityNotFoundException e){Toast.makeText(this,"No browser installed",Toast.LENGTH_LONG).show();}});controls.addView(browser);}
        if(!reader){Button ads=new Button(this);ads.setText(blockAds?"Ads blocked":"Blocking off");ads.setOnClickListener(v->{blockAds=!blockAds;getSharedPreferences("zero",MODE_PRIVATE).edit().putBoolean("blockAds",blockAds).apply();ads.setText(blockAds?"Ads blocked":"Blocking off");web.reload();});controls.addView(ads);}
        status=new TextView(this);status.setText(reader?"Loading reader…":"Loading player…");status.setTextColor(Color.WHITE);status.setTextSize(14);controls.addView(status,new LinearLayout.LayoutParams(0,-2,1));if(reader)root.addView(controls);
        web=new WebView(this);web.setOnTouchListener((v,event)->{if(event.getActionMasked()==android.view.MotionEvent.ACTION_DOWN)lastPlayerGesture=android.os.SystemClock.elapsedRealtime();return false;});CookieManager cookies=CookieManager.getInstance();cookies.setAcceptCookie(true);cookies.setAcceptThirdPartyCookies(web,"vidstuck.xyz".equals(Uri.parse(address).getHost()));WebSettings settings=web.getSettings();settings.setJavaScriptEnabled(true);settings.setDomStorageEnabled(true);settings.setMediaPlaybackRequiresUserGesture(false);settings.setAllowFileAccess(false);settings.setAllowContentAccess(false);settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);settings.setSupportMultipleWindows(false);settings.setJavaScriptCanOpenWindowsAutomatically(false);
        // No JavaScript/native bridge. Popups and top-level cross-site ad redirects stay closed.
        String host=Uri.parse(address).getHost();web.setWebViewClient(new WebViewClient(){
            @Override public boolean shouldOverrideUrlLoading(WebView v,WebResourceRequest request){return !"https".equals(request.getUrl().getScheme()) || (request.isForMainFrame()&&!java.util.Objects.equals(host,request.getUrl().getHost()));}
            @Override public WebResourceResponse shouldInterceptRequest(WebView v,WebResourceRequest request){if(blockAds&&!request.isForMainFrame()&&AdBlockRules.blocks(request.getUrl().getHost()))return new WebResourceResponse("text/plain","UTF-8",new java.io.ByteArrayInputStream(new byte[0]));return null;}
            @Override public void onPageFinished(WebView v,String url){CookieManager.getInstance().flush();status.setText(reader?"Publisher reader · use Back to return":"External player · use Back to return");}
            @Override public void onReceivedError(WebView v,WebResourceRequest request,WebResourceError error){if(request.isForMainFrame()){status.setText("Player unavailable. Reload or try again later.");if(!reader)Toast.makeText(BrowserPlayerActivity.this,"Player unavailable. Press Back and try again.",Toast.LENGTH_LONG).show();}}
        });
        web.setWebChromeClient(new WebChromeClient(){
            @Override public boolean onCreateWindow(WebView view,boolean dialog,boolean gesture,android.os.Message message){return false;}
            @Override public void onShowCustomView(View view,CustomViewCallback callback){if(tvPlayer||android.os.SystemClock.elapsedRealtime()-lastPlayerGesture>1500||fullscreen!=null){callback.onCustomViewHidden();return;}fullscreen=view;fullscreenCallback=callback;root.setVisibility(View.GONE);screen.addView(view,new FrameLayout.LayoutParams(-1,-1));}
            @Override public void onHideCustomView(){closeFullscreen();}
        });root.addView(web,new LinearLayout.LayoutParams(-1,0,1));screen=new FrameLayout(this);screen.setBackgroundColor(Color.BLACK);screen.addView(root,new FrameLayout.LayoutParams(-1,-1));if(tvPlayer){remoteCursor=new View(this);android.graphics.drawable.GradientDrawable dot=new android.graphics.drawable.GradientDrawable();dot.setShape(android.graphics.drawable.GradientDrawable.OVAL);dot.setColor(0xCC65E6CC);dot.setStroke(2,Color.WHITE);remoteCursor.setBackground(dot);remoteCursor.setImportantForAccessibility(View.IMPORTANT_FOR_ACCESSIBILITY_NO);remoteCursor.setVisibility(View.GONE);screen.addView(remoteCursor,new FrameLayout.LayoutParams(18,18));Toast.makeText(this,"Use arrow keys to move the pointer; OK selects player controls.",Toast.LENGTH_LONG).show();}setContentView(screen);if(!reader)hideSystemBars();web.loadUrl(address);web.requestFocus();
    }
    private void hideSystemBars(){getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_FULLSCREEN|View.SYSTEM_UI_FLAG_HIDE_NAVIGATION|View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY|View.SYSTEM_UI_FLAG_LAYOUT_STABLE|View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN|View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION);}
    @Override public void onWindowFocusChanged(boolean focused){super.onWindowFocusChanged(focused);if(focused&&!getIntent().getBooleanExtra("reader",false))hideSystemBars();}
    private void closeFullscreen(){if(fullscreen==null)return;screen.removeView(fullscreen);fullscreen=null;screen.getChildAt(0).setVisibility(View.VISIBLE);if(fullscreenCallback!=null){fullscreenCallback.onCustomViewHidden();fullscreenCallback=null;}}
    // Embedded desktop players often require mouse hover before exposing controls.
    // Keep their HTML controls visible on TV instead of replacing them with a native video surface.
    private void movePointer(int dx,int dy){
        if(web.getWidth()==0||web.getHeight()==0)return;
        if(cursorX<0){cursorX=web.getWidth()/2f;cursorY=web.getHeight()/2f;}
        float step=28*getResources().getDisplayMetrics().density;
        cursorX=Math.max(1,Math.min(web.getWidth()-1,cursorX+dx*step));
        cursorY=Math.max(1,Math.min(web.getHeight()-1,cursorY+dy*step));
        remoteCursor.setX(web.getLeft()+cursorX-9);remoteCursor.setY(web.getTop()+cursorY-9);remoteCursor.setVisibility(View.VISIBLE);
        long now=android.os.SystemClock.uptimeMillis();
        MotionEvent hover=MotionEvent.obtain(now,now,MotionEvent.ACTION_HOVER_MOVE,cursorX,cursorY,0);
        hover.setSource(android.view.InputDevice.SOURCE_MOUSE);web.dispatchGenericMotionEvent(hover);hover.recycle();
    }
    private void clickPointer(){
        movePointer(0,0);long now=android.os.SystemClock.uptimeMillis();
        MotionEvent down=MotionEvent.obtain(now,now,MotionEvent.ACTION_DOWN,cursorX,cursorY,0);
        MotionEvent up=MotionEvent.obtain(now,now+40,MotionEvent.ACTION_UP,cursorX,cursorY,0);
        web.dispatchTouchEvent(down);web.dispatchTouchEvent(up);down.recycle();up.recycle();
    }
    @Override public boolean dispatchKeyEvent(KeyEvent event){
        int key=event.getKeyCode();
        if(tvPlayer&&(key==KeyEvent.KEYCODE_DPAD_LEFT||key==KeyEvent.KEYCODE_DPAD_RIGHT||key==KeyEvent.KEYCODE_DPAD_UP||key==KeyEvent.KEYCODE_DPAD_DOWN||key==KeyEvent.KEYCODE_DPAD_CENTER||key==KeyEvent.KEYCODE_ENTER)){
            if(event.getAction()==KeyEvent.ACTION_DOWN){
                if(key==KeyEvent.KEYCODE_DPAD_CENTER||key==KeyEvent.KEYCODE_ENTER){if(event.getRepeatCount()==0)clickPointer();}
                else movePointer(key==KeyEvent.KEYCODE_DPAD_LEFT?-1:key==KeyEvent.KEYCODE_DPAD_RIGHT?1:0,key==KeyEvent.KEYCODE_DPAD_UP?-1:key==KeyEvent.KEYCODE_DPAD_DOWN?1:0);
            }return true;
        }
        if(event.getAction()==KeyEvent.ACTION_DOWN&&(key==KeyEvent.KEYCODE_DPAD_CENTER||key==KeyEvent.KEYCODE_ENTER))lastPlayerGesture=android.os.SystemClock.elapsedRealtime();
        return super.dispatchKeyEvent(event);
    }
    @Override public void onBackPressed(){if(fullscreen!=null)closeFullscreen();else super.onBackPressed();}
    @Override protected void onPause(){if(web!=null){CookieManager.getInstance().flush();web.onPause();}super.onPause();}
    @Override protected void onResume(){super.onResume();if(web!=null)web.onResume();}
    @Override protected void onDestroy(){if(web!=null){web.stopLoading();web.destroy();}super.onDestroy();}
}
