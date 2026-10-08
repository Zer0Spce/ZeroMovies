package com.zerostreams.app;

import android.view.*;
import android.widget.*;

/** Final UI compatibility layer: preserve base card behavior, then apply Modern poster geometry. */
public class FinalMainActivity extends FixedMainActivity {
    @Override LinearLayout card(Catalog.Item item,int token){
        LinearLayout card=super.card(item,token);
        if(!googleLayout()||item.poster.isEmpty())return card;
        FrameLayout oldFrame=null;int oldIndex=-1;
        for(int i=0;i<card.getChildCount();i++)if(card.getChildAt(i) instanceof MainActivity.PosterFrame){oldFrame=(FrameLayout)card.getChildAt(i);oldIndex=i;break;}
        if(oldFrame==null)return card;
        MainActivity.PosterFrame portrait=new MainActivity.PosterFrame(this,1.5f);
        while(oldFrame.getChildCount()>0){View child=oldFrame.getChildAt(0);oldFrame.removeViewAt(0);portrait.addView(child,child.getLayoutParams());if(child instanceof ImageView)picture(item.poster,(ImageView)child,token);}
        ViewGroup.LayoutParams lp=oldFrame.getLayoutParams();card.removeViewAt(oldIndex);card.addView(portrait,oldIndex,lp);
        return card;
    }
}
