package com.zerostreams.app;

import android.content.SharedPreferences;
import org.json.*;
import java.util.*;

/** Device-local, bounded history. Opening an embed is marked started, not fabricated playback. */
final class HistoryStore {
    private final SharedPreferences prefs;
    HistoryStore(SharedPreferences prefs){this.prefs=prefs;}
    JSONArray read(String key){try{return new JSONArray(prefs.getString(key,"[]"));}catch(JSONException e){return new JSONArray();}}
    synchronized void search(String value){
        String q=value.trim();if(q.isEmpty()||q.length()>200)return;
        JSONArray old=read("searchHistory"),next=new JSONArray();
        try{next.put(new JSONObject().put("query",q).put("at",System.currentTimeMillis()));
            for(int i=0;i<old.length()&&next.length()<30;i++){JSONObject row=old.optJSONObject(i);if(row!=null&&!row.optString("query").equalsIgnoreCase(q))next.put(row);}
            prefs.edit().putString("searchHistory",next.toString()).apply();
        }catch(JSONException ignored){}
    }
    synchronized void started(Catalog.Item item,String key){
        try{JSONObject row=new JSONObject().put("key",key).put("parent",item.id).put("item",item.raw).put("at",System.currentTimeMillis()).put("state","Started");
            row.put("timestamp",prefs.getLong("position:"+key,0)/1000d).put("duration",prefs.getLong("duration:"+key,0)/1000d);
            saveWatch(row);
        }catch(JSONException ignored){}
    }
    private void saveWatch(JSONObject row){
        JSONArray old=read("watchHistory"),next=new JSONArray().put(row);
        for(int i=0;i<old.length()&&next.length()<100;i++){JSONObject prior=old.optJSONObject(i);if(prior!=null&&!prior.optString("key").equals(row.optString("key")))next.put(prior);}
        prefs.edit().putString("watchHistory",next.toString()).apply();
    }
    synchronized void progress(String parent,String type,JSONObject data){
        String id=parent.substring(parent.lastIndexOf('-')+1);
        if(!id.equals(data.optString("id"))||!type.equals(data.optString("type")))return;
        double timestamp=data.optDouble("timestamp",-1),duration=data.optDouble("duration",-1);
        if(!ProgressRules.valid(timestamp,duration))return;
        int season=type.equals("tv")?data.optInt("season",-1):0,episode=type.equals("tv")?data.optInt("episode",-1):0;
        if(type.equals("tv")&&(season<0||season>1000||episode<1||episode>10000))return;
        String key=type.equals("tv")?parent+":s"+season+"e"+episode:parent;
        long position=(long)(timestamp*1000),total=(long)(duration*1000);
        int percent=ProgressRules.percent(timestamp,duration);
        SharedPreferences.Editor edit=prefs.edit().putLong("position:"+key,position).putLong("duration:"+key,total)
            .putLong("position:"+parent,position).putLong("duration:"+parent,total).putInt("percent:"+parent,percent).putLong("watchedAt:"+parent,System.currentTimeMillis());
        if(type.equals("tv"))edit.putInt("resumeSeason:"+parent,season).putInt("resumeEpisode:"+parent,episode);
        edit.apply();
        try{String saved=prefs.getString("saved:"+parent,"");if(saved.isEmpty())return;
            JSONObject row=new JSONObject().put("key",key).put("parent",parent).put("item",new JSONObject(saved)).put("at",System.currentTimeMillis())
                .put("state",percent>=95?"Completed":"Watching").put("timestamp",timestamp).put("duration",duration).put("season",season).put("episode",episode);
            saveWatch(row);
        }catch(JSONException ignored){}
    }
    synchronized void remove(String list,String identity){
        JSONArray old=read(list),next=new JSONArray();String field=list.equals("searchHistory")?"query":"key";
        for(int i=0;i<old.length();i++){JSONObject row=old.optJSONObject(i);if(row!=null&&!row.optString(field).equals(identity))next.put(row);}
        prefs.edit().putString(list,next.toString()).apply();
    }
    synchronized void clear(String list){
        SharedPreferences.Editor edit=prefs.edit().remove(list);
        if(list.equals("watchHistory"))for(String key:prefs.getAll().keySet())if(key.startsWith("position:")||key.startsWith("duration:")||key.startsWith("percent:")||key.startsWith("watchedAt:")||key.startsWith("resumeSeason:")||key.startsWith("resumeEpisode:"))edit.remove(key);
        edit.apply();
    }
}
