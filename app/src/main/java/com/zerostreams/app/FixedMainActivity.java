package com.zerostreams.app;

import android.app.*;
import android.content.*;
import android.graphics.*;
import android.os.*;
import android.text.*;
import android.view.*;
import android.widget.*;
import org.json.*;
import java.util.*;
import java.util.concurrent.*;

/** Small override layer for UI fixes while preserving the v1.9-based MainActivity. */
public class FixedMainActivity extends MainActivity {
    private final ExecutorService fixIo=Executors.newSingleThreadExecutor();
    private final Handler fixUi=new Handler(Looper.getMainLooper());
    private long surprisePendingUntil;
    private String surpriseDetailId="";

    @Override public void onCreate(Bundle state){super.onCreate(state);getWindow().getDecorView().getViewTreeObserver().addOnGlobalLayoutListener(this::styleBranding);fixUi.post(this::styleBranding);}

    private void styleBranding(){styleBranding(getWindow().getDecorView());}
    private void styleBranding(View view){
        if(view instanceof TextView){TextView label=(TextView)view;String value=String.valueOf(label.getText()),marker="zero-brand-"+INK+"-"+ACCENT;if((value.equalsIgnoreCase("ZEROPLAY")||value.equals("ZeroPlay"))&&!marker.equals(label.getTag())){SpannableString styled=new SpannableString("ZeroPlay");styled.setSpan(new android.text.style.ForegroundColorSpan(INK),0,4,Spannable.SPAN_EXCLUSIVE_EXCLUSIVE);styled.setSpan(new android.text.style.ForegroundColorSpan(ACCENT),4,8,Spannable.SPAN_EXCLUSIVE_EXCLUSIVE);label.setTag(marker);label.setText(styled);}}
        if(view instanceof ViewGroup){ViewGroup group=(ViewGroup)view;for(int i=0;i<group.getChildCount();i++)styleBranding(group.getChildAt(i));}
    }

    @Override String themeDisplay(String id){Map<String,String> n=new HashMap<>();n.put("dark","Zero Dark");n.put("light","Zero Light");n.put("ocean","Ocean");n.put("orchid","Orchid");n.put("sunset","Sunset");n.put("midnight","Midnight Blue");n.put("ember","Ember Glow");n.put("forest","Forest Moss");n.put("rose","Rose Noir");n.put("amethyst","Amethyst");n.put("cyber","Cyber Mint");n.put("cobalt","Cobalt Sky");n.put("gold","Golden Hour");n.put("coral","Coral Night");n.put("aurora","Aurora");n.put("slate","Slate Ice");n.put("mocha","Mocha");return n.containsKey(id)?n.get(id):"Zero Dark";}

    @Override void themePicker(Button field){String[] ids={"dark","light","ocean","orchid","sunset","midnight","ember","forest","rose","amethyst","cyber","cobalt","gold","coral","aurora","slate","mocha"};String[] labels={"Zero Dark","Zero Light","Ocean","Orchid","Sunset","Midnight Blue","Ember Glow","Forest Moss","Rose Noir","Amethyst","Cyber Mint","Cobalt Sky","Golden Hour","Coral Night","Aurora","Slate Ice","Mocha"};SharedPreferences prefs=getSharedPreferences("zero",MODE_PRIVATE);showChoicePicker("Choose theme",ids,labels,prefs.getString("theme","dark"),value->{prefs.edit().putString("theme",value).apply();field.setText(themeDisplay(value)+"  ▾");switchPalette(value);styleBranding();});}

    @Override LinearLayout card(Catalog.Item item,int token){
        LinearLayout card=super.card(item,token);if(!googleLayout()||item.poster.isEmpty())return card;
        for(int i=0;i<card.getChildCount();i++)if(card.getChildAt(i) instanceof MainActivity.PosterFrame){FrameLayout old=(FrameLayout)card.getChildAt(i);MainActivity.PosterFrame portrait=new MainActivity.PosterFrame(this,1.5f);while(old.getChildCount()>0){View child=old.getChildAt(0);old.removeViewAt(0);portrait.addView(child,child.getLayoutParams());if(child instanceof ImageView)picture(item.poster,(ImageView)child,token);}ViewGroup.LayoutParams lp=old.getLayoutParams();card.removeViewAt(i);card.addView(portrait,i,lp);break;}return card;
    }

    @Override void surpriseMovie(){surprisePendingUntil=SystemClock.elapsedRealtime()+20000;super.surpriseMovie();}
    @Override void details(Catalog.Item item){if(SystemClock.elapsedRealtime()<surprisePendingUntil){surpriseDetailId=item.id;surprisePendingUntil=0;}else if(!item.id.equals(surpriseDetailId))surpriseDetailId="";super.details(item);}

    @Override void titleExtras(LinearLayout target,JSONObject data,Catalog.Item item,int token){
        super.titleExtras(target,data,item,token);
        if(item.id.equals(surpriseDetailId)){space(target,10);Button again=button("🎲 Surprise me again",this::surpriseMovie);again.setTextColor(BG);again.setBackground(shape(ACCENT,0));target.addView(again,new LinearLayout.LayoutParams(-1,dp(48)));}
        JSONObject credits=data.optJSONObject("credits");JSONArray cast=credits==null?null:credits.optJSONArray("cast");if(cast==null)return;HorizontalScrollView rail=null;for(int i=target.getChildCount()-1;i>=0;i--)if(target.getChildAt(i) instanceof HorizontalScrollView){rail=(HorizontalScrollView)target.getChildAt(i);break;}if(rail==null||rail.getChildCount()==0||!(rail.getChildAt(0) instanceof LinearLayout))return;LinearLayout people=(LinearLayout)rail.getChildAt(0);int child=0;for(int i=0;i<Math.min(10,cast.length())&&child<people.getChildCount();i++){JSONObject actor=cast.optJSONObject(i);if(actor==null)continue;View person=people.getChildAt(child++);int personId=actor.optInt("id");String personName=actor.optString("name");if(personId<=0)continue;person.setFocusable(true);person.setClickable(true);person.setContentDescription("See titles starring "+personName);person.setOnClickListener(v->showPersonTitles(personId,personName));person.setOnFocusChangeListener((v,f)->v.setBackground(shape(f?alphaColor(SURFACE,0xD8):Color.TRANSPARENT,f?ACCENT:0)));}
    }

    private void showPersonTitles(int personId,String personName){message("Loading titles starring "+personName+"…");String key=tmdbKey();fixIo.execute(()->{try{List<Catalog.Item> titles=ContentApi.personCredits(personId,key);fixUi.post(()->{if(isDestroyed())return;if(titles.isEmpty()){message("No movie or series credits found for "+personName);return;}LinearLayout panel=column();panel.setPadding(dp(16),dp(12),dp(16),dp(16));for(Catalog.Item title:titles.subList(0,Math.min(40,titles.size()))){Button row=button((title.type.equals("series")?"TV · ":"Movie · ")+title.title+(title.year>0?" · "+title.year:""),()->details(title));row.setGravity(Gravity.CENTER_VERTICAL|Gravity.START);panel.addView(row,new LinearLayout.LayoutParams(-1,dp(BuildConfig.TV?52:48)));space(panel,6);}ScrollView scroll=new ScrollView(this);scroll.addView(panel);AlertDialog dialog=new AlertDialog.Builder(this).setTitle(personName).setView(scroll).setNegativeButton("Close",null).create();dialog.show();if(dialog.getWindow()!=null)dialog.getWindow().setBackgroundDrawable(shape(BG,0));});}catch(Exception e){fixUi.post(()->message("Could not load "+personName+"'s titles right now."));}});}

    private void manualUpdateCheck(){try{java.lang.reflect.Field field=MainActivity.class.getDeclaredField("updater");field.setAccessible(true);AppUpdater appUpdater=(AppUpdater)field.get(this);if(appUpdater!=null)appUpdater.check(true);else message("Updater is not ready yet.");}catch(Exception e){message("Could not start update check.");}}
    @Override void settings(){new AlertDialog.Builder(this).setTitle("Settings").setItems(new String[]{"All ZeroPlay settings","Live TV channel providers","Check for updates"},(d,which)->{if(which==0)FixedMainActivity.super.settings();else if(which==1)providerSettings();else manualUpdateCheck();}).setNegativeButton("Close",null).show();}
    private void providerSettings(){SharedPreferences prefs=getSharedPreferences("zero",MODE_PRIVATE);LinearLayout panel=column();panel.setPadding(dp(20),dp(16),dp(20),dp(16));Switch cignal=new Switch(this);cignal.setText("Enable Cignal channels");cignal.setTextColor(INK);cignal.setChecked(prefs.getBoolean("liveCignal",false));panel.addView(cignal);Switch converge=new Switch(this);converge.setText("Enable Converge channels");converge.setTextColor(INK);converge.setChecked(prefs.getBoolean("liveConverge",true));panel.addView(converge);panel.addView(text("Cignal is disabled by default on Android. Other Live TV channels remain available.",12,MUTED));new AlertDialog.Builder(this).setTitle("Live TV channel providers").setView(panel).setPositiveButton("Save",(d,n)->{prefs.edit().putBoolean("liveCignal",cignal.isChecked()).putBoolean("liveConverge",converge.isChecked()).apply();load();}).setNegativeButton("Cancel",null).show();}

    @Override protected void onDestroy(){fixUi.removeCallbacksAndMessages(null);fixIo.shutdownNow();super.onDestroy();}
}
