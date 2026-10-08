package com.zerostreams.app;

import android.content.Context;
import android.content.SharedPreferences;
import java.util.*;
import org.json.JSONObject;

/** Runtime persistence/logging for confirmed ad hosts. */
final class PlayerAdBlockState {
    private static final long LEARNED_TTL_MS=7L*24L*60L*60L*1000L;
    private static final String PREF_LEARNED="adblock.learned.v2";
    private static final String PREF_LOG="adblock.debug.v2";
    private static final Map<String,Long> LAST_LOGGED=new HashMap<>();
    private static Context appContext;
    private static boolean loaded;

    static synchronized void init(Context context){
        if(context==null)return;
        if(appContext==null)appContext=context.getApplicationContext();
        if(!loaded){
            loadLearned();
            AdBlockRules.setObserver(PlayerAdBlockState::blocked);
            loaded=true;
            log("ruleset","-",AdBlockRules.RULESET_VERSION);
        }
    }

    static synchronized void confirm(Context context,String host,String reason){
        init(context);
        String normalized=normalize(host);
        if(normalized.isEmpty()||AdBlockRules.providerAllowed(normalized)){
            if(!normalized.isEmpty())log("ignored-confirmation",normalized,"provider-allowlist");
            return;
        }
        long expiry=System.currentTimeMillis()+LEARNED_TTL_MS;
        AdBlockRules.quarantineExact(normalized);
        AdBlockRules.learnExact(normalized,expiry);
        saveLearnedHost(normalized,expiry);
        log("confirmed-host",normalized,(reason==null||reason.isEmpty())?"qr-confirmed":reason);
    }

    private static void loadLearned(){
        if(appContext==null)return;
        SharedPreferences preferences=appContext.getSharedPreferences("zero",Context.MODE_PRIVATE);
        String raw=preferences.getString(PREF_LEARNED,"{}");
        JSONObject keep=new JSONObject();
        long now=System.currentTimeMillis();
        try{
            JSONObject object=new JSONObject(raw);
            Iterator<String> keys=object.keys();
            while(keys.hasNext()){
                String key=keys.next(),host=normalize(key);
                long expiry=object.optLong(key,0L);
                if(!host.isEmpty()&&expiry>now&&!AdBlockRules.providerAllowed(host)){
                    AdBlockRules.learnExact(host,expiry);
                    keep.put(host,expiry);
                }
            }
        }catch(Exception ignored){}
        preferences.edit().putString(PREF_LEARNED,keep.toString()).apply();
    }

    private static void saveLearnedHost(String host,long expiry){
        if(appContext==null)return;
        SharedPreferences preferences=appContext.getSharedPreferences("zero",Context.MODE_PRIVATE);
        JSONObject object;
        try{object=new JSONObject(preferences.getString(PREF_LEARNED,"{}"));}catch(Exception error){object=new JSONObject();}
        long now=System.currentTimeMillis();
        try{
            ArrayList<String> expired=new ArrayList<>();
            Iterator<String> keys=object.keys();
            while(keys.hasNext()){
                String key=keys.next();
                if(object.optLong(key,0L)<=now||AdBlockRules.providerAllowed(key))expired.add(key);
            }
            for(String key:expired)object.remove(key);
            object.put(host,expiry);
        }catch(Exception ignored){}
        preferences.edit().putString(PREF_LEARNED,object.toString()).apply();
    }

    private static synchronized void blocked(String host,String rule){
        long now=System.currentTimeMillis();
        String key=host+'|'+rule;
        Long previous=LAST_LOGGED.get(key);
        if(previous!=null&&now-previous<5000L)return;
        LAST_LOGGED.put(key,now);
        log("blocked",host,rule);
    }

    private static void log(String event,String host,String rule){
        if(appContext==null)return;
        SharedPreferences preferences=appContext.getSharedPreferences("zero",Context.MODE_PRIVATE);
        String existing=preferences.getString(PREF_LOG,"");
        String line=System.currentTimeMillis()+"|"+AdBlockRules.RULESET_VERSION+"|"+event+"|"+host+"|"+rule;
        ArrayList<String> lines=new ArrayList<>();
        if(existing!=null&&!existing.isEmpty())lines.addAll(Arrays.asList(existing.split("\\n")));
        lines.add(line);
        if(lines.size()>80)lines=new ArrayList<>(lines.subList(lines.size()-80,lines.size()));
        preferences.edit().putString(PREF_LOG,String.join("\n",lines)).apply();
        android.util.Log.d("ZeroPlayAdBlock",line);
    }

    private static String normalize(String host){
        if(host==null)return "";
        String value=host.trim().toLowerCase(Locale.ROOT);
        while(value.endsWith("."))value=value.substring(0,value.length()-1);
        return value;
    }
}
