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
                .put("backdrop",backdrop.matches("/[A-Za-z0-9_.-]+")?"https://image.tmdb.org/t/p/w1280"+backdrop:"").put("releaseDate",date).put("genreIds",raw.optJSONArray("genre_ids")).put("onlineSearch",search);
            rows.add(new Catalog.Item(item));
        }return rows;
    }
    static JSONObject searchPageData(String query,String key,int page) throws Exception {return tmdb("/search/multi",key,"&query="+URLEncoder.encode(query.trim(),"UTF-8")+"&include_adult=false&page="+page);}
    static JSONObject browsePageData(String key,String section,int page) throws Exception {return tmdb(section.equals("Series")?"/tv/popular":"/movie/popular",key,"&page="+page);}
    static JSONObject providerPageData(String key,String type,int provider,String region,int page) throws Exception {
        if(provider<=0||!region.matches("[A-Z]{2}")||!type.equals("movie")&&!type.equals("tv"))throw new IOException("Invalid provider");
        return tmdb("/discover/"+type,key,"&include_adult=false&with_watch_providers="+provider+"&watch_region="+region+"&with_watch_monetization_types=flatrate&sort_by=popularity.desc&page="+page);
    }
    static List<Catalog.Item> searchMovies(String query,String key,int page) throws Exception {
        return tmdbRows(tmdb("/search/multi",key,"&query="+URLEncoder.encode(query.trim(),"UTF-8")+"&include_adult=false&page="+page).getJSONArray("results"),"",true);
    }
    static List<Catalog.Item> browseMovies(String key,String section,int page) throws Exception {
        if(section.equals("Movies"))return tmdbRows(tmdb("/movie/popular",key,"&page="+page).getJSONArray("results"),"movie",false);
        if(section.equals("Series"))return tmdbRows(tmdb("/tv/popular",key,"&page="+page).getJSONArray("results"),"tv",false);
        LinkedHashMap<String,Catalog.Item> rows=new LinkedHashMap<>();
        String[][] endpoints={{"/trending/all/week","","trending"},{"/movie/popular","movie","popular"},{"/tv/popular","tv","popular"},{"/movie/now_playing","movie","nowPlaying"},{"/movie/top_rated","movie","recommended"},{"/movie/upcoming","movie","upcoming"}};
        Exception failure=null;String today=new java.text.SimpleDateFormat("yyyy-MM-dd",Locale.ROOT).format(new Date());
        for(String[] endpoint:endpoints){try{for(Catalog.Item item:tmdbRows(tmdb(endpoint[0],key,"&page=1").getJSONArray("results"),endpoint[1],false)){
            if(endpoint[2].equals("upcoming")&&item.raw.optString("releaseDate").compareTo(today)<=0)continue;
            item.raw.put(endpoint[2],true);Catalog.Item existing=rows.get(item.id);
            if(existing!=null)existing.raw.put(endpoint[2],true);else rows.put(item.id,item);
        }}catch(Exception error){failure=error;}}
        if(rows.isEmpty()&&failure!=null)throw failure;
        return new ArrayList<>(rows.values());
    }
    static String media(Catalog.Item item){return item.type.equals("series")?"tv":"movie";}
    static JSONObject details(Catalog.Item item,String key) throws Exception {
        if(!item.id.matches("tmdb-(movie|series)-[0-9]+"))throw new IOException("Not a TMDB title");
        return tmdb("/"+media(item)+"/"+item.id.substring(item.id.lastIndexOf('-')+1),key,"&append_to_response=credits,videos,recommendations");
    }
    static JSONArray providers(String key,String type,String region) throws Exception {
        if(!type.equals("movie")&&!type.equals("tv")||!region.matches("[A-Z]{2}"))throw new IOException("Invalid provider filter");
        return tmdb("/watch/providers/"+type,key,"&watch_region="+region).getJSONArray("results");
    }
    static List<Catalog.Item> providerTitles(String key,String type,int provider,String region,int page) throws Exception {
        if(provider<=0||!region.matches("[A-Z]{2}")||!type.equals("movie")&&!type.equals("tv"))throw new IOException("Invalid provider");
        return tmdbRows(tmdb("/discover/"+type,key,"&include_adult=false&with_watch_providers="+provider+"&watch_region="+region+"&with_watch_monetization_types=flatrate&sort_by=popularity.desc&page="+page).getJSONArray("results"),type,false);
    }
    static String image(String path,String size){return path.matches("/[A-Za-z0-9_.-]+")?"https://image.tmdb.org/t/p/"+size+path:"";}
    static JSONArray seasons(String id,String key) throws Exception {
        if(!id.matches("[0-9]+"))throw new IOException("Invalid series ID");
        return tmdb("/tv/"+id,key,"").getJSONArray("seasons");
    }
    static JSONArray seasonEpisodes(String id,int season,String key) throws Exception {
        JSONArray episodes=tmdb("/tv/"+id+"/season/"+season,key,"").getJSONArray("episodes"),result=new JSONArray();
        for(int i=0;i<episodes.length();i++){JSONObject ep=episodes.getJSONObject(i);int number=ep.optInt("episode_number");if(number>0)result.put(new JSONObject().put("id","s"+season+"e"+number).put("season",season).put("episode",number).put("title",ep.optString("name","Episode "+number)));}
        return result;
    }
    static JSONArray genres(String type,String key) throws Exception {return DiscoveryApi.genres((path,q)->tmdb(path,key,q),type);}
    static JSONObject animeData(String key,String type,int page)throws Exception {if(!type.equals("tv")&&!type.equals("movie")||page<1||page>500)throw new IllegalArgumentException("Invalid anime page");return tmdb("/discover/"+type,key,"&include_adult=false&with_genres=16&with_original_language=ja&sort_by=popularity.desc&page="+page);}
    static JSONObject genreData(String key,String type,int genre,int page) throws Exception {return DiscoveryApi.genrePage((path,q)->tmdb(path,key,q),type,genre,page);}
    static Catalog.Item randomMovie(String key,Random random,Set<Long> recent) throws Exception {
        String today=new java.text.SimpleDateFormat("yyyy-MM-dd",Locale.ROOT).format(new Date());
        JSONObject raw=DiscoveryApi.randomMovie((path,q)->tmdb(path,key,q),random,today,recent);return tmdbRows(new JSONArray().put(raw),"movie",false).get(0);
    }
    static JSONArray movieSources(String tmdb,String type,int season,int episode) throws JSONException {
        JSONArray result=new JSONArray();if(!tmdb.matches("[1-9][0-9]*"))return result;
        for(int i=0;i<PlaybackSources.IDS.length;i++)result.put(new JSONObject().put("label",PlaybackSources.NAMES[i]).put("url",PlaybackSources.url(tmdb,type,season,episode,PlaybackSources.IDS[i])).put("embed",true));
        return result;
    }
}
