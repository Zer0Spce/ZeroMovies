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

    @Override public void onCreate(Bundle state){
        super.onCreate(state);
        getWindow().getDecorView().getViewTreeObserver().addOnGlobalLayoutListener(()->{styleBranding();compactModernTvUi();});
        fixUi.post(this::styleBranding);
        fixUi.postDelayed(this::compactModernTvUi,120);
    }

    private void styleBranding(){styleBranding(getWindow().getDecorView());}
    private void styleBranding(View view){
        if(view instanceof TextView){TextView label=(TextView)view;String value=String.valueOf(label.getText()),marker="zero-brand-"+INK+"-"+ACCENT;if((value.equalsIgnoreCase("ZEROPLAY")||value.equals("ZeroPlay"))&&!marker.equals(label.getTag())){SpannableString styled=new SpannableString("ZeroPlay");styled.setSpan(new android.text.style.ForegroundColorSpan(INK),0,4,Spannable.SPAN_EXCLUSIVE_EXCLUSIVE);styled.setSpan(new android.text.style.ForegroundColorSpan(ACCENT),4,8,Spannable.SPAN_EXCLUSIVE_EXCLUSIVE);label.setTag(marker);label.setText(styled);}}
        if(view instanceof Button){Button b=(Button)view;String label=String.valueOf(b.getText()).toLowerCase(Locale.ROOT),description=String.valueOf(b.getContentDescription()).toLowerCase(Locale.ROOT);if(label.contains("update")||description.contains("check for zeroplay updates")){if(!"zero-update-control".equals(b.getTag())){b.setTag("zero-update-control");b.setTypeface(null,Typeface.BOLD);b.setTextColor(Color.WHITE);b.setOnFocusChangeListener((v,f)->{Button button=(Button)v;button.setTextColor(Color.WHITE);button.setBackground(shape(f?Color.rgb(52,149,255):Color.rgb(35,126,219),f?Color.WHITE:0));});}b.setTextColor(Color.WHITE);if(!b.hasFocus())b.setBackground(shape(Color.rgb(35,126,219),0));}}
        if(view instanceof ViewGroup){ViewGroup group=(ViewGroup)view;for(int i=0;i<group.getChildCount();i++)styleBranding(group.getChildAt(i));}
    }

    @Override String layoutDisplay(String id){return id.equals("youtube")?"Clean UI":id.equals("google")?"Modern UI":id.equals("flix")?"Flix UI - Beta":"Native / Original UI";}
    @Override void layoutPicker(Button field){String[] ids={"youtube","google","flix","classic"};String[] labels={"Clean UI","Modern UI","Flix UI - Beta","Native / Original UI"};showChoicePicker("Choose UI layout",ids,labels,layoutStyle(),value->{if(value.equals(layoutStyle()))return;getSharedPreferences("zero",MODE_PRIVATE).edit().putString("uiLayout",value).commit();field.setText(layoutDisplay(value)+"  ▾");stopPreview();recreate();});}

    @Override String themeDisplay(String id){Map<String,String> n=new HashMap<>();n.put("dark","Zero Dark");n.put("light","Zero Light");n.put("ocean","Ocean");n.put("orchid","Orchid");n.put("sunset","Sunset");n.put("midnight","Midnight Blue");n.put("ember","Ember Glow");n.put("forest","Forest Moss");n.put("rose","Rose Noir");n.put("amethyst","Amethyst");n.put("cyber","Cyber Mint");n.put("cobalt","Cobalt Sky");n.put("gold","Golden Hour");n.put("coral","Coral Night");n.put("aurora","Aurora");n.put("slate","Slate Ice");n.put("mocha","Mocha");return n.containsKey(id)?n.get(id):"Zero Dark";}

    @Override void themePicker(Button field){String[] ids={"dark","light","ocean","orchid","sunset","midnight","ember","forest","rose","amethyst","cyber","cobalt","gold","coral","aurora","slate","mocha"};String[] labels={"Zero Dark","Zero Light","Ocean","Orchid","Sunset","Midnight Blue","Ember Glow","Forest Moss","Rose Noir","Amethyst","Cyber Mint","Cobalt Sky","Golden Hour","Coral Night","Aurora","Slate Ice","Mocha"};SharedPreferences prefs=getSharedPreferences("zero",MODE_PRIVATE);showChoicePicker("Choose theme",ids,labels,prefs.getString("theme","dark"),value->{prefs.edit().putString("theme",value).apply();field.setText(themeDisplay(value)+"  ▾");switchPalette(value);styleBranding();});}

    @Override LinearLayout card(Catalog.Item item,int token){
        LinearLayout card=super.card(item,token);if(!googleLayout()||item.poster.isEmpty())return card;
        for(int i=0;i<card.getChildCount();i++)if(card.getChildAt(i) instanceof MainActivity.PosterFrame){FrameLayout old=(FrameLayout)card.getChildAt(i);MainActivity.PosterFrame portrait=new MainActivity.PosterFrame(this,1.5f);while(old.getChildCount()>0){View child=old.getChildAt(0);old.removeViewAt(0);portrait.addView(child,child.getLayoutParams());if(child instanceof ImageView)picture(item.poster,(ImageView)child,token);}ViewGroup.LayoutParams lp=old.getLayoutParams();card.removeViewAt(i);card.addView(portrait,i,lp);break;}return card;
    }

    private void compactModernTvUi(){
        if(!BuildConfig.TV||!googleLayout())return;
        compactModernTvUi(getWindow().getDecorView(),null);
    }
    private void compactModernTvUi(View view,HorizontalScrollView rail){
        HorizontalScrollView activeRail=rail;
        if(view instanceof HorizontalScrollView&&"Modern UI top navigation".contentEquals(view.getContentDescription())){
            activeRail=(HorizontalScrollView)view;
            ViewGroup.LayoutParams raw=view.getLayoutParams();
            if(raw instanceof ViewGroup.MarginLayoutParams){ViewGroup.MarginLayoutParams p=(ViewGroup.MarginLayoutParams)raw;p.height=dp(54);p.leftMargin=dp(18);p.rightMargin=dp(18);p.topMargin=dp(8);p.bottomMargin=dp(5);view.setLayoutParams(p);}else if(raw!=null){raw.height=dp(54);view.setLayoutParams(raw);}
            view.setPadding(dp(3),0,dp(3),0);
        }
        if(activeRail!=null){
            if(view instanceof TextView){TextView t=(TextView)view;String text=String.valueOf(t.getText());if(text.equalsIgnoreCase("ZeroPlay")||text.equalsIgnoreCase("ZEROPLAY")){ViewGroup.LayoutParams lp=t.getLayoutParams();if(lp!=null){lp.width=dp(132);lp.height=dp(40);t.setLayoutParams(lp);}t.setTextSize(20);}}
            if(view instanceof Button){Button b=(Button)view;ViewGroup.LayoutParams lp=b.getLayoutParams();if(lp!=null){lp.height=dp(40);b.setLayoutParams(lp);}b.setTextSize(13);b.setPadding(dp(10),0,dp(10),0);String label=String.valueOf(b.getText()).trim();if((label.equalsIgnoreCase("Search")||label.equalsIgnoreCase("For you"))&&activeRail!=null)b.setOnFocusChangeListener(new View.OnFocusChangeListener(){public void onFocusChange(View v,boolean focused){if(focused)activeRail.post(()->activeRail.smoothScrollTo(0,0));}});}
        }
        if(view instanceof LinearLayout&&view.isFocusable()&&view.isClickable()){
            CharSequence cd=view.getContentDescription();ViewParent parent=view.getParent();
            if(cd!=null&&(String.valueOf(cd).endsWith(", movie")||String.valueOf(cd).endsWith(", series"))&&parent instanceof LinearLayout&&parent.getParent() instanceof HorizontalScrollView){
                ViewGroup.LayoutParams lp=view.getLayoutParams();if(lp!=null&&lp.width!=dp(170)){lp.width=dp(170);view.setLayoutParams(lp);}
            }
        }
        if(view instanceof ViewGroup){ViewGroup g=(ViewGroup)view;for(int i=0;i<g.getChildCount();i++)compactModernTvUi(g.getChildAt(i),activeRail);}
    }

    @Override void surpriseMovie(){surprisePendingUntil=SystemClock.elapsedRealtime()+20000;super.surpriseMovie();}
    @Override void details(Catalog.Item item){
        if(SystemClock.elapsedRealtime()<surprisePendingUntil){surpriseDetailId=item.id;surprisePendingUntil=0;}else if(!item.id.equals(surpriseDetailId))surpriseDetailId="";
        super.details(item);
        if(item.id.equals(surpriseDetailId)){
            fixUi.post(this::placeSurpriseAgainInActionRow);
            fixUi.postDelayed(this::placeSurpriseAgainInActionRow,100);
            fixUi.postDelayed(this::placeSurpriseAgainInActionRow,300);
            fixUi.postDelayed(this::placeSurpriseAgainInActionRow,700);
            fixUi.postDelayed(this::placeSurpriseAgainInActionRow,1400);
        }
    }

    @Override void titleExtras(LinearLayout target,JSONObject data,Catalog.Item item,int token){
        super.titleExtras(target,data,item,token);
        if(item.type.equals("movie")){String imdb=data.optString("imdb_id");if(!imdb.isEmpty())loadRotten(target,imdb,token);}
        if(item.id.equals(surpriseDetailId)){fixUi.post(this::placeSurpriseAgainInActionRow);fixUi.postDelayed(this::placeSurpriseAgainInActionRow,250);fixUi.postDelayed(this::placeSurpriseAgainInActionRow,700);}
        JSONObject credits=data.optJSONObject("credits");JSONArray cast=credits==null?null:credits.optJSONArray("cast");if(cast==null)return;
        HorizontalScrollView rail=null;for(int i=target.getChildCount()-1;i>=0;i--)if(target.getChildAt(i) instanceof HorizontalScrollView){rail=(HorizontalScrollView)target.getChildAt(i);break;}
        if(rail==null||rail.getChildCount()==0||!(rail.getChildAt(0) instanceof LinearLayout))return;
        LinearLayout people=(LinearLayout)rail.getChildAt(0);int child=0;
        for(int i=0;i<Math.min(10,cast.length())&&child<people.getChildCount();i++){
            JSONObject actor=cast.optJSONObject(i);if(actor==null)continue;View person=people.getChildAt(child++);int personId=actor.optInt("id");String personName=actor.optString("name");if(personId<=0)continue;
            person.setFocusable(true);person.setClickable(true);person.setContentDescription("See titles starring "+personName);
            person.setOnClickListener(v->showPersonTitles(personId,personName));
            person.setOnFocusChangeListener((v,f)->v.setBackground(shape(f?alphaColor(SURFACE,0xD8):Color.TRANSPARENT,f?ACCENT:0)));
        }
    }

    private void loadRotten(LinearLayout target,String imdb,int token){
        if(BuildConfig.DEFAULT_OMDB_KEY==null||BuildConfig.DEFAULT_OMDB_KEY.trim().isEmpty())return;
        TextView score=text("Rotten Tomatoes · loading…",13,MUTED);score.setTag("zero-rotten-score");target.addView(score,Math.min(2,target.getChildCount()));
        fixIo.execute(()->{try{String rating=OmdbRatings.rotten(imdb);fixUi.post(()->{if(isDestroyed()||!score.isAttachedToWindow())return;if(rating.isEmpty())target.removeView(score);else{score.setText("🍅 Rotten Tomatoes · "+rating);score.setTextColor(ACCENT);bold(score);}});}catch(Exception ignored){fixUi.post(()->{if(score.isAttachedToWindow())target.removeView(score);});}});
    }

    private void placeSurpriseAgainInActionRow(){
        if(surpriseDetailId.isEmpty())return;View root=getWindow().getDecorView();
        Button anchor=findButton(root,"download");if(anchor==null)anchor=findButton(root,"watch now");if(anchor==null)anchor=findButton(root,"resume");if(anchor==null)anchor=findButton(root,"source");if(anchor==null)return;
        ViewParent parent=anchor.getParent();if(!(parent instanceof LinearLayout))return;LinearLayout actions=(LinearLayout)parent;
        for(int i=0;i<actions.getChildCount();i++){View child=actions.getChildAt(i);if(child instanceof Button&&String.valueOf(((Button)child).getText()).toLowerCase(Locale.ROOT).contains("surprise me again"))return;}
        Button again=button("🎲 Surprise me again",this::surpriseMovie);again.setTextColor(Color.WHITE);again.setBackground(shape(Color.rgb(183,59,80),0));again.setOnFocusChangeListener((v,f)->v.setBackground(shape(f?Color.rgb(133,35,53):Color.rgb(183,59,80),f?INK:0)));
        LinearLayout.LayoutParams p;if(actions.getOrientation()==LinearLayout.HORIZONTAL){p=new LinearLayout.LayoutParams(-2,dp(48));p.setMargins(dp(8),0,0,0);}else{p=new LinearLayout.LayoutParams(-1,dp(48));p.setMargins(0,dp(8),0,0);}actions.addView(again,p);
    }

    private Button findButton(View root,String contains){if(root instanceof Button&&root.isShown()&&String.valueOf(((Button)root).getText()).toLowerCase(Locale.ROOT).contains(contains.toLowerCase(Locale.ROOT)))return(Button)root;if(root instanceof ViewGroup){ViewGroup g=(ViewGroup)root;for(int i=g.getChildCount()-1;i>=0;i--){Button found=findButton(g.getChildAt(i),contains);if(found!=null)return found;}}return null;}

    private void showPersonTitles(int personId,String personName){startActivity(new Intent(this,PersonFilmographyActivity.class).putExtra("personId",personId).putExtra("personName",personName));}

    private void manualUpdateCheck(){try{java.lang.reflect.Field field=MainActivity.class.getDeclaredField("updater");field.setAccessible(true);AppUpdater appUpdater=(AppUpdater)field.get(this);if(appUpdater!=null)appUpdater.check(true);else message("Updater is not ready yet.");}catch(Exception e){message("Could not start update check.");}}

    @Override void settings(){FixedMainActivity.super.settings();fixUi.postDelayed(this::injectSettingsExtras,80);}

    private void injectSettingsExtras(){
        try{
            java.lang.reflect.Field field=MainActivity.class.getDeclaredField("appearanceDialog");field.setAccessible(true);AlertDialog dialog=(AlertDialog)field.get(this);if(dialog==null||!dialog.isShowing())return;
            View panelRoot=dialog.findViewById(android.R.id.content);LinearLayout panel=findSettingsPanel(panelRoot);if(panel==null||panel.findViewWithTag("zero-integrated-live-settings")!=null)return;
            View marker=new View(this);marker.setTag("zero-integrated-live-settings");panel.addView(marker,new LinearLayout.LayoutParams(1,dp(1)));
            space(panel,20);settingsHeading(panel,"LIVE TV","Channel providers");
            SharedPreferences prefs=getSharedPreferences("zero",MODE_PRIVATE);
            Switch cignal=new Switch(this);cignal.setText("Enable Cignal channels");cignal.setTextColor(INK);cignal.setChecked(prefs.getBoolean("liveCignal",false));cignal.setOnCheckedChangeListener((v,enabled)->prefs.edit().putBoolean("liveCignal",enabled).apply());panel.addView(cignal);
            Switch converge=new Switch(this);converge.setText("Enable Converge channels");converge.setTextColor(INK);converge.setChecked(prefs.getBoolean("liveConverge",true));converge.setOnCheckedChangeListener((v,enabled)->prefs.edit().putBoolean("liveConverge",enabled).apply());panel.addView(converge);
            panel.addView(text("Provider changes apply on the next Live TV refresh.",12,MUTED));
            space(panel,20);settingsHeading(panel,"UPDATE","App update");Button update=button("⇩  Check for updates",this::manualUpdateCheck);update.setContentDescription("Check for ZeroPlay updates");update.setTextColor(Color.WHITE);update.setTypeface(null,Typeface.BOLD);update.setBackground(shape(Color.rgb(35,126,219),0));update.setOnFocusChangeListener((v,f)->{Button b=(Button)v;b.setTextColor(Color.WHITE);b.setBackground(shape(f?Color.rgb(52,149,255):Color.rgb(35,126,219),f?Color.WHITE:0));});panel.addView(update,new LinearLayout.LayoutParams(-1,dp(50)));TextView build=text("ZeroPlay "+BuildConfig.VERSION_NAME+" · build "+BuildConfig.BUILD_REVISION,12,MUTED);build.setPadding(0,dp(7),0,0);panel.addView(build);
            replaceText(panel,"Mouse remains the default. Press Menu during movie playback to switch modes instantly.","Player mouse starts ON on Android TV. Press Menu during movie playback to toggle D-pad focus mode.");
            replaceText(panel,"D-pad navigation is the default on Android TV. Press Menu during movie playback to toggle optional mouse mode.","Player mouse starts ON on Android TV. Press Menu during movie playback to toggle D-pad focus mode.");
            styleBranding();
        }catch(Exception ignored){}
    }

    private LinearLayout findSettingsPanel(View root){if(root instanceof LinearLayout){LinearLayout l=(LinearLayout)root;if(l.getChildCount()>8)return l;}if(root instanceof ViewGroup){ViewGroup g=(ViewGroup)root;for(int i=0;i<g.getChildCount();i++){LinearLayout found=findSettingsPanel(g.getChildAt(i));if(found!=null)return found;}}return null;}
    private void replaceText(View root,String from,String to){if(root instanceof TextView&&String.valueOf(((TextView)root).getText()).equals(from))((TextView)root).setText(to);if(root instanceof ViewGroup){ViewGroup g=(ViewGroup)root;for(int i=0;i<g.getChildCount();i++)replaceText(g.getChildAt(i),from,to);}}

    @Override protected void onDestroy(){fixUi.removeCallbacksAndMessages(null);fixIo.shutdownNow();super.onDestroy();}
}
