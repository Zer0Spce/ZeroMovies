package com.zerostreams.app;
import java.net.URI;
final class PlaybackSources {
    static final String[] IDS={"vidstuck","vidsrc-sh","rawcast"};
    static final String[] NAMES={"VidStuck","VidSrc.sh","RawCast · Limited API quota"};
    static final String[] ORIGINS={"https://vidstuck.xyz","https://vidsrc.sh"};
    static int index(String id){for(int i=0;i<IDS.length;i++)if(IDS[i].equals(id))return i;return 0;}
    static boolean trusted(String address){try{URI u=new URI(address);if(!"https".equals(u.getScheme())||u.getPort()!=-1&&u.getPort()!=443)return false;for(String origin:ORIGINS)if(new URI(origin).getHost().equals(u.getHost()))return true;}catch(Exception ignored){}return false;}
    static String url(String id,String type,int season,int episode,String provider){
        if(!id.matches("[1-9][0-9]*")||!type.equals("movie")&&!type.equals("tv")||season<0||episode<1)throw new IllegalArgumentException("Invalid title or episode");
        provider=IDS[index(provider)];if(provider.equals("rawcast"))throw new IllegalArgumentException("RawCast requires secure API resolution");
        String host=provider.equals("vidsrc-sh")?"vidsrc.sh":"vidstuck.xyz";
        String value="https://"+host+"/embed/"+type+"/"+id+(type.equals("tv")?"/"+season+"/"+episode:"");
        if(provider.equals("vidstuck"))return value+"?branding=ZeroPlay&color=65E6CC&subtitle=english&overlay=true"+(type.equals("tv")?"&nextEpisode=true&episodeSelector=true&autoplayNextEpisode=true":"");
        if(provider.equals("vidsrc-sh"))return value+"?ds_lang=en"+(type.equals("tv")?"&autonext=1":"");return value;
    }
}
