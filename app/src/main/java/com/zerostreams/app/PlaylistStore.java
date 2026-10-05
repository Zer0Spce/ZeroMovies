package com.zerostreams.app;

import android.content.Context;
import android.util.AtomicFile;
import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.util.*;

/** Each playlist has an independent, atomic last-good cache in app-private storage. */
final class PlaylistStore {
    static final class Snapshot {
        final List<M3uPlaylist.Channel> channels; final long updated;
        Snapshot(List<M3uPlaylist.Channel> c,long t){channels=c;updated=t;}
    }
    private static File file(Context context,boolean live){return new File(context.getFilesDir(),live?"livetv.m3u":"iptv.m3u");}
    static Snapshot cached(Context context,boolean live) throws IOException {
        File f=file(context,live);try(InputStream in=new AtomicFile(f).openRead()){return new Snapshot(M3uPlaylist.parse(read(in)),f.lastModified());}
    }
    static Snapshot fetch(Context context,boolean live) throws IOException {
        String url=live?M3uPlaylist.LIVE_URL:M3uPlaylist.IPTV_URL;
        HttpURLConnection c=(HttpURLConnection)new URL(url).openConnection();
        c.setConnectTimeout(12000);c.setReadTimeout(20000);c.setUseCaches(false);c.setInstanceFollowRedirects(false);
        c.setRequestProperty("Cache-Control","no-cache");c.setRequestProperty("Accept","application/vnd.apple.mpegurl, audio/x-mpegurl, text/plain");
        try {
            if(c.getResponseCode()!=200)throw new IOException("Playlist HTTP "+c.getResponseCode());
            String body;try(InputStream in=c.getInputStream()){body=read(in);}
            List<M3uPlaylist.Channel> channels=M3uPlaylist.parse(body); // Validate before replacing the last-good list.
            AtomicFile cache=new AtomicFile(file(context,live));FileOutputStream out=null;
            try{out=cache.startWrite();out.write(body.getBytes(StandardCharsets.UTF_8));cache.finishWrite(out);}
            catch(IOException e){if(out!=null)cache.failWrite(out);throw e;}
            return new Snapshot(channels,System.currentTimeMillis());
        } finally {c.disconnect();}
    }
    private static String read(InputStream in) throws IOException {
        ByteArrayOutputStream out=new ByteArrayOutputStream();byte[] b=new byte[8192];int n;
        while((n=in.read(b))!=-1){if(out.size()+n>5_000_000)throw new IOException("Playlist too large");out.write(b,0,n);}
        return new String(out.toByteArray(),StandardCharsets.UTF_8);
    }
}
