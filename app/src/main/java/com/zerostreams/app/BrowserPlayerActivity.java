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
    private boolean tvPlayer;
    private String playerGuard;
    private TvMouse mouse;private PlayerAdScan adScan;private long lastProgressSaved;
    private long lastPlayerGesture;
    private long lastTvNavAt;
    private final PlayerBackState backState=new PlayerBackState();
    private volatile boolean blockAds;
    private TextView status;
    private FrameLayout screen;
    private View fullscreen;
    private WebChromeClient.CustomViewCallback fullscreenCallback;
    private final android.os.Handler tvUi=new android.os.Handler(android.os.Looper.getMainLooper());
    private boolean playerControlsVisible=true;
    private final Runnable controlsIdle=this::hidePlayerControls;

    @Override public void onCreate(Bundle saved) {
        super.onCreate(saved);
        boolean reader=getIntent().getBooleanExtra("reader",false);
        if(reader)setRequestedOrientation(android.content.pm.ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED);
        String address=getIntent().getStringExtra("url");
        if(address==null||!address.startsWith("https://")){finish();return;}
        tvPlayer=BuildConfig.TV&&!reader;
        if(tvPlayer){
            android.content.SharedPreferences prefs=getSharedPreferences("zero",MODE_PRIVATE);
            // Restore the v1.9 behavior the TV build originally shipped with: mouse mode starts enabled.
            if(!prefs.getBoolean("playerMouseDefaultV4",false))prefs.edit().putBoolean("playerMouse",true).putBoolean("playerMouseDefaultV4",true).apply();
        }
        blockAds=!reader&&getSharedPreferences("zero",MODE_PRIVATE).getBoolean("blockAds",true);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        LinearLayout root=new LinearLayout(this);root.setOrientation(LinearLayout.VERTICAL);root.setBackgroundColor(Color.BLACK);
        LinearLayout controls=new LinearLayout(this);
        Button back=new Button(this);back.setText("Back");back.setOnClickListener(v->finish());controls.addView(back);
        Button reload=new Button(this);reload.setText(reader?"Reload reader":"Reload player");reload.setOnClickListener(v->{status.setText(reader?"Loading reader…":"Loading player…");web.reload();});controls.addView(reload);
        if(PlaybackSources.trusted(address)){
            Button browser=new Button(this);browser.setText("Open browser");browser.setOnClickListener(v->{try{startActivity(new android.content.Intent(android.content.Intent.ACTION_VIEW,Uri.parse(address)));}catch(android.content.ActivityNotFoundException e){Toast.makeText(this,"No browser installed",Toast.LENGTH_LONG).show();}});controls.addView(browser);
        }
        if(!reader){
            Button ads=new Button(this);ads.setText(blockAds?"Ads blocked":"Blocking off");ads.setOnClickListener(v->{blockAds=!blockAds;getSharedPreferences("zero",MODE_PRIVATE).edit().putBoolean("blockAds",blockAds).apply();ads.setText(blockAds?"Ads blocked":"Blocking off");web.reload();});controls.addView(ads);
        }
        status=new TextView(this);status.setText(reader?"Loading reader…":"Loading player…");status.setTextColor(Color.WHITE);status.setTextSize(14);controls.addView(status,new LinearLayout.LayoutParams(0,-2,1));if(reader)root.addView(controls);

        web=new WebView(this);web.setBackgroundColor(Color.BLACK);
        web.setFocusable(true);web.setFocusableInTouchMode(true);
        web.setOnTouchListener((v,event)->{if(event.getActionMasked()==android.view.MotionEvent.ACTION_DOWN){backState.userActivity();lastPlayerGesture=android.os.SystemClock.elapsedRealtime();wakeControls();}return false;});
        CookieManager cookies=CookieManager.getInstance();cookies.setAcceptCookie(true);cookies.setAcceptThirdPartyCookies(web,PlaybackSources.trusted(address));
        WebSettings settings=web.getSettings();settings.setJavaScriptEnabled(true);settings.setDomStorageEnabled(true);settings.setMediaPlaybackRequiresUserGesture(false);settings.setAllowFileAccess(false);settings.setAllowContentAccess(false);settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);settings.setSupportMultipleWindows(false);settings.setJavaScriptCanOpenWindowsAutomatically(false);
        if(!reader&&PlaybackSources.trusted(address)){blockAds=true;installProgressListener();installPlayerExitListener();installPlayerGuard();adScan=new PlayerAdScan(this,web);}
        web.setWebViewClient(new WebViewClient(){
            @Override public boolean shouldOverrideUrlLoading(WebView v,WebResourceRequest request){if(tvPlayer&&request.isForMainFrame()&&request.hasGesture()&&java.util.Arrays.asList("vidstuck.xyz","vidsrc.sh").contains(request.getUrl().getHost())&&!String.valueOf(request.getUrl().getPath()).startsWith("/embed/")){finish();return true;}return (blockAds&&AdBlockRules.blocks(request.getUrl().getHost())) || !"https".equals(request.getUrl().getScheme()) || (request.isForMainFrame()&&!PlaybackSources.trusted(request.getUrl().toString()));}
            @Override public WebResourceResponse shouldInterceptRequest(WebView v,WebResourceRequest request){if(blockAds&&!request.isForMainFrame()&&AdBlockRules.blocks(request.getUrl().getHost()))return new WebResourceResponse("text/plain","UTF-8",new java.io.ByteArrayInputStream(new byte[0]));return null;}
            @Override public void onPageFinished(WebView v,String url){CookieManager.getInstance().flush();if(playerGuard!=null)v.evaluateJavascript(playerGuard,null);status.setText(reader?"Publisher reader · use Back to return":"External player · use Back to return");if(tvPlayer)wakeControls();}
            @Override public void onReceivedError(WebView v,WebResourceRequest request,WebResourceError error){if(request.isForMainFrame()){status.setText("Player unavailable. Reload or try again later.");if(!reader)Toast.makeText(BrowserPlayerActivity.this,"Player unavailable. Press Back and try again.",Toast.LENGTH_LONG).show();}}
        });
        web.setWebChromeClient(new WebChromeClient(){
            @Override public boolean onCreateWindow(WebView view,boolean dialog,boolean gesture,android.os.Message message){return false;}
            @Override public void onShowCustomView(View view,CustomViewCallback callback){if(tvPlayer||android.os.SystemClock.elapsedRealtime()-lastPlayerGesture>1500||fullscreen!=null){callback.onCustomViewHidden();return;}fullscreen=view;fullscreenCallback=callback;root.setVisibility(View.GONE);screen.addView(view,new FrameLayout.LayoutParams(-1,-1));}
            @Override public void onHideCustomView(){closeFullscreen();}
        });
        root.addView(web,new LinearLayout.LayoutParams(-1,0,1));screen=new FrameLayout(this);screen.setBackgroundColor(Color.BLACK);screen.addView(root,new FrameLayout.LayoutParams(-1,-1));
        if(tvPlayer){mouse=new TvMouse(this,web,screen,this::wakeControls);Toast.makeText(this,mouse.isMouseEnabled()?"Player mouse on · arrows move, OK selects · Menu toggles mouse":"D-pad navigation · arrows focus, OK selects · Menu toggles mouse",Toast.LENGTH_LONG).show();}
        setContentView(screen);if(!reader)hideSystemBars();web.loadUrl(address);web.requestFocus();
    }

    private void hideSystemBars(){getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_FULLSCREEN|View.SYSTEM_UI_FLAG_HIDE_NAVIGATION|View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY|View.SYSTEM_UI_FLAG_LAYOUT_STABLE|View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN|View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION);}
    @Override public void onWindowFocusChanged(boolean focused){super.onWindowFocusChanged(focused);if(focused&&!getIntent().getBooleanExtra("reader",false))hideSystemBars();}
    private void closeFullscreen(){if(fullscreen==null)return;screen.removeView(fullscreen);fullscreen=null;screen.getChildAt(0).setVisibility(View.VISIBLE);if(fullscreenCallback!=null){fullscreenCallback.onCustomViewHidden();fullscreenCallback=null;}}

    private boolean isBackKey(int key){return key==KeyEvent.KEYCODE_BACK||key==KeyEvent.KEYCODE_ESCAPE||key==KeyEvent.KEYCODE_BUTTON_B;}
    private boolean tvNavKey(int key){return key==KeyEvent.KEYCODE_DPAD_LEFT||key==KeyEvent.KEYCODE_DPAD_RIGHT||key==KeyEvent.KEYCODE_DPAD_UP||key==KeyEvent.KEYCODE_DPAD_DOWN||key==KeyEvent.KEYCODE_DPAD_CENTER||key==KeyEvent.KEYCODE_ENTER;}
    private String tvDirection(int key){switch(key){case KeyEvent.KEYCODE_DPAD_LEFT:return "left";case KeyEvent.KEYCODE_DPAD_RIGHT:return "right";case KeyEvent.KEYCODE_DPAD_UP:return "up";case KeyEvent.KEYCODE_DPAD_DOWN:return "down";case KeyEvent.KEYCODE_DPAD_CENTER:case KeyEvent.KEYCODE_ENTER:return "ok";default:return null;}}
    private void nativeTvFallback(KeyEvent event){if(web==null)return;KeyEvent copy=new KeyEvent(event);web.post(()->{if(web==null)return;int key=copy.getKeyCode();if((key==KeyEvent.KEYCODE_DPAD_CENTER||key==KeyEvent.KEYCODE_ENTER)&&copy.getAction()==KeyEvent.ACTION_UP){long now=android.os.SystemClock.uptimeMillis();web.dispatchKeyEvent(new KeyEvent(now,now,KeyEvent.ACTION_DOWN,key,0));web.dispatchKeyEvent(new KeyEvent(now,now+30,KeyEvent.ACTION_UP,key,0));}else web.dispatchKeyEvent(copy);});}
    @Override public boolean dispatchKeyEvent(KeyEvent event){
        int key=event.getKeyCode();
        if(isBackKey(key)&&!getIntent().getBooleanExtra("reader",false)){
            if(event.getAction()==KeyEvent.ACTION_UP&&!event.isCanceled())onBackPressed();
            return true;
        }
        if(tvPlayer){
            if(event.getAction()==KeyEvent.ACTION_DOWN&&key!=KeyEvent.KEYCODE_VOLUME_UP&&key!=KeyEvent.KEYCODE_VOLUME_DOWN){backState.userActivity();wakeControls();}
            // Mouse mode owns the D-pad completely when enabled. This must run before the focus navigator.
            if(mouse!=null&&mouse.handle(event))return true;
            if(tvNavKey(key)){
                String direction=tvDirection(key);boolean activate="ok".equals(direction);
                if(!activate&&event.getAction()==KeyEvent.ACTION_DOWN){long now=android.os.SystemClock.elapsedRealtime();if(event.getRepeatCount()>0&&now-lastTvNavAt<165)return true;lastTvNavAt=now;}
                boolean fire=(activate&&event.getAction()==KeyEvent.ACTION_UP)||(!activate&&event.getAction()==KeyEvent.ACTION_DOWN);
                if(fire&&direction!=null){
                    if(activate)lastPlayerGesture=android.os.SystemClock.elapsedRealtime();
                    final KeyEvent fallbackEvent=new KeyEvent(event);
                    // __zeroTvNavigate intentionally has no return value. Treat its existence as handled so the key is not sent twice.
                    String script="(function(){try{if(typeof window.__zeroTvNavigate==='function'){window.__zeroTvNavigate('"+direction+"');return true;}return false;}catch(e){return false;}})();";
                    web.evaluateJavascript(script,value->{if(!"true".equals(value))nativeTvFallback(fallbackEvent);});
                }
                return true;
            }
        }else if(event.getAction()==KeyEvent.ACTION_DOWN&&key!=KeyEvent.KEYCODE_VOLUME_UP&&key!=KeyEvent.KEYCODE_VOLUME_DOWN){backState.userActivity();}
        return super.dispatchKeyEvent(event);
    }

    private void markPlayerControlsVisible(){if(!tvPlayer)return;playerControlsVisible=true;tvUi.removeCallbacks(controlsIdle);tvUi.postDelayed(controlsIdle,3300);}
    private void hidePlayerControls(){if(!tvPlayer)return;playerControlsVisible=false;tvUi.removeCallbacks(controlsIdle);if(mouse!=null)mouse.stop();if(web!=null)web.evaluateJavascript("document.documentElement.classList.add('zero-player-idle');if(window.__zeroDismissMenus)window.__zeroDismissMenus();if(window.__zeroHidePlayerControls)window.__zeroHidePlayerControls();document.querySelectorAll('iframe').forEach(f=>{try{f.contentWindow.postMessage({type:'zerostreams-hide-controls'},'*');f.contentWindow.postMessage({type:'zerostreams-back-hide'},'*')}catch(_){}});",null);}
    private void wakeControls(){markPlayerControlsVisible();if(web!=null){web.requestFocus();web.evaluateJavascript("document.documentElement.classList.remove('zero-back-hide','zero-player-idle');if(window.__zeroRemoteActivity)window.__zeroRemoteActivity();window.postMessage({type:'zerostreams-remote-active'},'*');document.querySelectorAll('iframe').forEach(f=>{try{f.contentWindow.postMessage({type:'zerostreams-remote-active'},'*')}catch(_){}});",null);}}

    private void installPlayerExitListener(){
        if(!androidx.webkit.WebViewFeature.isFeatureSupported(androidx.webkit.WebViewFeature.WEB_MESSAGE_LISTENER))return;
        androidx.webkit.WebViewCompat.addWebMessageListener(web,"ZeroPlayer",new java.util.HashSet<>(java.util.Arrays.asList(PlaybackSources.ORIGINS)),(view,message,origin,mainFrame,reply)->{if(mainFrame&&PlaybackSources.trusted(origin.toString())&&"back".equals(message.getData()))finish();});
    }
    private void installProgressListener(){
        String parent=getIntent().getStringExtra("parent");if(parent==null||!parent.matches("tmdb-(movie|series)-[0-9]+"))return;
        if(!androidx.webkit.WebViewFeature.isFeatureSupported(androidx.webkit.WebViewFeature.WEB_MESSAGE_LISTENER))return;
        HistoryStore history=new HistoryStore(getSharedPreferences("zero",MODE_PRIVATE));String type=parent.startsWith("tmdb-series-")?"tv":"movie";
        androidx.webkit.WebViewCompat.addWebMessageListener(web,"ZeroProgress",new java.util.HashSet<>(java.util.Arrays.asList(PlaybackSources.ORIGINS)),(view,message,origin,mainFrame,reply)->{if(!PlaybackSources.trusted(origin.toString()))return;String data=message.getData();if(data==null||data.length()>4096)return;long now=android.os.SystemClock.elapsedRealtime();if(now-lastProgressSaved<2500)return;try{org.json.JSONObject event=new org.json.JSONObject(data);history.progress(parent,type,event);lastProgressSaved=now;}catch(org.json.JSONException ignored){}});
    }
    private void installPlayerGuard(){
        try(java.io.InputStream input=getAssets().open("player-guard.js");java.io.ByteArrayOutputStream output=new java.io.ByteArrayOutputStream()){
            byte[] buffer=new byte[4096];int count;while((count=input.read(buffer))!=-1)output.write(buffer,0,count);
            String tvBack=";(()=>{if(window.__zeroBackHideInstalled)return;window.__zeroBackHideInstalled=true;const selector='.jw-controlbar,.plyr__controls,.vjs-control-bar,[role=\\\"toolbar\\\"],[data-zero-controlbar],nav,header';const style=document.createElement('style');style.textContent='.zero-back-hide '+selector.replace(/,/g,',.zero-back-hide ')+'{opacity:0!important;visibility:hidden!important;pointer-events:none!important}.zero-tv-focused{outline:4px solid #65e6cc!important;outline-offset:4px!important;border-radius:9px!important;box-shadow:0 0 0 3px rgba(101,230,204,.24),0 0 22px rgba(101,230,204,.58)!important;filter:brightness(1.16)!important}';const install=()=>document.head&&document.head.appendChild(style);if(document.head)install();else document.addEventListener('DOMContentLoaded',install,{once:true});const show=()=>{document.documentElement.classList.remove('zero-back-hide','zero-player-idle');if(window.__zeroRemoteActivity)window.__zeroRemoteActivity();};const hide=()=>{document.documentElement.classList.add('zero-back-hide','zero-player-idle');document.querySelectorAll('iframe').forEach(f=>{try{f.contentWindow.postMessage({type:\\'zerostreams-back-hide\\'},'\\*');}catch(_){}});};window.__zeroHidePlayerControls=hide;window.addEventListener('message',e=>{if(e.data&&e.data.type==='zerostreams-back-hide')hide();if(e.data&&e.data.type==='zerostreams-remote-active')show();});document.addEventListener('mousemove',show,true);document.addEventListener('pointerdown',show,true);})();";
            playerGuard="window.__zeroTv="+tvPlayer+";window.__zeroBlockAds="+blockAds+";window.__zeroGain="+getSharedPreferences("zero",MODE_PRIVATE).getFloat("audioBoost",1f)+";"+output.toString("UTF-8")+(tvPlayer?tvBack:"");
            if(androidx.webkit.WebViewFeature.isFeatureSupported(androidx.webkit.WebViewFeature.DOCUMENT_START_SCRIPT))androidx.webkit.WebViewCompat.addDocumentStartJavaScript(web,playerGuard,java.util.Collections.singleton("*"));
            else Toast.makeText(this,"Update Android System WebView for filtering inside player frames.",Toast.LENGTH_LONG).show();
        }catch(java.io.IOException error){android.util.Log.e("ZeroPlay","Player guard could not load",error);}
    }

    @Override public void onBackPressed(){
        if(getIntent().getBooleanExtra("reader",false)||playerGuard==null||web==null){finish();return;}
        if(tvPlayer){
            if(playerControlsVisible){hidePlayerControls();return;}
            if(mouse!=null)mouse.stop();
            finish();
            return;
        }
        if(mouse!=null)mouse.stop();
        web.evaluateJavascript("if(window.__zeroBackRequest)window.__zeroBackRequest(1);",ignored->finish());
    }

    @Override protected void onPause(){tvUi.removeCallbacks(controlsIdle);if(mouse!=null)mouse.stop();if(adScan!=null)adScan.stop();if(web!=null){CookieManager.getInstance().flush();web.onPause();}super.onPause();}
    @Override protected void onResume(){super.onResume();if(web!=null)web.onResume();if(adScan!=null)adScan.start();if(tvPlayer)wakeControls();}
    @Override protected void onDestroy(){tvUi.removeCallbacksAndMessages(null);if(mouse!=null)mouse.stop();if(adScan!=null)adScan.destroy();if(web!=null){web.stopLoading();web.destroy();}super.onDestroy();}
}
