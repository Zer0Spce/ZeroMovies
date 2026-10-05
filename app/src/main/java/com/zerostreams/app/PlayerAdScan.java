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
    PlayerAdScan(Activity a,WebView w){activity=a;web=w;}
    private final Runnable tick=new Runnable(){public void run(){if(!active)return;capture();handler.postDelayed(this,(SystemClock.elapsedRealtime()-startedAt<18000||SystemClock.elapsedRealtime()-confirmedAt<5000)?1000:3500);}};
    void start(){if(active)return;active=true;startedAt=SystemClock.elapsedRealtime();handler.postDelayed(tick,300);}
    void stop(){active=false;handler.removeCallbacks(tick);}
    void destroy(){stop();decoder.shutdownNow();}
    private void capture(){
        if(busy||web.getWidth()<1||web.getHeight()<1||activity.isFinishing())return;busy=true;
        int width=720,height=Math.max(1,(int)(720f*activity.getWindow().getDecorView().getHeight()/Math.max(1,activity.getWindow().getDecorView().getWidth())));
        Bitmap bitmap=Bitmap.createBitmap(width,height,Bitmap.Config.ARGB_8888);
        if(Build.VERSION.SDK_INT>=26){try{PixelCopy.request(activity.getWindow(),bitmap,result->{if(result==PixelCopy.SUCCESS)inspect(bitmap);else{bitmap.recycle();busy=false;}},handler);}catch(IllegalArgumentException e){bitmap.recycle();busy=false;}}
        else{Canvas canvas=new Canvas(bitmap);canvas.scale(width/(float)web.getWidth(),height/(float)web.getHeight());web.draw(canvas);inspect(bitmap);}
    }
    private void inspect(Bitmap bitmap){
        if(decoder.isShutdown()){bitmap.recycle();busy=false;return;}
        decoder.execute(()->{String value="";try{int width=bitmap.getWidth(),height=bitmap.getHeight();int[] pixels=new int[width*height];bitmap.getPixels(pixels,0,width,0,0,width,height);value=QrAdDetector.decode(pixels,width,height);}catch(RuntimeException ignored){}finally{bitmap.recycle();}
            final String url=value;handler.post(()->{busy=false;if(!active||activity.isDestroyed()||url.isEmpty())return;try{String host=new URI(url).getHost();if(host!=null)activity.getSharedPreferences("zero",Activity.MODE_PRIVATE).edit().putString("playerQrLastHost",host).apply();}catch(Exception ignored){}if(QrAdDetector.isAdUrl(url)){confirmedAt=SystemClock.elapsedRealtime();web.evaluateJavascript("if(window.__zeroDismissQrAd)window.__zeroDismissQrAd();",null);}});});
    }
}

