package com.zerostreams.app;

import org.json.*;
import java.net.*;
import java.io.*;
import java.util.*;

final class ContentApi {
    static final String MANGA="https://api.mangadex.org";
    static final String LIVE="https://streamed.pk";
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


    static JSONObject tmdb(String path,String key,String extra) throws Exception {
        if(key.isEmpty())throw new IOException("Add your TMDB API key in Settings");
        return (JSONObject)json("https://api.themoviedb.org/3"+path+"?api_key="+URLEncoder.encode(key,"UTF-8")+"&language=en-US"+extra);
    }
    static List<Catalog.Item> tmdbRows(JSONArray data,String mediaDefault,boolean search) throws JSONException {
        List<Catalog.Item> rows=new ArrayList<>();
        for(int i=0;i<data.length();i++){
            JSONObject raw=data.getJSONObject(i);String media=raw.optString("media_type",mediaDefault);if(!media.equals("movie")&&!media.equals("tv")||raw.optBoolean("adult"))continue;
            long id=raw.optLong("id");if(id<=0)continue;String type=media.equals("tv")?"series":"movie",name=raw.optString(media.equals("tv")?"name":"title");if(name.isEmpty())continue;
            String date=raw.optString(media.equals("tv")?"first_air_date":"release_date"),poster=raw.optString("poster_path"),backdrop=raw.optString("backdrop_path");int year=0;try{if(date.length()>=4)year=Integer.parseInt(date.substring(0,4));}catch(NumberFormatException ignored){}
            JSONObject item=new JSONObject().put("id","tmdb-"+type+"-"+id).put("title",name).put("type",type).put("year",year).put("description",raw.optString("overview")).put("rating",raw.optDouble("vote_average",0))
                .put("poster",poster.matches("/[A-Za-z0-9_.-]+")?"https://image.tmdb.org/t/p/w500"+poster:"")
                .put("backdrop",backdrop.matches("/[A-Za-z0-9_.-]+")?"https://image.tmdb.org/t/p/w1280"+backdrop:"").put("onlineSearch",search);
            rows.add(new Catalog.Item(item));
        }return rows;
    }
    static List<Catalog.Item> searchMovies(String query,String key,int page) throws Exception {
        return tmdbRows(tmdb("/search/multi",key,"&query="+URLEncoder.encode(query.trim(),"UTF-8")+"&include_adult=false&page="+page).getJSONArray("results"),"",true);
    }
    static List<Catalog.Item> browseMovies(String key,String section,int page) throws Exception {
        if(section.equals("Movies"))return tmdbRows(tmdb("/movie/popular",key,"&page="+page).getJSONArray("results"),"movie",false);
        if(section.equals("Series"))return tmdbRows(tmdb("/tv/popular",key,"&page="+page).getJSONArray("results"),"tv",false);
        LinkedHashMap<String,Catalog.Item> rows=new LinkedHashMap<>();
        String[][] endpoints={{"/trending/all/week",""},{"/movie/popular","movie"},{"/tv/popular","tv"},{"/movie/now_playing","movie"},{"/movie/top_rated","movie"}};
        for(String[] endpoint:endpoints)for(Catalog.Item item:tmdbRows(tmdb(endpoint[0],key,"&page=1").getJSONArray("results"),endpoint[1],false)){if(endpoint[0].equals("/movie/top_rated")){item.raw.put("recommended",true);Catalog.Item existing=rows.get(item.id);if(existing!=null)existing.raw.put("recommended",true);}if(!rows.containsKey(item.id))rows.put(item.id,item);}
        return new ArrayList<>(rows.values());
    }
    static JSONArray seasons(String id,String key) throws Exception {
        if(!id.matches("[0-9]+"))throw new IOException("Invalid series ID");
        return tmdb("/tv/"+id,key,"").getJSONArray("seasons");
    }
    static JSONArray seasonEpisodes(String id,int season,String key) throws Exception {
        JSONArray episodes=tmdb("/tv/"+id+"/season/"+season,key,"").getJSONArray("episodes"),result=new JSONArray();
        for(int i=0;i<episodes.length();i++){JSONObject ep=episodes.getJSONObject(i);int number=ep.optInt("episode_number");if(number>0)result.put(new JSONObject().put("id","s"+season+"e"+number).put("season",season).put("episode",number).put("title",ep.optString("name","Episode "+number)));}
        return result;
    }
    static JSONArray movieSources(String tmdb,String type,int season,int episode) throws JSONException {
        JSONArray result=new JSONArray();if(!tmdb.matches("[0-9]+"))return result;
        String suffix=type.equals("movie")?"movie/"+tmdb:"tv/"+tmdb+"/"+season+"/"+episode;
        String vidstuck="https://vidstuck.xyz/embed/"+suffix+"?branding=ZeroStreams&color=65E6CC&subtitle=english&overlay=true";
        if(!type.equals("movie"))vidstuck+="&nextEpisode=true&episodeSelector=true&autoplayNextEpisode=true";
        result.put(new JSONObject().put("label","VidStuck").put("url",vidstuck).put("embed",true));
        return result;
    }
}
