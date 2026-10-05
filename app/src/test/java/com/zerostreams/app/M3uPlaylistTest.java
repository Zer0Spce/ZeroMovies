package com.zerostreams.app;

import org.junit.Test;
import static org.junit.Assert.*;
import java.io.IOException;
import java.util.*;

public class M3uPlaylistTest {
    @Test public void readsSportsHeadersAndKeepsCommasInsideQuotedAttributes() throws Exception {
        List<M3uPlaylist.Channel> channels=M3uPlaylist.parse("\uFEFF#EXTM3U\r\n#EXTINF:-1 tvg-id=\"one\" tvg-logo=\"https://host/logo.png\" group-title=\"Sports, live\",Team A vs Team B\r\n#EXTVLCOPT:http-referrer=https://host/event\r\n#EXTVLCOPT:http-user-agent=LivePlaylist/1.0\r\nhttps://cdn/live.m3u8\r\n");
        M3uPlaylist.Channel channel=channels.get(0);assertEquals("Sports, live",channel.group);assertEquals("Team A vs Team B",channel.name);assertEquals("https://host/event",channel.headers.get("Referer"));assertEquals("LivePlaylist/1.0",channel.headers.get("User-Agent"));assertEquals("application/x-mpegURL",channel.mime);
    }
    @Test public void drmAndHeadersNeverLeakIntoTheNextChannelAndDecorativeLinesAreIgnored() throws Exception {
        String list="#EXTM3U\n********Cignal********\n#EXTINF:-1 group-logo=\"https://host/group.png\"\n#EXTINF:-1 tvg-id=\"first\" group-title=\"TV\",One\n#KODIPROP:inputstream.adaptive.manifest_type=mpd\n#KODIPROP:inputstream.adaptive.license_type=org.w3.clearkey \n#KODIPROP:inputstream.adaptive.license_key=00000000000000000000000000000000:11111111111111111111111111111111\n#KODIPROP:inputstream.adaptive.common_headers=User-Agent=Example%2F1.0&Referer=https%3A%2F%2Fhost%2F&Origin=https%3A%2F%2Fhost\nhttps://cdn/one.mpd\n#EXTINF:-1,Two\nhttp://cdn/two.m3u8\n";
        List<M3uPlaylist.Channel> channels=M3uPlaylist.parse(list);assertEquals(2,channels.size());assertEquals("org.w3.clearkey",channels.get(0).drmType);assertEquals("Example/1.0",channels.get(0).headers.get("User-Agent"));assertEquals("",channels.get(1).drmKey);assertTrue(channels.get(1).headers.isEmpty());assertEquals("Channels",channels.get(1).group);
    }
    @Test public void ignoresExecutableUrlsAndUnsafeHeaderInjectionButKeepsStreamVariants() throws Exception {
        String list="#EXTM3U\n#EXTINF:-1,Bad\nfile:///etc/passwd\n#EXTINF:-1,Valid\nhttps://cdn/live.m3u8|User-Agent=hello%0D%0AAuthorization%3Asecret&Referer=https%3A%2F%2Fhost\n#EXTINF:-1 tvg-id=\"same\",Other\nhttps://cdn/other.m3u8\n#EXTINF:-1 tvg-id=\"same\",Other HD\nhttps://cdn/other-hd.m3u8\n#EXTINF:-1,Valid\nhttps://cdn/live.m3u8\n";
        List<M3uPlaylist.Channel> channels=M3uPlaylist.parse(list);assertEquals(3,channels.size());assertFalse(channels.get(0).headers.containsKey("User-Agent"));assertEquals("https://host",channels.get(0).headers.get("Referer"));
    }
    @Test(expected=IOException.class) public void rejectsHlsSegmentManifest() throws Exception {M3uPlaylist.parse("#EXTM3U\n#EXT-X-TARGETDURATION:6\n#EXTINF:6,\nhttps://cdn/part.ts\n");}
    @Test(expected=IOException.class) public void rejectsHtmlErrorPageInsteadOfReplacingCachedChannels() throws Exception {M3uPlaylist.parse("<html>Not found</html>");}
}
