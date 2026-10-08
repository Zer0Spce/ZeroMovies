package com.zerostreams.app;

import android.content.Context;
import android.content.SharedPreferences;
import java.util.*;
import org.json.JSONObject;

/**
 * ZeroPlay ad filtering rules.
 *
 * Known-good baseline: 2.0-known-good-2026-10-08
 * - fixed network rules stay intentionally small
 * - confirmed QR-ad hosts are quarantined exactly for this session
 * - confirmed hosts are remembered temporarily for seven days
 * - provider/player/CDN hosts are explicitly protected from future rule mistakes
 * - block decisions are recorded locally in a small rolling debug log
 */
final class AdBlockRules {
    static final String RULESET_VERSION="2.0-known-good-2026-10-08";
    private static final long LEARNED_TTL_MS=7L*24L*60L*60L*1000L;
    private static final String PREF_LEARNED="adblock.learned.v2";
    private static final String PREF_LOG="adblock.debug.v2";

    private static final String[] DOMAINS={
        "doubleclick.net", "googlesyndication.com", "googleadservices.com",
        "adsterra.com", "adsterra.org", "popads.net", "popcash.net",
        "propellerads.com", "onclicka.com", "onclicksuper.com",
        "exoclick.com", "exosrv.com", "trafficjunky.net", "juicyads.com",
        "hilltopads.net", "a-ads.com", "adnxs.com", "adskeeper.com",
        "mgid.com", "taboola.com", "outbrain.com",
        // Destination decoded from the known timed fullscreen QR advertisement.
        "gurlleviter.cyou"
    };

    /** Hosts that must never be caught by ad rules. */
    private static final String[] PROVIDER_ALLOWLIST={
        "vidstuck.xyz", "vidsrc.sh",
        "cloudflarestream.com", "videodelivery.net",
        "cloudfront.net", "akamaized.net", "akamaihd.net", "fastly.net",
        "b-cdn.net", "cdn77.org", "googlevideo.com", "r2.dev",
        "challenges.cloudflare.com"
    };

    private static final Set<String> SESSION_EXACT=new HashSet<>();
    private static final Map<String,Long> LEARNED_EXACT=new HashMap<>();
    private static final Map<String,Long> LAST_LOGGED=new HashMap<>();
    private static Context appContext;
    private static boolean loaded;

    static synchronized void init(Context context){
        if(context==null)return;
        if(appContext==null)appContext=context.getApplicationContext();
        if(!loaded){loadLearned();loaded=true;log("ruleset","-",RULESET_VERSION);}
    }

    static synchronized boolean blocks(String host){
        String normalized=normalize(host);
        if(normalized.isEmpty()||providerAllowed(normalized))return false;
        pruneExpired();
        String reason=reason(normalized);
        if(reason==null)return false;
        logBlocked(normalized,reason);
        return true;
    }

    /** Exact host learned from a positively identified QR advertisement. */
    static synchronized void confirm(Context context,String host,String reason){
        init(context);
        String normalized=normalize(host);
        if(normalized.isEmpty()||providerAllowed(normalized)){
            if(!normalized.isEmpty())log("ignored-confirmation",normalized,"provider-allowlist");
            return;
        }
        long expiry=System.currentTimeMillis()+LEARNED_TTL_MS;
        SESSION_EXACT.add(normalized);
        LEARNED_EXACT.put(normalized,expiry);
        saveLearned();
        log("confirmed-host",normalized,(reason==null||reason.isEmpty())?"qr-confirmed":reason);
    }

    static synchronized boolean providerAllowed(String host){
        String normalized=normalize(host);
        if(normalized.isEmpty())return false;
        for(String domain:PROVIDER_ALLOWLIST)if(matches(normalized,domain))return true;
        return false;
    }

    static synchronized String blockReason(String host){
        String normalized=normalize(host);
        if(normalized.isEmpty()||providerAllowed(normalized))return null;
        pruneExpired();
        return reason(normalized);
    }

    private static String reason(String normalized){
        if(SESSION_EXACT.contains(normalized))return "session-quarantine";
        Long expiry=LEARNED_EXACT.get(normalized);
        if(expiry!=null&&expiry>System.currentTimeMillis())return "temporary-learned";
        for(String domain:DOMAINS)if(matches(normalized,domain))return "static:"+domain;
        return null;
    }

    private static boolean matches(String host,String domain){return host.equals(domain)||host.endsWith("."+domain);}

    private static String normalize(String host){
        if(host==null)return "";
        String value=host.trim().toLowerCase(Locale.ROOT);
        while(value.endsWith("."))value=value.substring(0,value.length()-1);
        return value;
    }

    private static void loadLearned(){
        if(appContext==null)return;
        LEARNED_EXACT.clear();
        String raw=appContext.getSharedPreferences("zero",Context.MODE_PRIVATE).getString(PREF_LEARNED,"{}");
        try{
            JSONObject object=new JSONObject(raw);
            Iterator<String> keys=object.keys();
            long now=System.currentTimeMillis();
            while(keys.hasNext()){
                String host=normalize(keys.next());
                long expiry=object.optLong(host,0L);
                if(!host.isEmpty()&&expiry>now&&!providerAllowed(host))LEARNED_EXACT.put(host,expiry);
            }
        }catch(Exception ignored){}
        saveLearned();
    }

    private static void pruneExpired(){
        long now=System.currentTimeMillis();
        boolean changed=LEARNED_EXACT.entrySet().removeIf(entry->entry.getValue()==null||entry.getValue()<=now||providerAllowed(entry.getKey()));
        if(changed)saveLearned();
    }

    private static void saveLearned(){
        if(appContext==null)return;
        JSONObject object=new JSONObject();
        try{for(Map.Entry<String,Long> entry:LEARNED_EXACT.entrySet())object.put(entry.getKey(),entry.getValue());}catch(Exception ignored){}
        appContext.getSharedPreferences("zero",Context.MODE_PRIVATE).edit().putString(PREF_LEARNED,object.toString()).apply();
    }

    private static void logBlocked(String host,String rule){
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
        String line=System.currentTimeMillis()+"|"+RULESET_VERSION+"|"+event+"|"+host+"|"+rule;
        ArrayList<String> lines=new ArrayList<>();
        if(existing!=null&&!existing.isEmpty())lines.addAll(Arrays.asList(existing.split("\\n")));
        lines.add(line);
        if(lines.size()>80)lines=new ArrayList<>(lines.subList(lines.size()-80,lines.size()));
        preferences.edit().putString(PREF_LOG,String.join("\n",lines)).apply();
        android.util.Log.d("ZeroPlayAdBlock",line);
    }
}
