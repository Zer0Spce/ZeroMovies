package com.zerostreams.app;

import java.util.*;

/** Pure rules engine shared by runtime code and plain-Java regression tests. */
final class AdBlockRules {
    static final String RULESET_VERSION="2.0-known-good-2026-10-08";

    interface Observer { void onBlocked(String host,String reason); }

    private static final String[] DOMAINS={
        "doubleclick.net", "googlesyndication.com", "googleadservices.com",
        "adsterra.com", "adsterra.org", "popads.net", "popcash.net",
        "propellerads.com", "onclicka.com", "onclicksuper.com",
        "exoclick.com", "exosrv.com", "trafficjunky.net", "juicyads.com",
        "hilltopads.net", "a-ads.com", "adnxs.com", "adskeeper.com",
        "mgid.com", "taboola.com", "outbrain.com",
        "gurlleviter.cyou"
    };

    /** Provider/player/CDN hosts protected from future filtering mistakes. */
    private static final String[] PROVIDER_ALLOWLIST={
        "vidstuck.xyz", "vidsrc.sh",
        "cloudflarestream.com", "videodelivery.net",
        "cloudfront.net", "akamaized.net", "akamaihd.net", "fastly.net",
        "b-cdn.net", "cdn77.org", "googlevideo.com", "r2.dev",
        "challenges.cloudflare.com"
    };

    private static final Set<String> SESSION_EXACT=new HashSet<>();
    private static final Map<String,Long> LEARNED_EXACT=new HashMap<>();
    private static Observer observer;

    static synchronized void setObserver(Observer value){observer=value;}

    /** Quarantine this exact confirmed host until the process exits. */
    static synchronized void quarantineExact(String host){
        String normalized=normalize(host);
        if(!normalized.isEmpty()&&!providerAllowed(normalized))SESSION_EXACT.add(normalized);
    }

    /** Load/store a temporary exact-host rule with an absolute expiry time. */
    static synchronized void learnExact(String host,long expiry){
        String normalized=normalize(host);
        if(normalized.isEmpty()||providerAllowed(normalized))return;
        if(expiry>System.currentTimeMillis())LEARNED_EXACT.put(normalized,expiry);
        else LEARNED_EXACT.remove(normalized);
    }

    static synchronized boolean blocks(String host){
        String normalized=normalize(host);
        if(normalized.isEmpty()||providerAllowed(normalized))return false;
        pruneExpired();
        String reason=reason(normalized);
        if(reason==null)return false;
        if(observer!=null)observer.onBlocked(normalized,reason);
        return true;
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

    private static void pruneExpired(){
        long now=System.currentTimeMillis();
        LEARNED_EXACT.entrySet().removeIf(entry->entry.getValue()==null||entry.getValue()<=now||providerAllowed(entry.getKey()));
    }

    private static boolean matches(String host,String domain){return host.equals(domain)||host.endsWith("."+domain);}

    private static String normalize(String host){
        if(host==null)return "";
        String value=host.trim().toLowerCase(Locale.ROOT);
        while(value.endsWith("."))value=value.substring(0,value.length()-1);
        return value;
    }
}
