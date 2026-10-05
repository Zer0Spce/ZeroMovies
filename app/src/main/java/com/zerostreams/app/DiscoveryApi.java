package com.zerostreams.app;
import java.io.IOException;
import java.util.*;
import org.json.*;
/** TMDB discovery requests; playback availability belongs to the selected player. */
final class DiscoveryApi {
    interface Request {JSONObject get(String path,String query) throws Exception;}
    private static void media(String type){if(!type.equals("movie")&&!type.equals("tv"))throw new IllegalArgumentException("Invalid media type");}
    static JSONArray genres(Request request,String type) throws Exception {
        media(type);JSONArray raw=request.get("/genre/"+type+"/list","").optJSONArray("genres"),result=new JSONArray();if(raw==null)throw new IOException("Categories unavailable");
        for(int i=0;i<raw.length();i++){JSONObject row=raw.optJSONObject(i);if(row!=null&&row.optInt("id")>0&&!row.optString("name").trim().isEmpty())result.put(row);}return result;
    }
    static JSONObject genrePage(Request request,String type,int genre,int page) throws Exception {
        media(type);if(genre<1||page<1||page>500)throw new IllegalArgumentException("Invalid category or page");
        return request.get("/discover/"+type,"&include_adult=false&with_genres="+genre+"&sort_by=popularity.desc&page="+page);
    }
    static JSONObject randomMovie(Request request,Random random,String today,Set<Long> recent) throws Exception {
        if(!today.matches("[0-9]{4}-[0-9]{2}-[0-9]{2}"))throw new IllegalArgumentException("Invalid date");
        String[] sorts={"popularity.desc","vote_count.desc","primary_release_date.desc","primary_release_date.asc"};
        String query="&include_adult=false&include_video=false&primary_release_date.lte="+today+"&vote_count.gte=20&sort_by="+sorts[random.nextInt(sorts.length)];
        JSONObject first=request.get("/discover/movie",query+"&page=1");int pages=Math.max(1,Math.min(500,first.optInt("total_pages",1))),page=1+random.nextInt(pages);
        JSONObject data=page==1?first:request.get("/discover/movie",query+"&page="+page);
        List<JSONObject> rows=valid(data.optJSONArray("results"),today),fresh=new ArrayList<>();if(rows.isEmpty())rows=valid(first.optJSONArray("results"),today);
        for(JSONObject row:rows)if(!recent.contains(row.optLong("id")))fresh.add(row);if(!fresh.isEmpty())rows=fresh;
        if(rows.isEmpty())throw new IOException("No released movie found. Try again.");return rows.get(random.nextInt(rows.size()));
    }
    private static List<JSONObject> valid(JSONArray data,String today){List<JSONObject> rows=new ArrayList<>();if(data!=null)for(int i=0;i<data.length();i++){JSONObject row=data.optJSONObject(i);if(row!=null&&row.optLong("id")>0&&!row.optBoolean("adult")&&!row.optString("title").trim().isEmpty()&&!row.optString("release_date").isEmpty()&&row.optString("release_date").compareTo(today)<=0)rows.add(row);}return rows;}
}
