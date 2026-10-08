package com.zerostreams.app;

import android.graphics.*;
import android.os.*;
import android.view.View;
import android.widget.*;
import org.json.*;
import java.util.*;
import java.util.concurrent.*;

/** Final category artwork pass: dynamic TMDB art with best-effort de-duplication. */
public class CategoryMainActivity extends ReleaseMainActivity {
    private final ExecutorService categoryIo=Executors.newSingleThreadExecutor();
    private final Handler categoryUi=new Handler(Looper.getMainLooper());
    private final Set<String> categoryArtworkUsed=Collections.synchronizedSet(new HashSet<>());

    @Override void genrePicture(String type,int id,ImageView image,int token){
        image.setAlpha(.94f);if(Build.VERSION.SDK_INT>=31)image.setRenderEffect(RenderEffect.createBlurEffect(dp(1.1f),dp(1.1f),Shader.TileMode.CLAMP));
        final String key=tmdbKey();if(key.isEmpty()){super.genrePicture(type,id,image,token);return;}
        categoryIo.execute(()->{try{
            JSONObject page=id==-16?ContentApi.animeData(key,type,1):id<=-101?ContentApi.categoryData(key,type,id,1):ContentApi.genreData(key,type,id,1);JSONArray rows=page.optJSONArray("results");String chosen="";
            if(rows!=null)for(int pass=0;pass<2&&chosen.isEmpty();pass++)for(int i=0;i<rows.length();i++){JSONObject row=rows.optJSONObject(i);if(row==null)continue;String path=row.optString("backdrop_path");if(path.isEmpty())path=row.optString("poster_path");String url=ContentApi.image(path,"w780");if(url.isEmpty())continue;if(pass==0&&categoryArtworkUsed.contains(url))continue;chosen=url;break;}
            final String art=chosen;if(!art.isEmpty())categoryArtworkUsed.add(art);categoryUi.post(()->{if(isDestroyed()||!image.isAttachedToWindow())return;if(art.isEmpty())CategoryMainActivity.super.genrePicture(type,id,image,token);else picture(art,image,token);});
        }catch(Exception ignored){categoryUi.post(()->{if(!isDestroyed()&&image.isAttachedToWindow())CategoryMainActivity.super.genrePicture(type,id,image,token);});}});
    }

    @Override void render(){
        super.render();
        if(!"Genre".equals(currentSection()))return;
        LinearLayout host=mainContent();if(host==null)return;
        Button back=button("← Back to Categories",()->open("Categories"));
        back.setContentDescription("Back to all categories");
        LinearLayout.LayoutParams bp=new LinearLayout.LayoutParams(-2,dp(BuildConfig.TV?46:42));
        host.addView(back,0,bp);
        View gap=new View(this);host.addView(gap,1,new LinearLayout.LayoutParams(1,dp(12)));
    }

    private String currentSection(){try{java.lang.reflect.Field f=MainActivity.class.getDeclaredField("category");f.setAccessible(true);Object value=f.get(this);return value==null?"":String.valueOf(value);}catch(Exception ignored){return "";}}
    private LinearLayout mainContent(){try{java.lang.reflect.Field f=MainActivity.class.getDeclaredField("content");f.setAccessible(true);Object value=f.get(this);return value instanceof LinearLayout?(LinearLayout)value:null;}catch(Exception ignored){return null;}}

    @Override protected void onDestroy(){categoryUi.removeCallbacksAndMessages(null);categoryIo.shutdownNow();super.onDestroy();}
}
