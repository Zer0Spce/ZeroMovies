package com.zerostreams.app;
/** Preserve API 23 without changing the torrent library's native ABI. */
final class TorrentRuntime {
 static com.frostwire.jlibtorrent.SessionManager create(){if(android.os.Build.VERSION.SDK_INT<24)System.loadLibrary("zeroplay_ifaddrs_compat");return new com.frostwire.jlibtorrent.SessionManager();}
}
