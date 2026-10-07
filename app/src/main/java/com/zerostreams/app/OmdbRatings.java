package com.zerostreams.app;

import org.json.*;
import java.net.*;
import java.io.*;
import java.util.concurrent.*;

final class OmdbRatings {
    private static final ConcurrentHashMap<String,Entry> cache=new ConcurrentHashMap<>();
    private static final class Entry {final String value;final long until;Entry(String value,long until){this.value=value;this.until=until;}}
    static String rotten(String imdb) throws Exception {
        String key=BuildConfig.DEFAULT_OMDB_KEY==null?"":BuildConfig.DEFAULT_OMDB_KEY.trim();
        if(key.isEmpty()||imdb==null||!imdb.matches("tt[0-9]+"))return "";
        Entry saved=cache.get(imdb);if(saved!=null&&saved.until>System.currentTimeMillis())return saved.value;
        URL url=new URL("https://www.omdbapi.com/?apikey="+URLEncoder.encode(key,"UTF-8")+"&i="+URLEncoder.encode(imdb,"UTF-8")+"&plot=short&r=json");
        HttpURLConnection c=(HttpURLConnection)url.openConnection();c.setConnectTimeout(9000);c.setReadTimeout(12000);c.setInstanceFollowRedirects(false);c.setRequestProperty("Accept","application/json");
        String value="";
        try{if(c.getResponseCode()!=200)return "";try(InputStream in=c.getInputStream()){Object raw=new JSONTokener(Catalog.read(in,500_000)).nextValue();if(raw instanceof JSONObject){JSONArray ratings=((JSONObject)raw).optJSONArray("Ratings");if(ratings!=null)for(int i=0;i<ratings.length();i++){JSONObject row=ratings.optJSONObject(i);if(row!=null&&"Rotten Tomatoes".equals(row.optString("Source"))&&row.optString("Value").matches("[0-9]{1,3}%")){value=row.optString("Value");break;}}}}}finally{c.disconnect();}
        cache.put(imdb,new Entry(value,System.currentTimeMillis()+6L*60L*60L*1000L));return value;
    }
    private OmdbRatings(){}
}
