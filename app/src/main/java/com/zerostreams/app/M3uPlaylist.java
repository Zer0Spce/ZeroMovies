package com.zerostreams.app;

import java.io.*;
import java.net.*;
import java.util.*;
import java.util.regex.*;

/** Extended M3U channel lists. Never treat an HLS media manifest as a channel list. */
final class M3uPlaylist {
    static final String LIVE_URL = "https://raw.githubusercontent.com/Zer0Spce/ZeroStreams/main/playlist.m3u";
    static final String IPTV_URL = "https://raw.githubusercontent.com/Zer0Spce/ZeroStreams/main/IPTV.m3u";
    static final long LIVE_TTL = 30 * 60 * 1000L;
    private static final Pattern ATTRIBUTE = Pattern.compile("([\\w-]+)\\s*=\\s*(?:\"([^\"]*)\"|'([^']*)'|([^\\s,]+))");
    static final class Channel {
        final String id, name, group, logo, url, mime, drmType, drmKey;
        final Map<String,String> headers;
        Channel(String id, String name, String group, String logo, String url, String mime,
                String drmType, String drmKey, Map<String,String> headers) {
            this.id=id; this.name=name; this.group=group; this.logo=logo; this.url=url;
            this.mime=mime; this.drmType=drmType; this.drmKey=drmKey;
            this.headers=Collections.unmodifiableMap(new LinkedHashMap<>(headers));
        }
    }
    static List<Channel> parse(String input) throws IOException {
        if(input == null || input.length()>5_000_000) throw new IOException("Invalid playlist size");
        input=input.replace("\uFEFF", "");
        if(!input.trim().startsWith("#EXTM3U") || input.contains("#EXT-X-TARGETDURATION"))
            throw new IOException("Expected an M3U channel playlist");
        LinkedHashMap<String,Channel> result=new LinkedHashMap<>();
        String name="",id="",group="",logo="",mime="",drmType="",drmKey="";
        boolean entry=false;
        Map<String,String> headers=new LinkedHashMap<>();
        try(BufferedReader reader=new BufferedReader(new StringReader(input))) {
            String raw;
            while((raw=reader.readLine())!=null) {
                String line=raw.trim();
                if(line.startsWith("#EXTINF:")) {
                    // Reset every field even for decorative/incomplete EXTINF lines.
                    name="";id="";group="";logo="";mime="";drmType="";drmKey="";headers.clear();entry=false;
                    int comma=infoComma(line); if(comma<0)continue;
                    Map<String,String> attrs=new HashMap<>();Matcher m=ATTRIBUTE.matcher(line.substring(0,comma));
                    while(m.find())attrs.put(m.group(1).toLowerCase(Locale.ROOT),m.group(2)!=null?m.group(2):m.group(3)!=null?m.group(3):m.group(4));
                    name=line.substring(comma+1).trim();if(name.isEmpty())name=attribute(attrs,"tvg-name","");
                    id=attribute(attrs,"tvg-id","");group=attribute(attrs,"group-title","Channels").trim();
                    logo=attribute(attrs,"tvg-logo","");if(!httpUrl(logo))logo="";
                    entry=!name.isEmpty();
                } else if(entry && line.startsWith("#EXTGRP:")) {
                    group=line.substring(8).trim();
                } else if(entry && line.startsWith("#EXTVLCOPT:")) {
                    int eq=line.indexOf('=');if(eq<0)continue;
                    String option=line.substring(11,eq).trim().toLowerCase(Locale.ROOT),value=line.substring(eq+1).trim();
                    if(option.equals("http-referrer")||option.equals("http-referer"))header(headers,"Referer",value);
                    if(option.equals("http-user-agent"))header(headers,"User-Agent",value);
                    if(option.equals("http-origin"))header(headers,"Origin",value);
                } else if(entry && line.startsWith("#KODIPROP:")) {
                    int eq=line.indexOf('=');if(eq<0)continue;
                    String option=line.substring(10,eq).trim(),value=line.substring(eq+1).trim();
                    if(option.endsWith(".manifest_type"))mime=value.equalsIgnoreCase("mpd")?"application/dash+xml":value.equalsIgnoreCase("hls")?"application/x-mpegURL":"";
                    if(option.endsWith(".license_type"))drmType=value.toLowerCase(Locale.ROOT);
                    if(option.endsWith(".license_key"))drmKey=value;
                    if(option.endsWith(".stream_headers")||option.endsWith(".common_headers"))parseHeaders(headers,value);
                } else if(entry && !line.isEmpty() && !line.startsWith("#") && httpUrl(line.split("\\|",2)[0])) {
                    String[] parts=line.split("\\|",2);String url=parts[0];if(parts.length>1)parseHeaders(headers,parts[1]);
                    if(mime.isEmpty()){String path;try{path=new URI(url).getPath().toLowerCase(Locale.ROOT);}catch(Exception e){path="";}
                        if(path.endsWith(".mpd"))mime="application/dash+xml";else if(path.endsWith(".m3u8"))mime="application/x-mpegURL";
                    }
                    String channelId=id.isEmpty()?Integer.toHexString((name+"|"+url).hashCode()):id;
                    // The same TVG id may legitimately have several stream variants.
                    if(!result.containsKey(name+"|"+url))result.put(name+"|"+url,new Channel(channelId,name,group.isEmpty()?"Channels":group,logo,url,mime,drmType,drmKey,headers));
                    entry=false;
                    if(result.size()>=3000)break;
                }
            }
        }
        if(result.isEmpty())throw new IOException("No playable channels in this playlist");
        return new ArrayList<>(result.values());
    }
    private static String attribute(Map<String,String> attrs,String key,String fallback){String value=attrs.get(key);return value==null?fallback:value;}
    private static int infoComma(String line){char quote=0;for(int i=0;i<line.length();i++){char c=line.charAt(i);if(c=='\"'||c=='\''){if(quote==0)quote=c;else if(quote==c)quote=0;}if(c==','&&quote==0)return i;}return -1;}
    static boolean httpUrl(String value){try{URI u=new URI(value);return (u.getScheme().equalsIgnoreCase("https")||u.getScheme().equalsIgnoreCase("http"))&&u.getHost()!=null&&u.getUserInfo()==null&&!value.contains("\r")&&!value.contains("\n");}catch(Exception e){return false;}}
    private static void header(Map<String,String> target,String name,String value){if(value.isEmpty()||value.length()>2048||value.contains("\r")||value.contains("\n"))return;
        if(name.equalsIgnoreCase("referer")){if(httpUrl(value))target.put("Referer",value);}
        else if(name.equalsIgnoreCase("origin")){if(httpUrl(value))target.put("Origin",value);}
        else if(name.equalsIgnoreCase("user-agent"))target.put("User-Agent",value);
    }
    private static void parseHeaders(Map<String,String> target,String value){for(String pair:value.split("&")){int eq=pair.indexOf('=');if(eq<1)continue;try{header(target,URLDecoder.decode(pair.substring(0,eq),"UTF-8"),URLDecoder.decode(pair.substring(eq+1),"UTF-8"));}catch(Exception ignored){}}}
}
