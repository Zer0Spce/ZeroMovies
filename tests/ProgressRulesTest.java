package com.zerostreams.app;
public class ProgressRulesTest {
    static void check(boolean value){if(!value)throw new AssertionError();}
    public static void main(String[] args){
        check(ProgressRules.valid(120,3600));check(ProgressRules.percent(1800,3600)==50);
        check(!ProgressRules.valid(Double.NaN,3600));check(!ProgressRules.valid(10,Double.POSITIVE_INFINITY));
        check(!ProgressRules.valid(-1,3600));check(!ProgressRules.valid(1,0));check(!ProgressRules.valid(4000,3600));
        check(!ProgressRules.valid(1,604801));check(ProgressRules.percent(3605,3600)==100);
        System.out.println("Playback progress boundary checks passed");
    }
}
