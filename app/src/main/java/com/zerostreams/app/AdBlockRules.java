package com.zerostreams.app;

import java.util.Locale;

/** Small domain-only ruleset. Deliberately excludes player and video CDN hosts. */
final class AdBlockRules {
    private static final String[] DOMAINS={
        "doubleclick.net", "googlesyndication.com", "googleadservices.com",
        "adsterra.com", "adsterra.org", "popads.net", "popcash.net",
        "propellerads.com", "onclicka.com", "onclicksuper.com",
        "exoclick.com", "exosrv.com", "trafficjunky.net", "juicyads.com",
        "hilltopads.net", "a-ads.com", "adnxs.com", "adskeeper.com",
        "mgid.com", "taboola.com", "outbrain.com",
        // Destination decoded from the reported timed fullscreen QR advertisement.
        "gurlleviter.cyou"};
    static boolean blocks(String host) {
        if(host==null)return false;
        String normalized=host.toLowerCase(Locale.ROOT);
        while(normalized.endsWith("."))normalized=normalized.substring(0,normalized.length()-1);
        for(String domain:DOMAINS)if(normalized.equals(domain)||normalized.endsWith("."+domain))return true;
        return false;
    }
}
