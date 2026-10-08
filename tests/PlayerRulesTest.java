package com.zerostreams.app;

public class PlayerRulesTest {
    static void check(boolean result){if(!result)throw new AssertionError();}
    public static void main(String[] args){
        check(AdBlockRules.RULESET_VERSION.startsWith("2.0-known-good"));
        check(AdBlockRules.blocks("ads.doubleclick.net"));
        check(AdBlockRules.blocks("unswung.gurlleviter.cyou"));
        check(AdBlockRules.blocks("GURLLEVITER.CYOU."));
        check(!AdBlockRules.blocks("notgurlleviter.cyou"));
        check(!AdBlockRules.blocks("gurlleviter.cyou.example.com"));
        check(!AdBlockRules.blocks("vidstuck.xyz"));
        check(!AdBlockRules.blocks("media.vidstuck.xyz"));
        check(!AdBlockRules.blocks("cdn.cloudflarestream.com"));
        check(!AdBlockRules.blocks("challenges.cloudflare.com"));
        check(AdBlockRules.blocks("POPADS.NET."));
        check(!AdBlockRules.blocks("notdoubleclick.net"));
        check(!AdBlockRules.blocks("doubleclick.net.example.com"));
        check(!AdBlockRules.blocks("vidfast.pro"));
        check(!AdBlockRules.blocks("cdn.example.com"));
        check(!AdBlockRules.blocks(null));
        AdBlockRules.quarantineExact("fresh-ad.example");
        check(AdBlockRules.blocks("fresh-ad.example"));
        check(!AdBlockRules.blocks("sub.fresh-ad.example"));
        AdBlockRules.learnExact("temporary-ad.example",System.currentTimeMillis()+60000L);
        check(AdBlockRules.blocks("temporary-ad.example"));
        check(!AdBlockRules.blocks("sub.temporary-ad.example"));
        check(TitleSearch.matches("Amélie", "amelie"));
        check(TitleSearch.matches("Spider-Man: No Way Home", "spider man home"));
        check(TitleSearch.matches("The Last of Us", "last us"));
        check(!TitleSearch.matches("The Last of Us", "last dragon"));
        check(TitleSearch.matches("Anything", "   "));
        System.out.println("26 domain, quarantine, allowlist and search checks passed");
    }
}
