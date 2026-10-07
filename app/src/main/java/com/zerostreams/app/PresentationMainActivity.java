package com.zerostreams.app;

import android.graphics.Rect;
import android.os.SystemClock;
import android.text.TextUtils;
import android.view.*;
import android.widget.*;
import java.util.*;

/** Final card presentation layer shared by Android phone, tablet and TV. */
public class PresentationMainActivity extends CategoryMainActivity {
    private long lastTvRepeatAt;
    private int lastTvRepeatKey=-1;
    private long presentationSurpriseUntil;
    private String presentationSurpriseId="";

    /**
     * Dispatch through Android's normal Activity/Window focus path. Only collapse
     * extremely fast hardware-repeat bursts so one physical D-pad hold cannot
     * jump through several homepage cards at once.
     */
    @Override public boolean dispatchKeyEvent(KeyEvent event){
        if(!BuildConfig.TV)return super.dispatchKeyEvent(event);
        int key=event.getKeyCode();
        boolean arrow=key==KeyEvent.KEYCODE_DPAD_LEFT||key==KeyEvent.KEYCODE_DPAD_RIGHT||key==KeyEvent.KEYCODE_DPAD_UP||key==KeyEvent.KEYCODE_DPAD_DOWN;
        if(arrow&&event.getAction()==KeyEvent.ACTION_DOWN&&event.getRepeatCount()>0){
            long now=SystemClock.elapsedRealtime();
            if(lastTvRepeatKey==key&&now-lastTvRepeatAt<135)return true;
            lastTvRepeatKey=key;lastTvRepeatAt=now;
        }else if(event.getAction()==KeyEvent.ACTION_UP&&arrow){lastTvRepeatKey=-1;}
        onUserInteraction();
        Window window=getWindow();
        if(window!=null&&window.superDispatchKeyEvent(event))return true;
        View decor=window==null?null:window.getDecorView();
        KeyEvent.DispatcherState state=decor==null?null:decor.getKeyDispatcherState();
        return event.dispatch(this,state,this);
    }

    @Override void surpriseMovie(){presentationSurpriseUntil=SystemClock.elapsedRealtime()+30000;super.surpriseMovie();}

    @Override void details(Catalog.Item item){
        boolean fromSurprise=SystemClock.elapsedRealtime()<presentationSurpriseUntil;
        if(fromSurprise){presentationSurpriseId=item.id;presentationSurpriseUntil=0;}
        else if(!item.id.equals(presentationSurpriseId))presentationSurpriseId="";
        super.details(item);
        if(item.id.equals(presentationSurpriseId)){
            View decor=getWindow().getDecorView();
            decor.post(this::placeSurpriseAgain);
            decor.postDelayed(this::placeSurpriseAgain,180);
            decor.postDelayed(this::placeSurpriseAgain,650);
        }
    }

    private void placeSurpriseAgain(){
        if(presentationSurpriseId.isEmpty())return;
        View root=getWindow().getDecorView();
        Button anchor=findAction(root,"download");if(anchor==null)anchor=findAction(root,"watch now");if(anchor==null)anchor=findAction(root,"resume");if(anchor==null)anchor=findAction(root,"source");if(anchor==null)return;
        ViewParent parent=anchor.getParent();if(!(parent instanceof LinearLayout))return;LinearLayout actions=(LinearLayout)parent;
        for(int i=0;i<actions.getChildCount();i++){View child=actions.getChildAt(i);if(child instanceof Button&&String.valueOf(((Button)child).getText()).toLowerCase(Locale.ROOT).contains("surprise me again"))return;}
        Button again=button("🎲 Surprise me again",this::surpriseMovie);again.setTextColor(android.graphics.Color.WHITE);again.setBackground(shape(android.graphics.Color.rgb(183,59,80),0));again.setOnFocusChangeListener((v,f)->v.setBackground(shape(f?android.graphics.Color.rgb(133,35,53):android.graphics.Color.rgb(183,59,80),f?INK:0)));
        if(actions.getOrientation()==LinearLayout.HORIZONTAL){LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(-2,dp(48));p.setMargins(dp(8),0,0,0);actions.addView(again,p);}
        else{LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(-1,dp(48));p.setMargins(0,dp(8),0,0);actions.addView(again,p);}
    }

    private Button findAction(View root,String needle){
        if(root instanceof Button&&String.valueOf(((Button)root).getText()).toLowerCase(Locale.ROOT).contains(needle))return (Button)root;
        if(root instanceof ViewGroup){ViewGroup group=(ViewGroup)root;for(int i=0;i<group.getChildCount();i++){Button found=findAction(group.getChildAt(i),needle);if(found!=null)return found;}}
        return null;
    }

    @Override void carousel(List<Catalog.Item> all,int token){
        super.carousel(all,token);
        if(flixLayout()&&BuildConfig.TV){View root=getWindow().getDecorView();root.post(this::compactFlixRightPanel);root.postDelayed(this::compactFlixRightPanel,350);}
    }

    private void compactFlixRightPanel(){
        if(!flixLayout()||!BuildConfig.TV)return;View root=getWindow().getDecorView();int width=getResources().getDisplayMetrics().widthPixels;compactFlixRightPanel(root,width);
    }
    private void compactFlixRightPanel(View view,int width){
        if(view instanceof ViewGroup){
            ViewGroup group=(ViewGroup)view;Rect bounds=new Rect();boolean rightEntry=group.isFocusable()&&group.getGlobalVisibleRect(bounds)&&bounds.left>width*.66&&bounds.height()<=dp(100)&&bounds.width()>dp(120);
            if(rightEntry)compactFlixLabels(group);
            for(int i=0;i<group.getChildCount();i++)compactFlixRightPanel(group.getChildAt(i),width);
        }
    }
    private void compactFlixLabels(View view){
        if(view instanceof TextView){TextView label=(TextView)view;String value=String.valueOf(label.getText()).trim();label.setIncludeFontPadding(false);label.setMaxLines(1);label.setEllipsize(TextUtils.TruncateAt.END);label.setLineSpacing(0,1f);if(value.matches("\\d{1,2}"))label.setTextSize(16);else if(value.contains("★"))label.setTextSize(10.5f);else label.setTextSize(12.5f);}
        if(view instanceof ViewGroup){ViewGroup group=(ViewGroup)view;for(int i=0;i<group.getChildCount();i++)compactFlixLabels(group.getChildAt(i));}
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
