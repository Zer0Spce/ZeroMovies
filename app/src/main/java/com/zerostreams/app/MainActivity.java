package com.zerostreams.app;

import android.app.*;
import android.os.*;
import android.content.*;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.BitmapFactory;
import android.graphics.drawable.GradientDrawable;
import android.view.*;
import android.widget.*;
import android.text.*;
import org.json.*;
import java.net.*;
import java.io.*;
import java.util.*;
import java.util.concurrent.*;

public class MainActivity extends Activity {
    static final int BG=Color.rgb(8,13,20), SURFACE=Color.rgb(19,29,42), INK=Color.rgb(238,244,248), MUTED=Color.rgb(152,169,187), ACCENT=Color.rgb(84,229,193);
    private final ExecutorService io=Executors.newFixedThreadPool(3);
    private final Handler ui=new Handler(Looper.getMainLooper());
    private List<Catalog.Item> catalog=new ArrayList<>();
    private android.content.SharedPreferences prefs;
    private LinearLayout content;
    private TextView status;
    private String category="Discover", query="";
    private int loadVersion=0, renderVersion=0;
    private boolean started=false;
    private Button selectedTab;

    int dp(float value) { return (int)(getResources().getDisplayMetrics().density*value+.5f); }
    LinearLayout column() { LinearLayout l=new LinearLayout(this); l.setOrientation(LinearLayout.VERTICAL); return l; }
    TextView text(String value,int size,int color) {
        TextView t=new TextView(this); t.setText(value); t.setTextSize(size); t.setTextColor(color); return t;
    }
    GradientDrawable shape(int color,int border) {
        GradientDrawable d=new GradientDrawable(); d.setColor(color); d.setCornerRadius(dp(12)); if(border!=0)d.setStroke(dp(2),border); return d;
    }
    Button button(String value,Runnable action) {
        Button b=new Button(this); b.setText(value); b.setAllCaps(false); b.setTextColor(INK); b.setTextSize(BuildConfig.TV?16:14);
        b.setPadding(dp(16),dp(8),dp(16),dp(8)); b.setBackground(shape(SURFACE,0)); b.setFocusable(true);
        b.setOnFocusChangeListener((v,focused)->{v.setBackground(shape(focused?Color.rgb(29,53,62):SURFACE,focused?ACCENT:0));});
        b.setOnClickListener(v->action.run()); return b;
    }
    @Override public void onCreate(Bundle saved) {
        super.onCreate(saved); prefs=getSharedPreferences("zero",MODE_PRIVATE);
        if(saved!=null) {category=saved.getString("category","Discover");query=saved.getString("query","");}
        LinearLayout root=column();root.setBackgroundColor(BG); root.setPadding(dp(BuildConfig.TV?40:20),dp(12),dp(BuildConfig.TV?40:20),0);
        root.setOnApplyWindowInsetsListener((v,insets)->{v.setPadding(dp(BuildConfig.TV?40:20),Math.max(dp(12),insets.getSystemWindowInsetTop()),dp(BuildConfig.TV?40:20),insets.getSystemWindowInsetBottom());return insets;});
        TextView logo=text("ZERO / STREAMS",BuildConfig.TV?26:23,ACCENT);logo.setTypeface(null,Typeface.BOLD);root.addView(logo);
        TextView subtitle=text(BuildConfig.TV?"Your next watch. One remote away.":"Find something worth watching.",14,MUTED);subtitle.setPadding(0,dp(5),0,dp(14));root.addView(subtitle);
        HorizontalScrollView tabs=new HorizontalScrollView(this);tabs.setHorizontalScrollBarEnabled(false);
        LinearLayout bar=new LinearLayout(this);
        for(String label:new String[]{"Discover","Movies","Series","Live","Watchlist","Continue","Settings"}) {
            Button b=button(label,()->{if(label.equals("Settings")){settings();return;}category=label;render();});
            LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(-2,dp(48));p.setMargins(0,0,dp(8),0);bar.addView(b,p);if(label.equals(category))selectedTab=b;
        }
        tabs.addView(bar);root.addView(tabs);
        EditText search=new EditText(this);search.setSingleLine(true);search.setTextColor(INK);search.setHintTextColor(MUTED);search.setHint("Search titles");search.setText(query);search.setTextSize(16);
        search.setContentDescription("Search catalog titles");search.setPadding(dp(12),dp(10),dp(12),dp(10));search.setBackground(shape(SURFACE,0));
        LinearLayout.LayoutParams sp=new LinearLayout.LayoutParams(-1,dp(52));sp.setMargins(0,dp(12),0,dp(8));root.addView(search,sp);
        search.addTextChangedListener(new TextWatcher(){public void beforeTextChanged(CharSequence s,int a,int c,int f){}public void onTextChanged(CharSequence s,int a,int b,int c){query=s.toString();render();}public void afterTextChanged(Editable e){}});
        status=text("Loading…",13,MUTED);root.addView(status);
        ScrollView scroll=new ScrollView(this);scroll.setFillViewport(true);content=column();content.setPadding(0,dp(18),0,dp(24));scroll.addView(content);root.addView(scroll,new LinearLayout.LayoutParams(-1,0,1));
        setContentView(root);if(BuildConfig.TV&&selectedTab!=null)selectedTab.requestFocus();load();started=true;
    }
    @Override protected void onResume(){super.onResume();if(started)render();}
    @Override protected void onSaveInstanceState(Bundle state){super.onSaveInstanceState(state);state.putString("category",category);state.putString("query",query);}
    void load() {
        int token=++loadVersion;status.setText("Loading catalog…");
        String endpoint=prefs.getString("endpoint","");
        io.execute(()->{try{List<Catalog.Item> rows=Catalog.load(this,endpoint);ui.post(()->{if(isDestroyed()||token!=loadVersion)return;catalog=rows;status.setText(endpoint.isEmpty()?"DEMO CATALOG · Add your backend in Settings":"Connected · "+rows.size()+" titles");render();});}
        catch(Exception e){ui.post(()->{if(isDestroyed()||token!=loadVersion)return;status.setText("Could not load catalog. Check Settings or retry.");Toast.makeText(this,e.getMessage(),Toast.LENGTH_LONG).show();});}});
    }
    Set<String> favorites(){return new HashSet<>(prefs.getStringSet("favorites",Collections.emptySet()));}
    boolean matches(Catalog.Item item) {
        if(!item.title.toLowerCase(Locale.ROOT).contains(query.toLowerCase(Locale.ROOT)))return false;
        switch(category){case "Movies":return item.type.equals("movie");case "Series":return item.type.equals("series");case "Live":return item.type.equals("live");case "Watchlist":return favorites().contains(item.id);case "Continue":return prefs.getLong("position:"+item.id,0)>0;default:return true;}
    }
    void render() {
        if(content==null)return;int token=++renderVersion;content.removeAllViews();
        TextView heading=text(category,BuildConfig.TV?28:25,INK);heading.setTypeface(null,Typeface.BOLD);heading.setPadding(0,0,0,dp(16));content.addView(heading);
        List<Catalog.Item> filtered=new ArrayList<>();for(Catalog.Item item:catalog)if(matches(item))filtered.add(item);
        if(filtered.isEmpty()){content.addView(text(catalog.isEmpty()?"Your catalog will appear here.":"No titles here yet.",17,MUTED));return;}
        if(category.equals("Discover")&&query.isEmpty()) {
            Catalog.Item hero=filtered.get(0);LinearLayout h=column();h.setPadding(dp(20),dp(20),dp(20),dp(20));h.setBackground(new GradientDrawable(GradientDrawable.Orientation.TL_BR,new int[]{Color.rgb(19,54,54),SURFACE}));
            h.addView(text("FEATURED",12,ACCENT));TextView title=text(hero.title,BuildConfig.TV?36:30,INK);title.setTypeface(null,Typeface.BOLD);h.addView(title);
            TextView description=text(hero.description,15,MUTED);description.setMaxLines(3);description.setPadding(0,dp(8),0,dp(12));h.addView(description);h.addView(button("View title",()->details(hero)));content.addView(h);
            TextView browse=text("Browse the catalog",20,INK);browse.setPadding(0,dp(24),0,dp(14));content.addView(browse);
        }
        int columns=BuildConfig.TV?4:(getResources().getConfiguration().screenWidthDp>=600?3:2);
        for(int i=0;i<filtered.size();i+=columns){LinearLayout row=new LinearLayout(this);
            for(int c=0;c<columns;c++){int index=i+c;LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(0,-2,1);p.setMargins(0,0,dp(c==columns-1?0:10),dp(12));
                if(index>=filtered.size()){row.addView(new View(this),p);continue;}
                Catalog.Item item=filtered.get(index);LinearLayout card=column();card.setPadding(dp(10),dp(10),dp(10),dp(10));card.setBackground(shape(SURFACE,0));card.setFocusable(true);card.setClickable(true);card.setContentDescription(item.title+", "+item.type);card.setOnClickListener(v->details(item));card.setOnFocusChangeListener((v,f)->v.setBackground(shape(SURFACE,f?ACCENT:0)));
                ImageView poster=new ImageView(this);poster.setScaleType(ImageView.ScaleType.CENTER_CROP);poster.setImageResource(com.zerostreams.app.R.drawable.ic_zero);card.addView(poster,new LinearLayout.LayoutParams(-1,dp(BuildConfig.TV?140:175)));
                if(!item.poster.isEmpty())loadPoster(item.poster,poster,token);
                TextView title=text(item.title,16,INK);title.setTypeface(null,Typeface.BOLD);title.setMaxLines(2);title.setPadding(0,dp(10),0,dp(5));card.addView(title);
                card.addView(text(item.type.toUpperCase(Locale.ROOT)+(item.year>0?" · "+item.year:""),12,ACCENT));row.addView(card,p);
            }content.addView(row);
        }
    }
    void loadPoster(String address,ImageView target,int token) {
        io.execute(()->{HttpURLConnection connection=null;try{URL url=new URL(address);if(!url.getProtocol().equals("https"))return;connection=(HttpURLConnection)url.openConnection();connection.setConnectTimeout(6000);connection.setReadTimeout(6000);connection.setInstanceFollowRedirects(false);if(connection.getResponseCode()!=200)return;
            byte[] bytes;try(InputStream in=connection.getInputStream();ByteArrayOutputStream out=new ByteArrayOutputStream()){byte[] b=new byte[4096];int n;while((n=in.read(b))!=-1){if(out.size()+n>3_000_000)return;out.write(b,0,n);}bytes=out.toByteArray();}
            BitmapFactory.Options options=new BitmapFactory.Options();options.inJustDecodeBounds=true;BitmapFactory.decodeByteArray(bytes,0,bytes.length,options);int sample=1;while(options.outWidth/sample>800||options.outHeight/sample>1000)sample*=2;options.inSampleSize=sample;options.inJustDecodeBounds=false;
            android.graphics.Bitmap bitmap=BitmapFactory.decodeByteArray(bytes,0,bytes.length,options);ui.post(()->{if(!isDestroyed()&&token==renderVersion&&bitmap!=null)target.setImageBitmap(bitmap);});
        }catch(Exception ignored){}finally{if(connection!=null)connection.disconnect();}});
    }
    void details(Catalog.Item item) {
        LinearLayout panel=column();panel.setPadding(dp(24),dp(16),dp(24),dp(16));
        panel.addView(text(item.description,16,Color.DKGRAY));
        Button favorite=button(favorites().contains(item.id)?"Remove from watchlist":"Add to watchlist",()->{Set<String> all=favorites();if(!all.add(item.id))all.remove(item.id);prefs.edit().putStringSet("favorites",all).apply();Toast.makeText(this,all.contains(item.id)?"Added to watchlist":"Removed from watchlist",Toast.LENGTH_SHORT).show();render();});panel.addView(favorite);
        if(item.type.equals("series")) {
            JSONArray episodes=item.episodes();if(episodes==null||episodes.length()==0)panel.addView(text("No episodes available.",15,Color.DKGRAY));
            else for(int i=0;i<episodes.length();i++){JSONObject ep=episodes.optJSONObject(i);if(ep==null)continue;String epId=ep.optString("id");if(epId.isEmpty())continue;
                panel.addView(button("S"+ep.optInt("season",1)+" E"+ep.optInt("episode",1)+" · "+ep.optString("title","Episode"),()->chooseStreams(item,ep.optJSONArray("streams"),item.id+":"+epId)));}
        }else panel.addView(button("Choose stream",()->chooseStreams(item,item.streams(),item.id)));
        ScrollView scroll=new ScrollView(this);scroll.addView(panel);new AlertDialog.Builder(this).setTitle(item.title).setView(scroll).setNegativeButton("Close",null).show();
    }
    void chooseStreams(Catalog.Item item,JSONArray streams,String key) {
        if(streams==null||streams.length()==0){Toast.makeText(this,"No playback source available for this title",Toast.LENGTH_LONG).show();return;}
        String[] labels=new String[streams.length()];for(int i=0;i<labels.length;i++){JSONObject source=streams.optJSONObject(i);labels[i]=source==null?"Invalid source":source.optString("label","Stream "+(i+1));}
        new AlertDialog.Builder(this).setTitle("Playback source").setItems(labels,(dialog,index)->{
            JSONObject source=streams.optJSONObject(index);if(source==null)return;
            try{URL url=new URL(source.optString("url"));if(!url.getProtocol().equalsIgnoreCase("https"))throw new Exception();}catch(Exception e){Toast.makeText(this,"Playback requires a valid HTTPS stream",Toast.LENGTH_LONG).show();return;}
            startActivity(new Intent(this,PlayerActivity.class).putExtra("stream",source.toString()).putExtra("title",item.title).putExtra("key",key).putExtra("parent",item.id).putExtra("live",item.type.equals("live")));
        }).setNegativeButton("Cancel",null).show();
    }
    void settings() {
        LinearLayout panel=column();panel.setPadding(dp(24),dp(12),dp(24),dp(12));
        panel.addView(text("HTTPS catalog URL (leave empty for demo)",15,Color.DKGRAY));EditText endpoint=new EditText(this);endpoint.setSingleLine(true);endpoint.setInputType(android.text.InputType.TYPE_CLASS_TEXT|android.text.InputType.TYPE_TEXT_VARIATION_URI);endpoint.setText(prefs.getString("endpoint",""));panel.addView(endpoint);
        new AlertDialog.Builder(this).setTitle("ZeroStreams settings").setView(panel).setPositiveButton("Save & refresh",(d,w)->{
            String value=endpoint.getText().toString().trim();if(!value.isEmpty())try{URL u=new URL(value);if(!u.getProtocol().equals("https")||u.getHost().isEmpty())throw new Exception();}catch(Exception e){Toast.makeText(this,"Enter a valid HTTPS URL",Toast.LENGTH_LONG).show();return;}
            prefs.edit().putString("endpoint",value).apply();catalog=new ArrayList<>();render();load();
        }).setNeutralButton("Refresh",(d,w)->load()).setNegativeButton("Cancel",null).show();
    }
    @Override protected void onDestroy(){++loadVersion;++renderVersion;io.shutdownNow();ui.removeCallbacksAndMessages(null);super.onDestroy();}
}
