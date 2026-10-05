package com.zerostreams.app;

import android.app.Activity;
import android.os.Bundle;
import android.graphics.*;
import android.content.Context;
import android.view.*;
import android.widget.*;
import org.json.*;
import java.net.*;
import java.io.*;
import java.util.concurrent.*;

public class MangaReaderActivity extends Activity {
    private final ExecutorService io=Executors.newSingleThreadExecutor();
    private final android.os.Handler ui=new android.os.Handler(android.os.Looper.getMainLooper());
    private ZoomPage image;private TextView status;private JSONArray pages;private String base,hash,chapter,parent;private int page,version;private Button previous,next;
    @Override public void onCreate(Bundle saved) {
        super.onCreate(saved);chapter=getIntent().getStringExtra("chapter");parent=getIntent().getStringExtra("parent");if(chapter==null||parent==null){finish();return;}
        page=saved==null?getSharedPreferences("zero",MODE_PRIVATE).getInt("reader:"+chapter,0):saved.getInt("page",0);
        LinearLayout root=new LinearLayout(this);root.setOrientation(LinearLayout.VERTICAL);root.setBackgroundColor(Color.rgb(8,13,20));LinearLayout toolbar=new LinearLayout(this);
        Button back=new Button(this);back.setText("Chapters");back.setOnClickListener(v->finish());toolbar.addView(back);
        previous=new Button(this);previous.setText("Previous");previous.setOnClickListener(v->changePage(-1));toolbar.addView(previous);
        next=new Button(this);next.setText("Next");next.setOnClickListener(v->changePage(1));toolbar.addView(next);root.addView(toolbar);
        status=new TextView(this);status.setTextColor(Color.WHITE);status.setTextSize(16);status.setPadding(16,8,16,8);status.setText("Loading chapter…");root.addView(status);
        image=new ZoomPage(this);image.setContentDescription("Manga page. Pinch to zoom, drag to pan. Use Previous and Next to turn pages.");root.addView(image,new LinearLayout.LayoutParams(-1,0,1));setContentView(root);
        io.execute(()->{try{JSONObject response=(JSONObject)ContentApi.json(ContentApi.MANGA+"/at-home/server/"+chapter);JSONObject data=response.getJSONObject("chapter");String address=response.getString("baseUrl"),value=data.getString("hash");JSONArray list=data.getJSONArray("dataSaver");if(!address.startsWith("https://")||list.length()==0)throw new IOException("No readable pages");ui.post(()->{if(isDestroyed())return;base=address;hash=value;pages=list;page=Math.min(page,pages.length()-1);loadPage();});}catch(Exception e){ui.post(()->{if(!isDestroyed())status.setText("Chapter unavailable. Return to choose another chapter.");});}});
    }
    void changePage(int delta){if(pages==null)return;int target=page+delta;if(target<0||target>=pages.length())return;page=target;loadPage();}
    void loadPage(){int token=++version;status.setText("Page "+(page+1)+" / "+pages.length()+" · loading");previous.setEnabled(page>0);next.setEnabled(page+1<pages.length());image.setBitmap(null);
        getSharedPreferences("zero",MODE_PRIVATE).edit().putInt("reader:"+chapter,page).putString("readerChapter:"+parent,chapter).putLong("position:"+parent,page+1).apply();
        String url=base+"/data-saver/"+hash+"/"+pages.optString(page);
        io.execute(()->{HttpURLConnection c=null;try{c=(HttpURLConnection)new URL(url).openConnection();c.setConnectTimeout(10000);c.setReadTimeout(15000);c.setInstanceFollowRedirects(false);if(c.getResponseCode()!=200)throw new IOException();byte[] bytes;
            try(InputStream in=c.getInputStream();ByteArrayOutputStream out=new ByteArrayOutputStream()){byte[] b=new byte[8192];int n;while((n=in.read(b))!=-1){if(out.size()+n>10_000_000)throw new IOException("Page too large");out.write(b,0,n);}bytes=out.toByteArray();}
            BitmapFactory.Options options=new BitmapFactory.Options();options.inJustDecodeBounds=true;BitmapFactory.decodeByteArray(bytes,0,bytes.length,options);int sample=1;while(options.outWidth/sample>2000||options.outHeight/sample>3000)sample*=2;options.inSampleSize=sample;options.inJustDecodeBounds=false;Bitmap bitmap=BitmapFactory.decodeByteArray(bytes,0,bytes.length,options);if(bitmap==null)throw new IOException();
            ui.post(()->{if(isDestroyed()||token!=version)return;image.setBitmap(bitmap);status.setText("Page "+(page+1)+" / "+pages.length()+" · MangaDex");});
        }catch(Exception e){ui.post(()->{if(!isDestroyed()&&token==version)status.setText("Page unavailable. Choose another page or return to chapters.");});}finally{if(c!=null)c.disconnect();}});
    }
    @Override public boolean onKeyDown(int code,KeyEvent event){if(code==KeyEvent.KEYCODE_DPAD_RIGHT||code==KeyEvent.KEYCODE_PAGE_DOWN){changePage(1);return true;}if(code==KeyEvent.KEYCODE_DPAD_LEFT||code==KeyEvent.KEYCODE_PAGE_UP){changePage(-1);return true;}return super.onKeyDown(code,event);}
    @Override protected void onSaveInstanceState(Bundle out){out.putInt("page",page);super.onSaveInstanceState(out);}
    @Override protected void onDestroy(){++version;io.shutdownNow();ui.removeCallbacksAndMessages(null);super.onDestroy();}
    static final class ZoomPage extends View {
        private Bitmap bitmap;private final Matrix matrix=new Matrix();private final Paint paint=new Paint(Paint.FILTER_BITMAP_FLAG);private final ScaleGestureDetector zoom;private float lastX,lastY,totalScale=1;
        ZoomPage(Context c){super(c);zoom=new ScaleGestureDetector(c,new ScaleGestureDetector.SimpleOnScaleGestureListener(){@Override public boolean onScale(ScaleGestureDetector detector){float factor=detector.getScaleFactor();float next=Math.max(.6f,Math.min(totalScale*factor,5f));factor=next/totalScale;totalScale=next;matrix.postScale(factor,factor,detector.getFocusX(),detector.getFocusY());invalidate();return true;}});}
        void setBitmap(Bitmap value){bitmap=value;fit();invalidate();}
        void fit(){matrix.reset();totalScale=1;if(bitmap==null||getWidth()==0||getHeight()==0)return;matrix.setRectToRect(new RectF(0,0,bitmap.getWidth(),bitmap.getHeight()),new RectF(0,0,getWidth(),getHeight()),Matrix.ScaleToFit.CENTER);}
        @Override protected void onSizeChanged(int w,int h,int ow,int oh){super.onSizeChanged(w,h,ow,oh);fit();}
        @Override protected void onDraw(Canvas canvas){super.onDraw(canvas);if(bitmap!=null)canvas.drawBitmap(bitmap,matrix,paint);}
        @Override public boolean onTouchEvent(android.view.MotionEvent event){zoom.onTouchEvent(event);if(event.getActionMasked()==android.view.MotionEvent.ACTION_DOWN){lastX=event.getX();lastY=event.getY();}else if(event.getActionMasked()==android.view.MotionEvent.ACTION_MOVE&&!zoom.isInProgress()){matrix.postTranslate(event.getX()-lastX,event.getY()-lastY);invalidate();lastX=event.getX();lastY=event.getY();}else if(event.getActionMasked()==android.view.MotionEvent.ACTION_UP)performClick();return true;}
        @Override public boolean performClick(){super.performClick();return true;}
    }
}
