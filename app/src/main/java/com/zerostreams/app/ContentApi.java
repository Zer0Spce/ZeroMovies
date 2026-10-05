package com.zerostreams.app;

import org.json.*;
import java.net.*;
import java.io.*;
import java.util.*;

final class ContentApi {
    static final String MANGA="https://api.mangadex.org";
    static final String LIVE="https://broken-cake-8f46.bingeflex.workers.dev/https://streamed.su";
    static Object json(String address) throws Exception {
        URL url=new URL(address);if(!url.getProtocol().equals("https"))throw new IOException("HTTPS required");
        HttpURLConnection c=(HttpURLConnection)url.openConnection();c.setConnectTimeout(12000);c.setReadTimeout(20000);c.setInstanceFollowRedirects(false);c.setRequestProperty("Accept","application/json");
        try{if(c.getResponseCode()!=200)throw new IOException("Content service HTTP "+c.getResponseCode());try(InputStream in=c.getInputStream()){return new JSONTokener(Catalog.read(in,5_000_000)).nextValue();}}finally{c.disconnect();}
    }
    static String title(JSONObject attributes) {
        JSONObject names=attributes.optJSONObject("title");String title=names==null?"Manga":names.optString("en");
        if(title.isEmpty()){JSONArray alt=attributes.optJSONArray("altTitles");if(alt!=null)for(int i=0;i<alt.length();i++){String english=alt.optJSONObject(i)==null?"":alt.optJSONObject(i).optString("en");if(!english.isEmpty()){title=english;break;}}}
        if(title.isEmpty()&&names!=null){Iterator<String> keys=names.keys();if(keys.hasNext())title=names.optString(keys.next());}return title;
    }
    static List<Catalog.Item> manga(String query,int offset) throws Exception {
        String url=MANGA+"/manga?limit=40&offset="+offset+"&includes%5B%5D=cover_art&contentRating%5B%5D=safe&contentRating%5B%5D=suggestive&order%5BfollowedCount%5D=desc"+(query.isEmpty()?"":"&title="+URLEncoder.encode(query,"UTF-8"));
        JSONArray data=((JSONObject)json(url)).getJSONArray("data");List<Catalog.Item> rows=new ArrayList<>();
        for(int i=0;i<data.length();i++){JSONObject m=data.getJSONObject(i),a=m.getJSONObject("attributes"),description=a.optJSONObject("description");String id=m.getString("id"),poster="";
            JSONArray relationships=m.optJSONArray("relationships");if(relationships!=null)for(int j=0;j<relationships.length();j++){JSONObject rel=relationships.getJSONObject(j);if(rel.optString("type").equals("cover_art")&&rel.optJSONObject("attributes")!=null){String file=rel.getJSONObject("attributes").optString("fileName");if(!file.isEmpty())poster="https://uploads.mangadex.org/covers/"+id+"/"+file+".256.jpg";}}
            JSONObject item=new JSONObject().put("id","manga-"+id).put("mangaId",id).put("title",title(a)).put("type","manga").put("description",description==null?"":description.optString("en")).put("poster",poster).put("year",a.optInt("year"));rows.add(new Catalog.Item(item));
        }return rows;
    }
    static JSONArray chapters(String id,int offset) throws Exception {
        return ((JSONObject)json(MANGA+"/manga/"+id+"/feed?translatedLanguage%5B%5D=en&order%5Bchapter%5D=desc&limit=100&offset="+offset)).getJSONArray("data");
    }
    static List<Catalog.Item> live(String base) throws Exception {
        Object raw=json(base+"/api/matches/all-today");if(!(raw instanceof JSONArray))throw new IOException("Invalid live event response");JSONArray data=(JSONArray)raw;List<Catalog.Item> rows=new ArrayList<>();
        for(int i=0;i<data.length();i++){JSONObject event=data.getJSONObject(i);String poster=event.optString("poster");if(!poster.startsWith("https://"))poster=poster.isEmpty()?"":base+poster;
            JSONObject item=new JSONObject().put("id","live-"+event.getString("id")).put("title",event.optString("title","Live event")).put("type","live").put("description",event.optString("category","Live sports").toUpperCase(Locale.ROOT)).put("poster",poster).put("streams",new JSONArray()).put("liveSources",event.optJSONArray("sources")).put("liveBase",base);rows.add(new Catalog.Item(item));
        }return rows;
    }
    static JSONArray liveStreams(Catalog.Item event) throws Exception {
        JSONArray result=new JSONArray(),sources=event.raw.optJSONArray("liveSources");if(sources==null)return result;String base=event.raw.optString("liveBase",LIVE);
        for(int i=0;i<sources.length();i++){JSONObject source=sources.getJSONObject(i);String type=source.optString("source"),id=source.optString("id");if(!type.matches("[A-Za-z0-9_-]+")||!id.matches("[A-Za-z0-9_-]+"))continue;
            try{Object response=json(base+"/api/stream/"+type+"/"+id);if(!(response instanceof JSONArray))continue;JSONArray streams=(JSONArray)response;
                for(int j=0;j<streams.length();j++){JSONObject stream=streams.getJSONObject(j);String url=stream.optString("embedUrl");if(url.startsWith("https://"))result.put(new JSONObject().put("label",stream.optString("language","Live")+" · "+(stream.optBoolean("hd")?"HD":"SD")+" · "+type+" "+stream.optInt("streamNo",j+1)).put("url",url).put("embed",true));}
            }catch(Exception ignored){}
        }return result;
    }
    static JSONArray movieSources(String tmdb,String type,int season,int episode) throws JSONException {
        JSONArray result=new JSONArray();if(!tmdb.matches("[0-9]+"))return result;
        String suffix=type.equals("movie")?"movie/"+tmdb:"tv/"+tmdb+"/"+season+"/"+episode;
        result.put(new JSONObject().put("label","Server 1 · Vidfast").put("url","https://vidfast.pro/"+suffix).put("embed",true));
        result.put(new JSONObject().put("label","Server 2 · Vidzee").put("url","https://player.vidzee.wtf/embed/"+suffix).put("embed",true));
        result.put(new JSONObject().put("label","Server 3 · Vidnest").put("url","https://vidnest.fun/"+suffix).put("embed",true));
        return result;
    }
}
