package com.zerostreams.app;

import android.app.*;
import android.content.*;
import android.graphics.*;
import android.graphics.drawable.GradientDrawable;
import android.os.*;
import android.text.TextUtils;
import android.view.*;
import android.widget.*;
import java.io.*;
import java.net.*;
import java.util.*;
import java.util.concurrent.*;

/** Dedicated filmography screen opened from a cast member. */
public class PersonFilmographyActivity extends Activity {
    private final ExecutorService io=Executors.newSingleThreadExecutor();
    private final ExecutorService imageIo=Executors.newFixedThreadPool(3);
    private final Handler ui=new Handler(Looper.getMainLooper());
    private final android.util.LruCache<String,Bitmap> images=new android.util.LruCache<String,Bitmap>(12*1024*1024){@Override protected int sizeOf(String key,Bitmap value){return value.getByteCount();}};
    private int bg=Color.rgb(9,10,16),surface=Color.rgb(22,24,34),ink=Color.rgb(244,245,250),muted=Color.rgb(157,162,181),accent=Color.rgb(101,230,204);
    private LinearLayout content;
    private int dp(float n){return(int)(getResources().getDisplayMetrics().density*n+.5f);}
    private TextView text(String value,int size,int color){TextView t=new TextView(this);t.setText(value);t.setTextSize(size);t.setTextColor(color);return t;}
    private GradientDrawable shape(int color,int border){GradientDrawable d=new GradientDrawable();d.setColor(color);d.setCornerRadius(dp(12));if(border!=0)d.setStroke(dp(2),border);return d;}
    private Button button(String label){Button b=new Button(this);b.setText(label);b.setAllCaps(false);b.setTextColor(ink);b.setBackground(shape(surface,0));b.setFocusable(true);b.setOnFocusChangeListener((v,f)->v.setBackground(shape(f?Color.rgb(34,57,58):surface,f?accent:0)));return b;}

    @Override public void onCreate(Bundle state){
        super.onCreate(state);
        int personId=getIntent().getIntExtra("personId",0);String personName=getIntent().getStringExtra("personName");
        if(personId<=0){finish();return;}
        boolean light=getSharedPreferences("zero",MODE_PRIVATE).getString("theme","dark").equals("light");
        if(light){bg=Color.rgb(243,245,249);surface=Color.WHITE;ink=Color.rgb(24,33,48);muted=Color.rgb(83,97,116);accent=Color.rgb(10,113,94);}
        LinearLayout page=new LinearLayout(this);page.setOrientation(LinearLayout.VERTICAL);page.setBackgroundColor(bg);page.setPadding(dp(BuildConfig.TV?30:18),dp(18),dp(BuildConfig.TV?30:18),dp(22));
        LinearLayout header=new LinearLayout(this);header.setGravity(Gravity.CENTER_VERTICAL);
        Button back=button("‹ Back");back.setOnClickListener(v->finish());header.addView(back,new LinearLayout.LayoutParams(-2,dp(46)));
        LinearLayout heading=new LinearLayout(this);heading.setOrientation(LinearLayout.VERTICAL);heading.setPadding(dp(16),0,0,0);
        TextView name=text(personName==null||personName.trim().isEmpty()?"Filmography":personName,BuildConfig.TV?30:25,ink);name.setTypeface(null,Typeface.BOLD);heading.addView(name);
        heading.addView(text("Movies & TV series · TMDB combined credits",12,muted));header.addView(heading,new LinearLayout.LayoutParams(0,-2,1));page.addView(header);
        ScrollView scroll=new ScrollView(this);content=new LinearLayout(this);content.setOrientation(LinearLayout.VERTICAL);content.setPadding(0,dp(18),0,dp(24));content.addView(text("Loading filmography…",15,muted));scroll.addView(content);page.addView(scroll,new LinearLayout.LayoutParams(-1,0,1));setContentView(page);
        final String displayName=personName==null?"":personName;load(personId,displayName);
    }

    private void load(int personId,String personName){
        String configured=getSharedPreferences("zero",MODE_PRIVATE).getString("tmdbKey","").trim();String key=configured.isEmpty()?BuildConfig.DEFAULT_TMDB_KEY:configured;
        io.execute(()->{try{List<Catalog.Item> rows=ContentApi.personCredits(personId,key);ui.post(()->render(rows,personName));}catch(Exception e){ui.post(()->{content.removeAllViews();content.addView(text("Could not load filmography right now.",15,muted));});}});
    }

    private Bitmap downloadArtwork(String url){
        if(url==null||!url.startsWith("https://"))return null;Bitmap cached=images.get(url);if(cached!=null)return cached;HttpURLConnection c=null;try{c=(HttpURLConnection)new URL(url).openConnection();c.setConnectTimeout(12000);c.setReadTimeout(18000);c.setInstanceFollowRedirects(true);c.setRequestProperty("Accept","image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8");c.setRequestProperty("User-Agent","ZeroPlay/"+BuildConfig.VERSION_NAME+" Android");c.setRequestProperty("Cache-Control","no-cache");if(c.getResponseCode()!=HttpURLConnection.HTTP_OK)return null;try(InputStream in=new BufferedInputStream(c.getInputStream())){BitmapFactory.Options options=new BitmapFactory.Options();options.inPreferredConfig=Bitmap.Config.RGB_565;Bitmap bitmap=BitmapFactory.decodeStream(in,null,options);if(bitmap!=null)images.put(url,bitmap);return bitmap;}}catch(Exception ignored){return null;}finally{if(c!=null)c.disconnect();}}
    private void loadPoster(String primary,String fallback,ImageView image){
        imageIo.execute(()->{Bitmap bitmap=downloadArtwork(primary);if(bitmap==null&&!String.valueOf(fallback).equals(String.valueOf(primary)))bitmap=downloadArtwork(fallback);final Bitmap ready=bitmap;ui.post(()->{if(isDestroyed()||!image.isAttachedToWindow())return;if(ready!=null){image.setImageDrawable(null);image.setImageBitmap(ready);image.setAlpha(1f);}else{image.setImageResource(R.drawable.ic_zero);image.setAlpha(.45f);}});});
    }

    private LinearLayout creditCard(Catalog.Item item){
        LinearLayout card=new LinearLayout(this);card.setOrientation(LinearLayout.VERTICAL);card.setPadding(dp(6),dp(6),dp(6),dp(10));card.setBackground(shape(surface,0));card.setFocusable(true);card.setClickable(true);card.setContentDescription(item.title+" · "+(item.type.equals("series")?"TV series":"Movie"));
        card.setOnFocusChangeListener((v,f)->v.setBackground(shape(surface,f?accent:0)));
        ImageView poster=new ImageView(this);poster.setScaleType(ImageView.ScaleType.CENTER_CROP);poster.setBackgroundColor(bg);poster.setImageResource(R.drawable.ic_zero);poster.setAlpha(.45f);card.addView(poster,new LinearLayout.LayoutParams(-1,dp(BuildConfig.TV?230:210)));String fallback=item.raw.optString("backdrop");if(!item.poster.isEmpty()||!fallback.isEmpty())loadPoster(item.poster,fallback,poster);
        TextView title=text(item.title,BuildConfig.TV?16:14,ink);title.setTypeface(null,Typeface.BOLD);title.setMaxLines(2);title.setEllipsize(TextUtils.TruncateAt.END);LinearLayout.LayoutParams titleLp=new LinearLayout.LayoutParams(-1,-2);titleLp.setMargins(dp(4),dp(9),dp(4),0);card.addView(title,titleLp);
        String meta=(item.type.equals("series")?"TV SERIES":"MOVIE")+(item.year>0?" · "+item.year:"");TextView details=text(meta,12,muted);LinearLayout.LayoutParams metaLp=new LinearLayout.LayoutParams(-1,-2);metaLp.setMargins(dp(4),dp(4),dp(4),0);card.addView(details,metaLp);
        return card;
    }

    private void render(List<Catalog.Item> rows,String personName){
        if(isDestroyed())return;content.removeAllViews();if(rows.isEmpty()){content.addView(text("No movie or TV credits found for "+personName+".",15,muted));return;}
        TextView count=text(rows.size()+" titles",13,muted);content.addView(count);View gap=new View(this);content.addView(gap,new LinearLayout.LayoutParams(1,dp(12)));
        int columns=BuildConfig.TV?5:(getResources().getConfiguration().screenWidthDp>=600?4:2);
        for(int i=0;i<rows.size();i+=columns){LinearLayout line=new LinearLayout(this);for(int c=0;c<columns;c++){LinearLayout.LayoutParams lp=new LinearLayout.LayoutParams(0,-2,1);lp.setMargins(0,0,dp(c==columns-1?0:12),dp(16));if(i+c>=rows.size()){line.addView(new View(this),lp);continue;}line.addView(creditCard(rows.get(i+c)),lp);}content.addView(line);}
    }

    @Override protected void onDestroy(){ui.removeCallbacksAndMessages(null);io.shutdownNow();imageIo.shutdownNow();super.onDestroy();}
}
