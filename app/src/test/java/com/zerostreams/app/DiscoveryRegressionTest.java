package com.zerostreams.app;

import android.content.SharedPreferences;
import com.google.zxing.*;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import org.json.*;
import org.junit.Test;
import java.util.*;
import static org.junit.Assert.*;

public class DiscoveryRegressionTest {
    @Test public void visibleAdvertisingQrIsDecodedWithoutOpeningIt() throws Exception {
        String address="https://unswung.gurlleviter.cyou/ri/123?uuid=00000000-0000-0000-0000-000000000000";
        BitMatrix qr=new QRCodeWriter().encode(address,BarcodeFormat.QR_CODE,330,330);
        int width=720,height=450;int[] pixels=new int[width*height];Arrays.fill(pixels,0xffffffff);
        for(int y=0;y<330;y++)for(int x=0;x<330;x++)if(qr.get(x,y))pixels[(y+60)*width+x+195]=0xff000000;
        assertEquals(address,QrAdDetector.decode(pixels,width,height));assertTrue(QrAdDetector.isAdUrl(address));
        assertTrue(QrAdDetector.isAdUrl("https://rotated.othercampaign.cyou/ri/123?uuid=00000000-0000-0000-0000-000000000000"));
        assertFalse(QrAdDetector.isAdUrl("https://challenges.cloudflare.com/ri/123?uuid=00000000-0000-0000-0000-000000000000"));
        assertFalse(QrAdDetector.isAdUrl("https://www.themoviedb.org/movie/299534"));
        assertFalse(QrAdDetector.isAdUrl("https://other.cyou/login?uuid=00000000-0000-0000-0000-000000000000"));
        Arrays.fill(pixels,0xff090a10);assertEquals("",QrAdDetector.decode(pixels,width,height));
    }
    @Test public void smallAdvertisingQrOnDarkVideoIsDetectedAmongMultipleCodes() throws Exception {
        String ad="https://rotated.othercampaign.cyou/ri/123/?uuid=00000000-0000-0000-0000-000000000000";
        int width=1280,height=720;int[] pixels=new int[width*height];Arrays.fill(pixels,0xff090a10);
        String[] values={"https://www.themoviedb.org/movie/299534",ad};
        for(int n=0;n<values.length;n++){BitMatrix qr=new QRCodeWriter().encode(values[n],BarcodeFormat.QR_CODE,220,220);for(int y=0;y<220;y++)for(int x=0;x<220;x++)pixels[(y+240)*width+x+150+n*700]=qr.get(x,y)?0xff000000:0xffffffff;}
        assertEquals(ad,QrAdDetector.decode(pixels,width,height));
    }
    @Test public void searchHistoryIsRecentDeduplicatedAndBounded() throws Exception {
        HistoryStore store=new HistoryStore(new MemoryPrefs());store.search(" dune ");store.search("DUNE");
        assertEquals(1,store.read("searchHistory").length());assertEquals("DUNE",store.read("searchHistory").getJSONObject(0).getString("query"));
        for(int i=0;i<35;i++)store.search("Query "+i);
        assertEquals(30,store.read("searchHistory").length());assertEquals("Query 34",store.read("searchHistory").getJSONObject(0).getString("query"));
        store.remove("searchHistory","Query 34");assertEquals(29,store.read("searchHistory").length());store.clear("searchHistory");assertEquals(0,store.read("searchHistory").length());
    }
    @Test public void playbackEventsMustMatchTheCurrentTitleAndClearRemovesResumeData() throws Exception {
        MemoryPrefs prefs=new MemoryPrefs();HistoryStore store=new HistoryStore(prefs);
        Catalog.Item item=new Catalog.Item(new JSONObject().put("id","tmdb-movie-1").put("title","Example").put("type","movie"));prefs.edit().putString("saved:"+item.id,item.raw.toString()).apply();store.started(item,item.id);
        JSONObject event=new JSONObject().put("id",2).put("type","movie").put("timestamp",120).put("duration",240);
        store.progress(item.id,"movie",event);assertFalse(prefs.contains("percent:"+item.id));event.put("id",1);store.progress(item.id,"movie",event);assertEquals(50,prefs.getInt("percent:"+item.id,-1));assertEquals(120000,prefs.getLong("position:"+item.id,0));
        assertEquals("Watching",store.read("watchHistory").getJSONObject(0).getString("state"));store.clear("watchHistory");assertFalse(prefs.contains("position:"+item.id));assertFalse(prefs.contains("percent:"+item.id));assertEquals(0,store.read("watchHistory").length());
        assertTrue(prefs.contains("saved:"+item.id));
    }
    @Test public void watchHistoryKeepsTheNewestHundred() throws Exception {
        HistoryStore store=new HistoryStore(new MemoryPrefs());for(int i=0;i<110;i++){Catalog.Item item=new Catalog.Item(new JSONObject().put("id","tmdb-movie-"+i).put("title","Title "+i));store.started(item,item.id);}
        assertEquals(100,store.read("watchHistory").length());assertEquals("tmdb-movie-109",store.read("watchHistory").getJSONObject(0).getString("key"));
    }
    @Test public void startingAnotherEpisodeUpdatesResumeEvenBeforeProviderProgress() throws Exception {
        MemoryPrefs prefs=new MemoryPrefs();HistoryStore store=new HistoryStore(prefs);Catalog.Item item=new Catalog.Item(new JSONObject().put("id","tmdb-series-1399").put("title","Series").put("type","series"));
        prefs.edit().putInt("resumeSeason:"+item.id,1).putInt("resumeEpisode:"+item.id,1).putInt("percent:"+item.id,80).apply();
        store.started(item,item.id+":s1e2");assertEquals(2,prefs.getInt("resumeEpisode:"+item.id,0));assertFalse(prefs.contains("percent:"+item.id));assertEquals(2,store.read("watchHistory").getJSONObject(0).getInt("episode"));
    }
    static final class MemoryPrefs implements SharedPreferences {
        final Map<String,Object> values=new HashMap<>();public Map<String,?> getAll(){return new HashMap<>(values);}public boolean contains(String k){return values.containsKey(k);}public String getString(String k,String d){Object v=values.get(k);return v instanceof String?(String)v:d;}
        @SuppressWarnings("unchecked") public Set<String> getStringSet(String k,Set<String> d){Object v=values.get(k);return v instanceof Set?(Set<String>)v:d;}public int getInt(String k,int d){Object v=values.get(k);return v instanceof Integer?(Integer)v:d;}public long getLong(String k,long d){Object v=values.get(k);return v instanceof Long?(Long)v:d;}public float getFloat(String k,float d){Object v=values.get(k);return v instanceof Float?(Float)v:d;}public boolean getBoolean(String k,boolean d){Object v=values.get(k);return v instanceof Boolean?(Boolean)v:d;}
        public void registerOnSharedPreferenceChangeListener(OnSharedPreferenceChangeListener l){}public void unregisterOnSharedPreferenceChangeListener(OnSharedPreferenceChangeListener l){}
        public Editor edit(){return new Editor(){final Map<String,Object> puts=new HashMap<>();final Set<String> removes=new HashSet<>();boolean clear;
            public Editor putString(String k,String v){puts.put(k,v);return this;}public Editor putStringSet(String k,Set<String> v){puts.put(k,new HashSet<>(v));return this;}public Editor putInt(String k,int v){puts.put(k,v);return this;}public Editor putLong(String k,long v){puts.put(k,v);return this;}public Editor putFloat(String k,float v){puts.put(k,v);return this;}public Editor putBoolean(String k,boolean v){puts.put(k,v);return this;}public Editor remove(String k){removes.add(k);return this;}public Editor clear(){clear=true;return this;}public boolean commit(){apply();return true;}public void apply(){if(clear)values.clear();for(String k:removes)values.remove(k);values.putAll(puts);}};}
    }
}
