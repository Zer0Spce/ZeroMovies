package com.zerostreams.app;

final class ProgressRules {
    static boolean valid(double timestamp,double duration){return !Double.isNaN(timestamp)&&!Double.isInfinite(timestamp)&&!Double.isNaN(duration)&&!Double.isInfinite(duration)&&timestamp>=0&&duration>0&&duration<=604800&&timestamp<=duration+10;}
    static int percent(double timestamp,double duration){return valid(timestamp,duration)?(int)Math.max(0,Math.min(100,Math.round(timestamp/duration*100))):0;}
}
