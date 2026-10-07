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
    @Override public void onCreate(Bundle saved) {
        super.onCreate(saved);boolean reader=getIntent().getBooleanExtra("reader",false);if(reader)setRequestedOrientation(android.content.pm.ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED);String address=getIntent().getStringExtra("url");if(address==null||!address.startsWith("https://")){finish();return;}
        tvPlayer=BuildConfig.TV&&!reader;if(tvPlayer&&!getSharedPreferences("zero",MODE_PRIVATE).getBoolean("playerMouseDefaultV1",false))getSharedPreferences("zero",MODE_PRIVATE).edit().putBoolean("playerMouse",true).putBoolean("playerMouseDefaultV1",true).apply();
        blockAds=!reader&&getSharedPreferences("zero",MODE_PRIVATE).getBoolean("blockAds",true);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        LinearLayout root=new LinearLayout(this);root.setOrientation(LinearLayout.VERTICAL);root.setBackgroundColor(Color.BLACK);
        LinearLayout controls=new LinearLayout(this);Button back=new Button(this);back.setText("Back");back.setOnClickListener(v->finish());controls.addView(back);
        Button reload=new Button(this);reload.setText(reader?"Reload reader":"Reload player");reload.setOnClickListener(v->{status.setText(reader?"Loading reader…":"Loading player…");web.reload();});controls.addView(reload);
        if(PlaybackSources.trusted(address)){Button browser=new Button(this);browser.setText("Open browser");browser.setOnClickListener(v->{try{startActivity(new android.content.Intent(android.content.Intent.ACTION_VIEW,Uri.parse(address)));}catch(android.content.ActivityNotFoundException e){Toast.makeText(this,"No browser installed",Toast.LENGTH_LONG).show();}});controls.addView(browser);}
        if(!reader){Button ads=new Button(this);ads.setText(blockAds?"Ads blocked":"Blocking off");ads.setOnClickListener(v->{blockAds=!blockAds;getSharedPreferences("zero",MODE_PRIVATE).edit().putBoolean("blockAds",blockAds).apply();ads.setText(blockAds?"Ads blocked":"Blocking off");web.reload();});controls.addView(ads);}
        status=new TextView(this);status.setText(reader?"Loading reader…":"Loading player…");status.setTextColor(Color.WHITE);status.setTextSize(14);controls.addView(status,new LinearLayout.LayoutParams(0,-2,1));if(reader)root.addView(controls);
        web=new WebView(this);web.setBackgroundColor(Color.BLACK);web.setOnTouchListener((v,event)->{if(event.getActionMasked()==android.view.MotionEvent.ACTION_DOWN){backState.userActivity();lastPlayerGesture=android.os.SystemClock.elapsedRealtime();}return false;});CookieManager cookies=CookieManager.getInstance();cookies.setAcceptCookie(true);cookies.setAcceptThirdPartyCookies(web,PlaybackSources.trusted(address));WebSettings settings=web.getSettings();settings.setJavaScriptEnabled(true);settings.setDomStorageEnabled(true);settings.setMediaPlaybackRequiresUserGesture(false);settings.setAllowFileAccess(false);settings.setAllowContentAccess(false);settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);settings.setSupportMultipleWindows(false);settings.setJavaScriptCanOpenWindowsAutomatically(false);
        String host=Uri.parse(address).getHost();if(!reader&&PlaybackSources.trusted(address)){blockAds=true;installProgressListener();installPlayerExitListener();installPlayerGuard();adScan=new PlayerAdScan(this,web);}web.setWebViewClient(new WebViewClient(){
            @Override public boolean shouldOverrideUrlLoading(WebView v,WebResourceRequest request){if(tvPlayer&&request.isForMainFrame()&&request.hasGesture()&&java.util.Arrays.asList("vidstuck.xyz","vidsrc.sh").contains(request.getUrl().getHost())&&!String.valueOf(request.getUrl().getPath()).startsWith("/embed/")){finish();return true;}return (blockAds&&AdBlockRules.blocks(request.getUrl().getHost())) || !"https".equals(request.getUrl().getScheme()) || (request.isForMainFrame()&&!PlaybackSources.trusted(request.getUrl().toString()));}
            @Override public WebResourceResponse shouldInterceptRequest(WebView v,WebResourceRequest request){if(blockAds&&!request.isForMainFrame()&&AdBlockRules.blocks(request.getUrl().getHost()))return new WebResourceResponse("text/plain","UTF-8",new java.io.ByteArrayInputStream(new byte[0]));return null;}
            @Override public void onPageFinished(WebView v,String url){CookieManager.getInstance().flush();if(playerGuard!=null)v.evaluateJavascript(playerGuard,null);status.setText(reader?"Publisher reader · use Back to return":"External player · use Back to return");}
            @Override public void onReceivedError(WebView v,WebResourceRequest request,WebResourceError error){if(request.isForMainFrame()){status.setText("Player unavailable. Reload or try again later.");if(!reader)Toast.makeText(BrowserPlayerActivity.this,"Player unavailable. Press Back and try again.",Toast.LENGTH_LONG).show();}}
        });
        web.setWebChromeClient(new WebChromeClient(){
            @Override public boolean onCreateWindow(WebView view,boolean dialog,boolean gesture,android.os.Message message){return false;}
            @Override public void onShowCustomView(View view,CustomViewCallback callback){if(tvPlayer||android.os.SystemClock.elapsedRealtime()-lastPlayerGesture>1500||fullscreen!=null){callback.onCustomViewHidden();return;}fullscreen=view;fullscreenCallback=callback;root.setVisibility(View.GONE);screen.addView(view,new FrameLayout.LayoutParams(-1,-1));}
            @Override public void onHideCustomView(){closeFullscreen();}
        });root.addView(web,new LinearLayout.LayoutParams(-1,0,1));screen=new FrameLayout(this);screen.setBackgroundColor(Color.BLACK);screen.addView(root,new FrameLayout.LayoutParams(-1,-1));if(tvPlayer){mouse=new TvMouse(this,web,screen,this::wakeControls);Toast.makeText(this,mouse.isMouseEnabled()?"Player mouse on · arrows move, OK selects · Menu toggles mouse":"D-pad navigation · arrows focus, OK selects · Menu toggles mouse",Toast.LENGTH_LONG).show();}setContentView(screen);if(!reader)hideSystemBars();web.loadUrl(address);web.requestFocus();
    }
    private void hideSystemBars(){getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_FULLSCREEN|View.SYSTEM_UI_FLAG_HIDE_NAVIGATION|View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY|View.SYSTEM_UI_FLAG_LAYOUT_STABLE|View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN|View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION);}
    @Override public void onWindowFocusChanged(boolean focused){super.onWindowFocusChanged(focused);if(focused&&!getIntent().getBooleanExtra("reader",false))hideSystemBars();}
    private void closeFullscreen(){if(fullscreen==null)return;screen.removeView(fullscreen);fullscreen=null;screen.getChildAt(0).setVisibility(View.VISIBLE);if(fullscreenCallback!=null){fullscreenCallback.onCustomViewHidden();fullscreenCallback=null;}}
    @Override public boolean dispatchKeyEvent(KeyEvent event){
        if(event.getKeyCode()==KeyEvent.KEYCODE_BACK&&!getIntent().getBooleanExtra("reader",false)){
            if(event.getAction()==KeyEvent.ACTION_UP&&!event.isCanceled())onBackPressed();
            return true;
        }
        if(event.getAction()==KeyEvent.ACTION_DOWN){
            int key=event.getKeyCode();
            if(key!=KeyEvent.KEYCODE_VOLUME_UP&&key!=KeyEvent.KEYCODE_VOLUME_DOWN)backState.userActivity();
            if(key==KeyEvent.KEYCODE_DPAD_CENTER||key==KeyEvent.KEYCODE_ENTER)lastPlayerGesture=android.os.SystemClock.elapsedRealtime();
            if(tvPlayer&&key!=KeyEvent.KEYCODE_BACK&&key!=KeyEvent.KEYCODE_VOLUME_UP&&key!=KeyEvent.KEYCODE_VOLUME_DOWN){
                boolean nativeWake=mouse!=null&&mouse.wakeNow();if(!nativeWake)wakeControls();
            }
        }
        if(mouse!=null&&mouse.handle(event))return true;
        if(tvPlayer){String direction=null;switch(event.getKeyCode()){
            case KeyEvent.KEYCODE_DPAD_LEFT:direction="left";break;case KeyEvent.KEYCODE_DPAD_RIGHT:direction="right";break;
            case KeyEvent.KEYCODE_DPAD_UP:direction="up";break;case KeyEvent.KEYCODE_DPAD_DOWN:direction="down";break;
            case KeyEvent.KEYCODE_DPAD_CENTER:case KeyEvent.KEYCODE_ENTER:direction="ok";break;
        }if(direction!=null){boolean activate=direction.equals("ok");if(!activate&&event.getAction()==KeyEvent.ACTION_DOWN){long now=android.os.SystemClock.elapsedRealtime();if(event.getRepeatCount()>0&&now-lastTvNavAt<165)return true;lastTvNavAt=now;}if((activate&&event.getAction()==KeyEvent.ACTION_UP)||(!activate&&event.getAction()==KeyEvent.ACTION_DOWN))web.evaluateJavascript("if(window.__zeroTvNavigate)window.__zeroTvNavigate('"+direction+"');",null);return true;}}
        return super.dispatchKeyEvent(event);
    }
    private void wakeControls(){if(web!=null){web.requestFocus();web.evaluateJavascript("if(window.__zeroRemoteActivity)window.__zeroRemoteActivity();window.postMessage({type:'zerostreams-native-wake'},'*');",null);}}
    private void installPlayerExitListener(){
        if(!androidx.webkit.WebViewFeature.isFeatureSupported(androidx.webkit.WebViewFeature.WEB_MESSAGE_LISTENER))return;
        androidx.webkit.WebViewCompat.addWebMessageListener(web,"ZeroPlayer",new java.util.HashSet<>(java.util.Arrays.asList(PlaybackSources.ORIGINS)),(view,message,origin,mainFrame,reply)->{
            if(mainFrame&&PlaybackSources.trusted(origin.toString())&&"back".equals(message.getData()))finish();
        });
    }
    private void installProgressListener(){
        String parent=getIntent().getStringExtra("parent");if(parent==null||!parent.matches("tmdb-(movie|series)-[0-9]+"))return;
        if(!androidx.webkit.WebViewFeature.isFeatureSupported(androidx.webkit.WebViewFeature.WEB_MESSAGE_LISTENER))return;
        HistoryStore history=new HistoryStore(getSharedPreferences("zero",MODE_PRIVATE));String type=parent.startsWith("tmdb-series-")?"tv":"movie";
        androidx.webkit.WebViewCompat.addWebMessageListener(web,"ZeroProgress",new java.util.HashSet<>(java.util.Arrays.asList(PlaybackSources.ORIGINS)),(view,message,origin,mainFrame,reply)->{
            if(!PlaybackSources.trusted(origin.toString()))return;String data=message.getData();if(data==null||data.length()>4096)return;
            long now=android.os.SystemClock.elapsedRealtime();if(now-lastProgressSaved<2500)return;
            try{org.json.JSONObject event=new org.json.JSONObject(data);history.progress(parent,type,event);lastProgressSaved=now;}catch(org.json.JSONException ignored){}
        });
    }
    private void installPlayerGuard(){
        try(java.io.InputStream input=getAssets().open("player-guard.js");java.io.ByteArrayOutputStream output=new java.io.ByteArrayOutputStream()){
            byte[] buffer=new byte[4096];int count;while((count=input.read(buffer))!=-1)output.write(buffer,0,count);
            playerGuard="window.__zeroTv="+tvPlayer+";window.__zeroBlockAds="+blockAds+";window.__zeroGain="+getSharedPreferences("zero",MODE_PRIVATE).getFloat("audioBoost",1f)+";"+output.toString("UTF-8");
            if(androidx.webkit.WebViewFeature.isFeatureSupported(androidx.webkit.WebViewFeature.DOCUMENT_START_SCRIPT)){
                androidx.webkit.WebViewCompat.addDocumentStartJavaScript(web,playerGuard,java.util.Collections.singleton("*"));
            }else{
                Toast.makeText(this,"Update Android System WebView for filtering inside player frames.",Toast.LENGTH_LONG).show();
            }
        }catch(java.io.IOException error){android.util.Log.e("ZeroPlay","Player guard could not load",error);}
    }
    private boolean backPending;private int backToken;
    @Override public void onBackPressed(){
        if(getIntent().getBooleanExtra("reader",false)||playerGuard==null||web==null){finish();return;}
        if(backPending)return;backPending=true;int token=++backToken;
        if(mouse!=null)mouse.stop();
        web.evaluateJavascript("if(window.__zeroBackRequest)window.__zeroBackRequest("+token+");",ignored->pollBack(token,0));
    }
    private void pollBack(int token,int attempt){if(isFinishing()||token!=backToken)return;web.evaluateJavascript("JSON.stringify(window.__zeroBackResult||null)",value->{boolean ready=false,handled=false;try{Object decoded=new org.json.JSONTokener(value).nextValue();if(decoded instanceof String){org.json.JSONObject result=new org.json.JSONObject((String)decoded);if(result.optInt("token")==token){ready=true;handled=result.optBoolean("handled");}}}catch(Exception ignored){}if(ready||attempt>=15){backPending=false;if(!handled)finish();}else new android.os.Handler(android.os.Looper.getMainLooper()).postDelayed(()->pollBack(token,attempt+1),20);});}
    @Override protected void onPause(){if(mouse!=null)mouse.stop();if(adScan!=null)adScan.stop();if(web!=null){CookieManager.getInstance().flush();web.onPause();}super.onPause();}
    @Override protected void onResume(){super.onResume();if(web!=null)web.onResume();if(adScan!=null)adScan.start();}
    @Override protected void onDestroy(){if(mouse!=null)mouse.stop();if(adScan!=null)adScan.destroy();if(web!=null){web.stopLoading();web.destroy();}super.onDestroy();}
}
