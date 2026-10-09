package com.zerostreams.app;

import android.app.Activity;
import android.graphics.*;
import android.os.*;
import android.view.PixelCopy;
import android.webkit.WebView;
import java.net.URI;
import java.util.concurrent.*;

/** Small in-memory snapshots only; QR targets are inspected, never opened. */
final class PlayerAdScan {
    private final Activity activity;private final WebView web;private final Handler handler=new Handler(Looper.getMainLooper());
    private final ExecutorService decoder=Executors.newSingleThreadExecutor();private boolean active,busy;private long startedAt,confirmedAt;
    PlayerAdScan(Activity a,WebView w){activity=a;web=w;PlayerAdBlockState.init(a);}
    private final Runnable tick=new Runnable(){public void run(){if(!active)return;capture();handler.postDelayed(this,(SystemClock.elapsedRealtime()-startedAt<18000||SystemClock.elapsedRealtime()-confirmedAt<5000)?1000:3500);}};
    void start(){if(BuildConfig.LITE||active)return;active=true;startedAt=SystemClock.elapsedRealtime();handler.postDelayed(tick,300);}
    void stop(){active=false;handler.removeCallbacks(tick);}
    void destroy(){stop();decoder.shutdownNow();}
    private void capture(){
        if(busy||web.getWidth()<1||web.getHeight()<1||activity.isFinishing())return;busy=true;
        int width=Math.min(1280,Math.max(1,activity.getWindow().getDecorView().getWidth())),height=Math.max(1,(int)(width*(float)activity.getWindow().getDecorView().getHeight()/Math.max(1,activity.getWindow().getDecorView().getWidth())));
        Bitmap bitmap=Bitmap.createBitmap(width,height,Bitmap.Config.ARGB_8888);
        if(Build.VERSION.SDK_INT>=26){try{PixelCopy.request(activity.getWindow(),bitmap,result->{if(result==PixelCopy.SUCCESS)inspect(bitmap);else{bitmap.recycle();busy=false;}},handler);}catch(IllegalArgumentException e){bitmap.recycle();busy=false;}}
        else{Canvas canvas=new Canvas(bitmap);canvas.scale(width/(float)web.getWidth(),height/(float)web.getHeight());web.draw(canvas);inspect(bitmap);}
    }
    private void inspect(Bitmap bitmap){
        if(decoder.isShutdown()){bitmap.recycle();busy=false;return;}
        decoder.execute(()->{String value="";try{int width=bitmap.getWidth(),height=bitmap.getHeight();int[] pixels=new int[width*height];bitmap.getPixels(pixels,0,width,0,0,width,height);value=QrAdDetector.decode(pixels,width,height);}catch(RuntimeException ignored){}finally{bitmap.recycle();}
            final String url=value;handler.post(()->{
                busy=false;if(!active||activity.isDestroyed()||url.isEmpty())return;
                String host="";
                try{String parsed=new URI(url).getHost();if(parsed!=null){host=parsed.toLowerCase(java.util.Locale.ROOT);activity.getSharedPreferences("zero",Activity.MODE_PRIVATE).edit().putString("playerQrLastHost",host).apply();}}catch(Exception ignored){}
                if(QrAdDetector.isAdUrl(url)){
                    confirmedAt=SystemClock.elapsedRealtime();
                    PlayerAdBlockState.confirm(activity,host,"qr-confirmed");
                    dismissConfirmedHost(host);
                }
            });});
    }

    /**
     * First try exact-host cosmetic cleanup. The older broad QR cleanup remains only
     * as a fallback after a QR has been positively identified by the native scanner.
     */
    private void dismissConfirmedHost(String host){
        if(web==null||web.getSettings()==null)return;
        String quoted=org.json.JSONObject.quote(host==null?"":host.toLowerCase(java.util.Locale.ROOT));
        String script="(function(host){try{let hidden=0;const hide=n=>{if(!n||n===document.body||n===document.documentElement)return false;n.style.setProperty('display','none','important');n.dataset.zeroQrHidden='1';hidden++;return true;};const exact=f=>{try{return new URL(f.src,location.href).hostname.toLowerCase()===host;}catch(_){return false;}};for(const frame of document.querySelectorAll('iframe')){if(!host||!exact(frame))continue;let candidate=frame;for(let depth=0,node=frame.parentElement;node&&depth<5;depth++,node=node.parentElement){const marker=((node.id||'')+' '+(typeof node.className==='string'?node.className:'')+' '+(node.getAttribute('data-ad')||'')+' '+(node.getAttribute('aria-label')||'')).toLowerCase();if(/(^|[\\s_-])(ad|ads|advert|advertisement|interstitial|popup|overlay)([\\s_-]|$)/.test(marker)){candidate=node;break;}}hide(candidate);}for(const node of document.querySelectorAll('[data-ad],[data-advertisement],.ad-overlay,.advertisement,.interstitial-ad,.popup-ad')){const frames=node.querySelectorAll('iframe');for(const frame of frames){if(exact(frame)){hide(node);break;}}}return hidden;}catch(_){return 0;}})("+quoted+");";
        web.evaluateJavascript(script,result->{
            String value=result==null?"":result.replace("\"","").trim();
            if("0".equals(value)&&web!=null&&!activity.isDestroyed())web.evaluateJavascript("if(window.__zeroDismissQrAd)window.__zeroDismissQrAd();",null);
        });
    }
}
