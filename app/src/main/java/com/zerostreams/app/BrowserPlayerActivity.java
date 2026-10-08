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
    private long lastDpadActivity;
    private int dpadWakeKey=-1;
    private final PlayerBackState backState=new PlayerBackState();
    private volatile boolean blockAds;
    private TextView status;
    private FrameLayout screen;
    private View fullscreen;
    private WebChromeClient.CustomViewCallback fullscreenCallback;
    private boolean tvBackRequesting;
    private int tvBackToken;
    private final android.os.Handler tvUi=new android.os.Handler(android.os.Looper.getMainLooper());

    @Override public void onCreate(Bundle saved) {
        super.onCreate(saved);
        boolean reader=getIntent().getBooleanExtra("reader",false);
        if(reader)setRequestedOrientation(android.content.pm.ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED);
        String address=getIntent().getStringExtra("url");
        if(address==null||!address.startsWith("https://")){finish();return;}
        tvPlayer=BuildConfig.TV&&!reader;
        // playerMouse defaults to true when absent, but a Settings choice must persist.
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

        web=new WebView(this);web.setBackgroundColor(Color.BLACK);web.setFocusable(true);web.setFocusableInTouchMode(true);
        web.setOnTouchListener((v,event)->{if(event.getActionMasked()==android.view.MotionEvent.ACTION_DOWN){backState.userActivity();lastPlayerGesture=android.os.SystemClock.elapsedRealtime();wakeControls();}return false;});
        CookieManager cookies=CookieManager.getInstance();cookies.setAcceptCookie(true);cookies.setAcceptThirdPartyCookies(web,PlaybackSources.trusted(address));
        WebSettings settings=web.getSettings();settings.setJavaScriptEnabled(true);settings.setDomStorageEnabled(true);settings.setMediaPlaybackRequiresUserGesture(false);settings.setAllowFileAccess(false);settings.setAllowContentAccess(false);settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);settings.setSupportMultipleWindows(false);settings.setJavaScriptCanOpenWindowsAutomatically(false);
        if(!reader&&PlaybackSources.trusted(address)){blockAds=true;installProgressListener();installPlayerExitListener();installPlayerGuard();adScan=new PlayerAdScan(this,web);}
        web.setWebViewClient(new WebViewClient(){
            @Override public boolean shouldOverrideUrlLoading(WebView v,WebResourceRequest request){if(tvPlayer&&request.isForMainFrame()&&request.hasGesture()&&java.util.Arrays.asList("vidstuck.xyz","vidsrc.sh").contains(request.getUrl().getHost())&&!String.valueOf(request.getUrl().getPath()).startsWith("/embed/")){finish();return true;}return (blockAds&&AdBlockRules.blocks(request.getUrl().getHost())) || !"https".equals(request.getUrl().getScheme()) || (request.isForMainFrame()&&!PlaybackSources.trusted(request.getUrl().toString()));}
            @Override public WebResourceResponse shouldInterceptRequest(WebView v,WebResourceRequest request){if(blockAds&&!request.isForMainFrame()&&AdBlockRules.blocks(request.getUrl().getHost()))return new WebResourceResponse("text/plain","UTF-8",new java.io.ByteArrayInputStream(new byte[0]));return null;}
            @Override public void onPageFinished(WebView v,String url){CookieManager.getInstance().flush();if(playerGuard!=null)v.evaluateJavascript(playerGuard,null);status.setText(reader?"Publisher reader · use Back to return":"External player · use Back to return");if(tvPlayer){lastDpadActivity=android.os.SystemClock.elapsedRealtime();wakeControls();}}
            @Override public void onReceivedError(WebView v,WebResourceRequest request,WebResourceError error){if(request.isForMainFrame()){status.setText("Player unavailable. Reload or try again later.");if(!reader)Toast.makeText(BrowserPlayerActivity.this,"Player unavailable. Press Back and try again.",Toast.LENGTH_LONG).show();}}
        });
        web.setWebChromeClient(new WebChromeClient(){
            @Override public boolean onCreateWindow(WebView view,boolean dialog,boolean gesture,android.os.Message message){return false;}
            @Override public void onShowCustomView(View view,CustomViewCallback callback){if(tvPlayer||android.os.SystemClock.elapsedRealtime()-lastPlayerGesture>1500||fullscreen!=null){callback.onCustomViewHidden();return;}fullscreen=view;fullscreenCallback=callback;root.setVisibility(View.GONE);screen.addView(view,new FrameLayout.LayoutParams(-1,-1));}
            @Override public void onHideCustomView(){closeFullscreen();}
        });
        root.addView(web,new LinearLayout.LayoutParams(-1,0,1));screen=new FrameLayout(this);screen.setBackgroundColor(Color.BLACK);screen.addView(root,new FrameLayout.LayoutParams(-1,-1));
        if(tvPlayer){mouse=new TvMouse(this,web,screen,this::wakeControls);Toast.makeText(this,mouse.isMouseEnabled()?"Movie player · Mouse control":"Movie player · D-pad navigation",Toast.LENGTH_LONG).show();}
        setContentView(screen);if(!reader)hideSystemBars();web.loadUrl(address);web.requestFocus();
    }

    private void hideSystemBars(){getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_FULLSCREEN|View.SYSTEM_UI_FLAG_HIDE_NAVIGATION|View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY|View.SYSTEM_UI_FLAG_LAYOUT_STABLE|View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN|View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION);}
    @Override public void onWindowFocusChanged(boolean focused){super.onWindowFocusChanged(focused);if(focused&&!getIntent().getBooleanExtra("reader",false))hideSystemBars();}
    private void closeFullscreen(){if(fullscreen==null)return;screen.removeView(fullscreen);fullscreen=null;screen.getChildAt(0).setVisibility(View.VISIBLE);if(fullscreenCallback!=null){fullscreenCallback.onCustomViewHidden();fullscreenCallback=null;}}

    private boolean isBackKey(int key){return key==KeyEvent.KEYCODE_BACK||key==KeyEvent.KEYCODE_ESCAPE||key==KeyEvent.KEYCODE_BUTTON_B;}
    private boolean tvNavKey(int key){return key==KeyEvent.KEYCODE_DPAD_LEFT||key==KeyEvent.KEYCODE_DPAD_RIGHT||key==KeyEvent.KEYCODE_DPAD_UP||key==KeyEvent.KEYCODE_DPAD_DOWN||key==KeyEvent.KEYCODE_DPAD_CENTER||key==KeyEvent.KEYCODE_ENTER;}
    private String tvDirection(int key){switch(key){case KeyEvent.KEYCODE_DPAD_LEFT:return "left";case KeyEvent.KEYCODE_DPAD_RIGHT:return "right";case KeyEvent.KEYCODE_DPAD_UP:return "up";case KeyEvent.KEYCODE_DPAD_DOWN:return "down";case KeyEvent.KEYCODE_DPAD_CENTER:case KeyEvent.KEYCODE_ENTER:return "ok";default:return null;}}
    private void sendTvNavigation(String direction,int attempt){
        if(web==null||direction==null)return;
        String script="(function(){try{var a=document.activeElement;if(a&&((a.tagName==='INPUT'&&a.type==='range')||a.getAttribute('role')==='slider'))a.blur();var frames=Array.from(document.querySelectorAll('iframe')).filter(function(f){var r=f.getBoundingClientRect(),s=getComputedStyle(f);return r.width>40&&r.height>40&&s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity||1)>0;}).sort(function(x,y){var a=x.getBoundingClientRect(),b=y.getBoundingClientRect();return b.width*b.height-a.width*a.height;});if(frames.length){frames[0].contentWindow.postMessage({type:'zerostreams-tv-nav',direction:'"+direction+"'},'*');return true;}if(typeof window.__zeroTvNavigate==='function'){window.__zeroTvNavigate('"+direction+"');return true;}return false;}catch(e){return false;}})();";
        web.evaluateJavascript(script,value->{
            if("true".equals(value)||attempt>=3||web==null)return;
            web.postDelayed(()->sendTvNavigation(direction,attempt+1),110L*(attempt+1));
        });
    }
    private void wakeProviderWithHover(){
        wakeControls();
        if(web==null||web.getWidth()<=0||web.getHeight()<=0)return;
        long now=android.os.SystemClock.uptimeMillis();float x=web.getWidth()/2f,y=Math.max(2f,web.getHeight()*.72f);
        MotionEvent hover=MotionEvent.obtain(now,now,MotionEvent.ACTION_HOVER_MOVE,x,y,0);hover.setSource(InputDevice.SOURCE_MOUSE);web.dispatchGenericMotionEvent(hover);hover.recycle();
    }
    private boolean consumeDpadWake(KeyEvent event){
        int key=event.getKeyCode();
        if(dpadWakeKey==key&&event.getAction()==KeyEvent.ACTION_UP){dpadWakeKey=-1;return true;}
        if(event.getAction()!=KeyEvent.ACTION_DOWN||event.getRepeatCount()>0)return false;
        long now=android.os.SystemClock.elapsedRealtime();boolean idle=lastDpadActivity>0&&now-lastDpadActivity>2800;lastDpadActivity=now;
        if(!idle)return false;
        dpadWakeKey=key;wakeProviderWithHover();return true;
    }
    @Override public boolean dispatchKeyEvent(KeyEvent event){
        int key=event.getKeyCode();
        if(isBackKey(key)&&!getIntent().getBooleanExtra("reader",false)){
            if(event.getAction()==KeyEvent.ACTION_UP&&!event.isCanceled())onBackPressed();
            return true;
        }
        if(tvPlayer){
            boolean mouseMode=mouse!=null&&mouse.isMouseEnabled();
            if(event.getAction()==KeyEvent.ACTION_DOWN&&key!=KeyEvent.KEYCODE_VOLUME_UP&&key!=KeyEvent.KEYCODE_VOLUME_DOWN)backState.userActivity();
            if(mouseMode){
                if(event.getAction()==KeyEvent.ACTION_DOWN&&key!=KeyEvent.KEYCODE_VOLUME_UP&&key!=KeyEvent.KEYCODE_VOLUME_DOWN)wakeControls();
                if(mouse.handle(event))return true;
            }else if(tvNavKey(key)){
                if(consumeDpadWake(event))return true;
                String direction=tvDirection(key);boolean activate="ok".equals(direction);
                if(!activate&&event.getAction()==KeyEvent.ACTION_DOWN){long now=android.os.SystemClock.elapsedRealtime();if(event.getRepeatCount()>0&&now-lastTvNavAt<180)return true;lastTvNavAt=now;wakeControls();}
                if(activate&&event.getAction()==KeyEvent.ACTION_DOWN)wakeControls();
                boolean fire=(activate&&event.getAction()==KeyEvent.ACTION_UP)||(!activate&&event.getAction()==KeyEvent.ACTION_DOWN);
                if(fire&&direction!=null){if(activate)lastPlayerGesture=android.os.SystemClock.elapsedRealtime();sendTvNavigation(direction,0);}
                return true;
            }
        }else if(event.getAction()==KeyEvent.ACTION_DOWN&&key!=KeyEvent.KEYCODE_VOLUME_UP&&key!=KeyEvent.KEYCODE_VOLUME_DOWN){backState.userActivity();}
        return super.dispatchKeyEvent(event);
    }

    private void wakeControls(){
        if(web!=null){web.requestFocus();web.evaluateJavascript("document.documentElement.classList.remove('zero-back-hide','zero-player-idle');if(window.__zeroRemoteActivity)window.__zeroRemoteActivity();window.postMessage({type:'zerostreams-remote-active'},'*');document.querySelectorAll('iframe').forEach(f=>{try{f.contentWindow.postMessage({type:'zerostreams-remote-active'},'*')}catch(_){}});",null);}
    }
    private String jsValue(String value){if(value==null)return "";return value.replace("\"","").trim();}
    private void resolveTvBack(String stage){
        tvBackRequesting=false;
        if(isFinishing()||web==null)return;
        if("menu".equals(stage))return;
        if("controls".equals(stage)){if(mouse!=null)mouse.stop();return;}
        if(mouse!=null)mouse.stop();
        finish();
    }
    private void pollTvBackResult(int token,int attempt){
        if(web==null||isFinishing()){tvBackRequesting=false;return;}
        String script="(function(){try{var r=window.__zeroBackResult;if(!r||r.token!=="+token+")return 'pending';return r.stage|| (r.handled?'controls':'exit');}catch(e){return 'exit';}})();";
        web.evaluateJavascript(script,value->{
            String result=jsValue(value);
            if("menu".equals(result)||"controls".equals(result)||"exit".equals(result)){resolveTvBack(result);return;}
            if(attempt>=9){resolveTvBack("exit");return;}
            tvUi.postDelayed(()->pollTvBackResult(token,attempt+1),70);
        });
    }
    private void requestTvBackStep(){
        if(tvBackRequesting||web==null)return;
        tvBackRequesting=true;int token=++tvBackToken;
        String script="(function(){try{window.__zeroBackResult=null;if(typeof window.__zeroTvBackStep!=='function')return 'missing';window.__zeroTvBackStep("+token+");return 'started';}catch(e){return 'missing';}})();";
        web.evaluateJavascript(script,value->{
            if("missing".equals(jsValue(value))){resolveTvBack("exit");return;}
            tvUi.postDelayed(()->pollTvBackResult(token,0),70);
        });
    }

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
        try(java.io.InputStream input=getAssets().open("player-guard.js");java.io.ByteArrayOutputStream output=new java.io.ByteArrayOutputStream();java.io.InputStream mouseInput=getAssets().open("mouse-back.js");java.io.ByteArrayOutputStream mouseOutput=new java.io.ByteArrayOutputStream()){
            byte[] buffer=new byte[4096];int count;while((count=input.read(buffer))!=-1)output.write(buffer,0,count);while((count=mouseInput.read(buffer))!=-1)mouseOutput.write(buffer,0,count);
            String tvBack=";(()=>{if(window.__zeroBackHideInstalled)return;window.__zeroBackHideInstalled=true;const selector='.jw-controlbar,.jw-controls,.plyr__controls,.vjs-control-bar,.shaka-controls-container,[role=\\\"toolbar\\\"],[data-zero-controlbar],[data-zero-controls],nav,header';const style=document.createElement('style');style.textContent='.zero-back-hide '+selector.replace(/,/g,',.zero-back-hide ')+'{opacity:0!important;visibility:hidden!important;pointer-events:none!important}.zero-tv-focused{outline:4px solid #65e6cc!important;outline-offset:4px!important;border-radius:9px!important;box-shadow:0 0 0 3px rgba(101,230,204,.24),0 0 22px rgba(101,230,204,.58)!important;filter:brightness(1.16)!important}';const install=()=>document.head&&document.head.appendChild(style);if(document.head)install();else document.addEventListener('DOMContentLoaded',install,{once:true});const show=()=>{document.documentElement.classList.remove('zero-back-hide','zero-player-idle');if(window.__zeroRemoteActivity)window.__zeroRemoteActivity();};const hide=()=>{document.documentElement.classList.add('zero-back-hide','zero-player-idle');document.querySelectorAll('iframe').forEach(f=>{try{f.contentWindow.postMessage({type:\\'zerostreams-back-hide\\'},'\\*');}catch(_){}});};window.__zeroHidePlayerControls=hide;window.addEventListener('message',e=>{if(e.data&&e.data.type==='zerostreams-back-hide')hide();if(e.data&&e.data.type==='zerostreams-remote-active')show();});document.addEventListener('mousemove',show,true);document.addEventListener('pointerdown',show,true);})();";
            playerGuard="window.__zeroTv="+tvPlayer+";window.__zeroBlockAds="+blockAds+";window.__zeroGain="+getSharedPreferences("zero",MODE_PRIVATE).getFloat("audioBoost",1f)+";"+output.toString("UTF-8")+(tvPlayer?tvBack+mouseOutput.toString("UTF-8"):"");
            if(androidx.webkit.WebViewFeature.isFeatureSupported(androidx.webkit.WebViewFeature.DOCUMENT_START_SCRIPT))androidx.webkit.WebViewCompat.addDocumentStartJavaScript(web,playerGuard,java.util.Collections.singleton("*"));
            else Toast.makeText(this,"Update Android System WebView for filtering inside player frames.",Toast.LENGTH_LONG).show();
        }catch(java.io.IOException error){android.util.Log.e("ZeroPlay","Player guard could not load",error);}
    }

    @Override public void onBackPressed(){
        if(getIntent().getBooleanExtra("reader",false)||playerGuard==null||web==null){finish();return;}
        if(tvPlayer){requestTvBackStep();return;}
        if(mouse!=null)mouse.stop();
        web.evaluateJavascript("if(window.__zeroBackRequest)window.__zeroBackRequest(1);",ignored->finish());
    }

    @Override protected void onPause(){if(mouse!=null)mouse.stop();if(adScan!=null)adScan.stop();if(web!=null){CookieManager.getInstance().flush();web.onPause();}super.onPause();}
    @Override protected void onResume(){super.onResume();if(web!=null)web.onResume();if(adScan!=null)adScan.start();if(tvPlayer){lastDpadActivity=android.os.SystemClock.elapsedRealtime();wakeControls();}}
    @Override protected void onDestroy(){tvUi.removeCallbacksAndMessages(null);if(mouse!=null)mouse.stop();if(adScan!=null)adScan.destroy();if(web!=null){web.stopLoading();web.destroy();}super.onDestroy();}
}
