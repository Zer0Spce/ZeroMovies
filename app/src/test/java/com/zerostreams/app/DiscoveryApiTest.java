package com.zerostreams.app;
import java.util.*;
import org.json.*;
import org.junit.Test;
import static org.junit.Assert.*;
public class DiscoveryApiTest {
    @Test public void surpriseCanSelectARealIdFromBeyondTheFirstPage() throws Exception {
        List<String> requests=new ArrayList<>();DiscoveryApi.Request api=(path,q)->{requests.add(path+q);return new JSONObject().put("total_pages",9000).put("results",new JSONArray().put(new JSONObject().put("id",q.endsWith("page=500")?9001:1).put("title","Released").put("release_date","2020-01-01")));};
        Random last=new Random(){@Override public int nextInt(int bound){return bound-1;}};JSONObject chosen=DiscoveryApi.randomMovie(api,last,"2026-10-05",Collections.emptySet());assertEquals(9001,chosen.getLong("id"));assertEquals(2,requests.size());assertTrue(requests.get(1).endsWith("page=500"));assertTrue(requests.get(0).contains("include_adult=false"));
    }
    @Test public void surpriseRejectsAdultFutureAndMissingTitlesAndAvoidsRecentPicks() throws Exception {
        JSONArray rows=new JSONArray().put(movie(1,"First","2020-01-01")).put(movie(2,"Future","2099-01-01")).put(movie(3,"Adult","2020-01-01").put("adult",true)).put(movie(4,"Fresh","2020-01-01")).put(movie(5,"","2020-01-01"));
        JSONObject chosen=DiscoveryApi.randomMovie((p,q)->new JSONObject().put("total_pages",1).put("results",rows),new Random(3),"2026-10-05",Collections.singleton(1L));assertEquals(4,chosen.getLong("id"));
    }
    @Test public void genreRequestsUseTheCorrectMediaAndGenreAndFilterInvalidEntries() throws Exception {
        List<String> requests=new ArrayList<>();DiscoveryApi.Request api=(p,q)->{requests.add(p+q);return new JSONObject().put("genres",new JSONArray().put(new JSONObject().put("id",28).put("name","Action")).put(new JSONObject().put("id",0).put("name","Invalid")));};
        assertEquals(1,DiscoveryApi.genres(api,"movie").length());DiscoveryApi.genrePage(api,"tv",10759,2);assertEquals("/genre/movie/list",requests.get(0));assertTrue(requests.get(1).startsWith("/discover/tv"));assertTrue(requests.get(1).contains("with_genres=10759"));assertTrue(requests.get(1).endsWith("page=2"));
    }
    @Test(expected=IllegalArgumentException.class) public void rejectsInvalidGenreBeforeMakingRequests() throws Exception {DiscoveryApi.genrePage((p,q)->{fail("Must not request an invalid genre");return null;},"movie",0,1);}
    private static JSONObject movie(long id,String title,String date) throws JSONException{return new JSONObject().put("id",id).put("title",title).put("release_date",date);}
}
