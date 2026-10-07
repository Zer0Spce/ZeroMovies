package com.zerostreams.app;

import android.text.TextUtils;
import android.view.*;
import android.widget.*;
import java.util.*;

/** Final card presentation layer shared by Android phone, tablet and TV. */
public class PresentationMainActivity extends CategoryMainActivity {
    /**
     * The v1.9 TV build relied on Android's own focus dispatcher. Later 2.0 layers
     * added a MainActivity dispatchKeyEvent override that attempted to keep focus
     * inside content rows and made home navigation feel much worse. Bypass that
     * override on TV and dispatch exactly through the Activity/Window path again.
     */
    @Override public boolean dispatchKeyEvent(KeyEvent event){
        if(!BuildConfig.TV)return super.dispatchKeyEvent(event);
        onUserInteraction();
        Window window=getWindow();
        if(window!=null&&window.superDispatchKeyEvent(event))return true;
        View decor=window==null?null:window.getDecorView();
        KeyEvent.DispatcherState state=decor==null?null:decor.getKeyDispatcherState();
        return event.dispatch(this,state,this);
    }

    @Override LinearLayout card(Catalog.Item item,int token){
        LinearLayout card=super.card(item,token);
        boolean portrait=classicLayout()||flixLayout()||googleLayout();
        MainActivity.PosterFrame frame=null;
        for(int i=0;i<card.getChildCount();i++)if(card.getChildAt(i) instanceof MainActivity.PosterFrame){frame=(MainActivity.PosterFrame)card.getChildAt(i);break;}
        if(frame==null)return card;
        if(portrait){
            for(int i=frame.getChildCount()-1;i>=0;i--)if(frame.getChildAt(i) instanceof LinearLayout)frame.removeViewAt(i);
            boolean hasTopLevelText=false;for(int i=0;i<card.getChildCount();i++)if(card.getChildAt(i) instanceof TextView){hasTopLevelText=true;break;}
            if(!hasTopLevelText){
                space(card,8);
                TextView title=text(item.title,BuildConfig.TV?16:15,INK);bold(title);title.setMaxLines(2);title.setEllipsize(TextUtils.TruncateAt.END);card.addView(title);
                double rating=item.raw.optDouble("rating",0);String meta=(item.year>0?String.valueOf(item.year):item.type.toUpperCase(Locale.ROOT))+(rating>0?"  ·  ★ "+String.format(Locale.ROOT,"%.1f",rating):"");
                TextView details=text(meta,BuildConfig.TV?14:13,rating>0?ACCENT:MUTED);details.setMaxLines(1);card.addView(details);
            }
        }else{
            for(int i=0;i<frame.getChildCount();i++)if(frame.getChildAt(i) instanceof LinearLayout){
                LinearLayout overlay=(LinearLayout)frame.getChildAt(i);int index=0;
                for(int j=0;j<overlay.getChildCount();j++)if(overlay.getChildAt(j) instanceof TextView){TextView label=(TextView)overlay.getChildAt(j);label.setTextSize(index==0?(BuildConfig.TV?18:16):(BuildConfig.TV?15:13));if(index==0)bold(label);index++;}
            }
        }
        return card;
    }
}
