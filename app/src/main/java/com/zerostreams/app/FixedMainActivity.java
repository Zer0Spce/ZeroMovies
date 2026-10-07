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
    private boolean buildingSurpriseDetail;

    @Override public void onCreate(Bundle state){
        super.onCreate(state);
        // Never mutate layout params from a global-layout callback: that caused Modern UI TV relayout/crash loops.
        fixUi.post(this::styleBranding);
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

    /** Build the compact Modern-TV navigation at creation time instead of resizing it during layout. */
    @Override void addGoogleNavigation(LinearLayout body){
        HorizontalScrollView top=new HorizontalScrollView(this);top.setHorizontalScrollBarEnabled(false);top.setContentDescription("Modern UI top navigation");top.setClipToOutline(true);top.setBackground(pill(alphaColor(SURFACE,0x88),alphaColor(ACCENT,0x66)));top.setElevation(dp(6));
        LinearLayout row=new LinearLayout(this);row.setGravity(Gravity.CENTER_VERTICAL);row.setPadding(dp(8),dp(4),dp(8),dp(4));TextView brand=text("ZEROPLAY",BuildConfig.TV?20:20,BuildConfig.TV?ACCENT:INK);bold(brand);brand.setLetterSpacing(.05f);brand.setGravity(Gravity.CENTER);brand.setSingleLine(true);LinearLayout.LayoutParams brandLp=new LinearLayout.LayoutParams(dp(BuildConfig.TV?132:140),dp(40));brandLp.setMargins(0,0,dp(6),0);row.addView(brand,brandLp);
        for(String tab:new String[]{"Search","Home","Movies","Series","IPTV","LiveTV","Live Sports","Downloads"}){String label=tab.equals("Home")?"For you":tab.equals("Series")?"Shows":layoutLabel(tab);Button b=modernTab(tab,label);if(BuildConfig.TV){b.setTextSize(13);b.setPadding(dp(10),dp(3),dp(10),dp(3));}LinearLayout.LayoutParams lp=new LinearLayout.LayoutParams(-2,dp(BuildConfig.TV?40:46));lp.setMargins(0,0,dp(6),0);row.addView(b,lp);}
        Button library=modernTab("Library","Library");if(BuildConfig.TV){library.setTextSize(13);library.setPadding(dp(10),dp(3),dp(10),dp(3));}LinearLayout.LayoutParams libp=new LinearLayout.LayoutParams(-2,dp(BuildConfig.TV?40:46));libp.setMargins(0,0,dp(8),0);row.addView(library,libp);
        if(BuildConfig.TV){Button settings=button("⚙",this::settings);settings.setContentDescription("Settings");settings.setTextSize(18);settings.setBackground(pill(alphaColor(SURFACE,0x78),0));settings.setOnFocusChangeListener((v,f)->settings.setBackground(pill(alphaColor(SURFACE,f?0xD8:0x78),f?ACCENT:0)));row.addView(settings,new LinearLayout.LayoutParams(dp(42),dp(40)));surpriseButton=button("🎲",this::surpriseMovie);surpriseButton.setContentDescription("Surprise me");surpriseButton.setTextSize(17);surpriseButton.setBackground(pill(alphaColor(SURFACE,0x78),0));surpriseButton.setOnFocusChangeListener((v,f)->surpriseButton.setBackground(pill(alphaColor(SURFACE,f?0xD8:0x78),f?ACCENT:0)));row.addView(surpriseButton,new LinearLayout.LayoutParams(dp(42),dp(40)));Button theme=button(lightTheme?"☾":"☀",this::toggleTheme);theme.setContentDescription("Toggle theme");theme.setTextSize(18);theme.setBackground(pill(alphaColor(SURFACE,0x78),0));theme.setOnFocusChangeListener((v,f)->theme.setBackground(pill(alphaColor(SURFACE,f?0xD8:0x78),f?ACCENT:0)));row.addView(theme,new LinearLayout.LayoutParams(dp(42),dp(40)));}
        top.addView(row);LinearLayout.LayoutParams tp=new LinearLayout.LayoutParams(-1,dp(BuildConfig.TV?54:58));tp.setMargins(dp(BuildConfig.TV?18:14),dp(BuildConfig.TV?8:8),dp(BuildConfig.TV?18:14),dp(BuildConfig.TV?5:8));body.addView(top,tp);refreshModernTabs();
    }

    @Override void posterRow(String title,List<Catalog.Item> rows,int token){
        if(!BuildConfig.TV||!googleLayout()){super.posterRow(title,rows,token);return;}
        if(rows.isEmpty())return;sectionLabel(content,title);HorizontalScrollView rail=new HorizontalScrollView(this);rail.setHorizontalScrollBarEnabled(false);LinearLayout cards=new LinearLayout(this);for(int i=0;i<Math.min(rows.size(),18);i++){LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(dp(170),-2);p.setMargins(0,0,dp(12),0);Catalog.Item item=rows.get(i);LinearLayout tile=card(item,token);if(title.equals("Continue watching"))tile.setOnClickListener(v->resume(item));cards.addView(tile,p);}rail.addView(cards);content.addView(rail);space(content,22);
    }

    @Override LinearLayout card(Catalog.Item item,int token){
        LinearLayout card=super.card(item,token);if(!googleLayout()||item.poster.isEmpty())return card;
        for(int i=0;i<card.getChildCount();i++)if(card.getChildAt(i) instanceof MainActivity.PosterFrame){FrameLayout old=(FrameLayout)card.getChildAt(i);MainActivity.PosterFrame portrait=new MainActivity.PosterFrame(this,1.5f);while(old.getChildCount()>0){View child=old.getChildAt(0);old.removeViewAt(0);portrait.addView(child,child.getLayoutParams());if(child instanceof ImageView)picture(item.poster,(ImageView)child,token);}ViewGroup.LayoutParams lp=old.getLayoutParams();card.removeViewAt(i);card.addView(portrait,i,lp);break;}return card;
    }

    @Override Button button(String label,Runnable action){
        Button result=super.button(label,action);
        final boolean attachSurprise=buildingSurpriseDetail&&"Download".equalsIgnoreCase(label)&&!surpriseDetailId.isEmpty();
        if(attachSurprise)result.addOnAttachStateChangeListener(new View.OnAttachStateChangeListener(){
            @Override public void onViewAttachedToWindow(View v){
                result.removeOnAttachStateChangeListener(this);
                result.post(()->{ViewParent parent=result.getParent();if(!(parent instanceof LinearLayout)||!result.isAttachedToWindow())return;LinearLayout actions=(LinearLayout)parent;for(int i=0;i<actions.getChildCount();i++){View child=actions.getChildAt(i);if(child instanceof Button&&String.valueOf(((Button)child).getText()).toLowerCase(Locale.ROOT).contains("surprise me again"))return;}space(actions,8);Button again=FixedMainActivity.super.button("🎲 Surprise me again",FixedMainActivity.this::surpriseMovie);again.setTextColor(Color.WHITE);again.setBackground(shape(Color.rgb(183,59,80),0));again.setOnFocusChangeListener((view,focused)->view.setBackground(shape(focused?Color.rgb(133,35,53):Color.rgb(183,59,80),focused?INK:0)));actions.addView(again,new LinearLayout.LayoutParams(-1,dp(48)));});
            }
            @Override public void onViewDetachedFromWindow(View v){}
        });
        return result;
    }

    @Override void surpriseMovie(){surprisePendingUntil=SystemClock.elapsedRealtime()+20000;super.surpriseMovie();}
    @Override void details(Catalog.Item item){
        if(SystemClock.elapsedRealtime()<surprisePendingUntil){surpriseDetailId=item.id;surprisePendingUntil=0;}else if(!item.id.equals(surpriseDetailId))surpriseDetailId="";
        buildingSurpriseDetail=item.id.equals(surpriseDetailId);
        try{super.details(item);}finally{buildingSurpriseDetail=false;}
    }

    @Override void titleExtras(LinearLayout target,JSONObject data,Catalog.Item item,int token){
        super.titleExtras(target,data,item,token);
        if(item.type.equals("movie")){String imdb=data.optString("imdb_id");if(!imdb.isEmpty())loadRotten(target,imdb,token);}
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
