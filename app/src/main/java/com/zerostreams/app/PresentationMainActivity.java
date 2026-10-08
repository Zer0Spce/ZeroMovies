package com.zerostreams.app;

import android.graphics.Rect;
import android.os.Bundle;
import android.text.TextUtils;
import android.view.*;
import android.widget.*;
import java.util.*;

/** Final card presentation layer shared by Android phone, tablet and TV. */
public class PresentationMainActivity extends CategoryMainActivity {

    @Override public void onCreate(Bundle state){
        android.content.SharedPreferences prefs=getSharedPreferences("zero",MODE_PRIVATE);
        android.content.SharedPreferences.Editor editor=prefs.edit();boolean changed=false;
        if(!prefs.contains("uiLayout")){editor.putString("uiLayout","google");changed=true;}
        if(!prefs.contains("liveCignal")){editor.putBoolean("liveCignal",true);changed=true;}
        if(!prefs.contains("liveConverge")){editor.putBoolean("liveConverge",true);changed=true;}
        if(changed)editor.commit();
        super.onCreate(state);
    }

    /** 2.0.1: Modern UI calls the landing page Home and exposes Categories on TV. */
    @Override void addGoogleNavigation(LinearLayout body){
        super.addGoogleNavigation(body);
        Button downloads=null;
        for(Map.Entry<Button,String> entry:new ArrayList<>(modernTabs.entrySet())){
            Button button=entry.getKey();String tab=entry.getValue();
            if("Home".equals(tab))button.setText("Home");
            if(BuildConfig.TV&&"Downloads".equals(tab))downloads=button;
        }
        if(downloads!=null){
            modernTabs.remove(downloads);
            downloads.setText("Categories");
            downloads.setContentDescription("Categories");
            downloads.setOnClickListener(v->layoutOpen("Categories"));
            Button categories=downloads;
            downloads.setOnFocusChangeListener((v,f)->styleModernTab(categories,"Categories",f));
            modernTabs.put(downloads,"Categories");
            styleModernTab(downloads,"Categories",false);
        }
    }

    @Override void sportsPage(int token){
        super.sportsPage(token);
        LinearLayout host=contentHost();if(host!=null)replaceSportsRefreshCopy(host);
    }

    private void replaceSportsRefreshCopy(View view){
        if(view instanceof TextView){TextView label=(TextView)view;String value=String.valueOf(label.getText());if(value.contains("catalogue refreshes every minute"))label.setText(value.replace("catalogue refreshes every minute","catalogue refreshes every hour"));}
        if(view instanceof ViewGroup){ViewGroup group=(ViewGroup)view;for(int i=0;i<group.getChildCount();i++)replaceSportsRefreshCopy(group.getChildAt(i));}
    }

    /**
     * Preserve the proven v1.5 Android TV navigation path.
     * Main/home navigation is handled by Android's normal focus dispatch with no
     * custom interception, throttling, row confinement or spatial remapping.
     */
    @Override public boolean dispatchKeyEvent(KeyEvent event){
        return super.dispatchKeyEvent(event);
    }

    @Override public void onBackPressed(){
        ExitConfirmation.show(this,"Exit ZeroPlay?","Are you sure you want to close ZeroPlay?",this::exitZeroPlay);
    }

    private void exitZeroPlay(){
        super.onBackPressed();
    }

    /** Modern UI Movies/Shows use the same compact TV scale as the fixed home rows. */
    @Override void grid(List<Catalog.Item> rows,int token){
        if(!BuildConfig.TV||!googleLayout()){super.grid(rows,token);return;}
        LinearLayout host=contentHost();
        if(host==null){super.grid(rows,token);return;}
        final int columns=5;
        for(int i=0;i<rows.size();i+=columns){
            LinearLayout line=new LinearLayout(this);
            for(int c=0;c<columns;c++){
                LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(0,-2,1);
                p.setMargins(0,0,dp(c==columns-1?0:12),dp(18));
                line.addView(i+c<rows.size()?card(rows.get(i+c),token):new View(this),p);
            }
            host.addView(line);
        }
    }

    private LinearLayout contentHost(){
        try{
            java.lang.reflect.Field field=MainActivity.class.getDeclaredField("content");
            field.setAccessible(true);
            Object value=field.get(this);
            return value instanceof LinearLayout?(LinearLayout)value:null;
        }catch(Exception ignored){return null;}
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
