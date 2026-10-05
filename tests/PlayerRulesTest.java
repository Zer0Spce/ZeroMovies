package com.zerostreams.app;

public class PlayerRulesTest {
    static void check(boolean result){if(!result)throw new AssertionError();}
    public static void main(String[] args){
        check(AdBlockRules.blocks("ads.doubleclick.net"));
        check(AdBlockRules.blocks("unswung.gurlleviter.cyou"));
        check(AdBlockRules.blocks("GURLLEVITER.CYOU."));
        check(!AdBlockRules.blocks("notgurlleviter.cyou"));
        check(!AdBlockRules.blocks("gurlleviter.cyou.example.com"));
        check(!AdBlockRules.blocks("vidstuck.xyz"));
        check(!AdBlockRules.blocks("challenges.cloudflare.com"));
        check(AdBlockRules.blocks("POPADS.NET."));
        check(!AdBlockRules.blocks("notdoubleclick.net"));
        check(!AdBlockRules.blocks("doubleclick.net.example.com"));
        check(!AdBlockRules.blocks("vidfast.pro"));
        check(!AdBlockRules.blocks("cdn.example.com"));
        check(!AdBlockRules.blocks(null));
        check(TitleSearch.matches("Amélie", "amelie"));
        check(TitleSearch.matches("Spider-Man: No Way Home", "spider man home"));
        check(TitleSearch.matches("The Last of Us", "last us"));
        check(!TitleSearch.matches("The Last of Us", "last dragon"));
        check(TitleSearch.matches("Anything", "   "));
        System.out.println("18 domain and search checks passed");
    }
}
