package com.zerostreams.app;

import android.os.Bundle;
import android.widget.ImageView;
import java.util.*;

/**
 * Low-overhead ZeroPlay launcher used only by the Lite build flavors.
 * The standard Android and Android TV flavors never launch this class.
 */
public class LiteMainActivity extends PresentationMainActivity {
    private static final String LITE_DEFAULTS="liteDefaultsV1";

    @Override public void onCreate(Bundle state){
        android.content.SharedPreferences prefs=getSharedPreferences("zero",MODE_PRIVATE);
        if(!prefs.getBoolean(LITE_DEFAULTS,false)){
            Set<String> panels=new HashSet<>(Arrays.asList(
                "continue","watchlist","trending","popular","series","anime"
            ));
            prefs.edit()
                .putBoolean(LITE_DEFAULTS,true)
                .putBoolean("uiAnimations",false)
                .putBoolean("focusInfo",false)
                .putBoolean("focusTrailer",false)
                .putBoolean("homepageTrailer",false)
                .putStringSet("homePanels",panels)
                .putString("uiLayout","classic")
                .apply();
        }
        super.onCreate(state);
    }

    /** Lite does not render the large rotating hero carousel. */
    @Override void carousel(List<Catalog.Item> all,int token){ }

    /** Lite keeps a smaller number of cards alive in horizontal homepage rows. */
    @Override void posterRow(String title,List<Catalog.Item> rows,int token){
        if(rows==null||rows.isEmpty())return;
        int limit=Math.min(rows.size(),BuildConfig.TV?12:10);
        super.posterRow(title,new ArrayList<>(rows.subList(0,limit)),token);
    }

    /** Disable the full-screen TV backdrop/blur work on low-end hardware. */
    @Override void atmosphere(Catalog.Item item,int token){ }

    /** Request smaller TMDB artwork without changing non-TMDB URLs. */
    @Override void picture(String url,ImageView view,int token){
        String liteUrl=url;
        if(url!=null&&url.startsWith("https://image.tmdb.org/t/p/")){
            liteUrl=url.replaceFirst("/t/p/(?:w[0-9]+|original)/",BuildConfig.TV?"/t/p/w500/":"/t/p/w342/");
        }
        super.picture(liteUrl,view,token);
    }
}
