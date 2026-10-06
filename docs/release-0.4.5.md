# 🎬 ZeroMovies v0.4.5

A cleaner movie and TV experience for Android, Android TV, and Windows.

## ✨ What's new

- **🎲 Surprise Me:** a red dice button beside the compact theme toggle. Discover released TMDB movies beyond the homepage recommendations.
- **Categories:** browse movie and TV genres from the side navigation, with paginated results.
- **Watch Now where you need it:** beside the movie poster and title, above the synopsis and cast.
- **Choose your source:** a separate source picker beside Watch Now. **VidStuck is Recommended**, with VidSrc.sh also available.
- **Polished artwork:** subtle blurred backgrounds and saved light/night mode.
- **Your library:** Home watchlist, Continue Watching, search and watch history, collections, and Plan to Watch.

## 📺 Playback and navigation

- Android TV supports D-pad navigation and optional mouse mode during playback.
- Player controls hide while idle and wake on remote input. Back hides visible controls first; another Back returns to browsing.
- Windows keeps browsing and playback in one window, supports native fullscreen, and restores browsing with the player Back button.
- Existing popup, redirect, and recognized QR advertisement filtering is retained.
- Optional compatible-stream audio boost: Off, 1.5×, or 2×.

## 📥 Downloads

| File | Platform |
| --- | --- |
| `ZeroMovies-0.4.5-Android.apk` | Android phone/tablet, Android 6+ |
| `ZeroMovies-0.4.5-Android-TV.apk` | Android TV / Google TV, Android 6+ |
| `ZeroMovies-0.4.5-Windows-x64.zip` | Windows 10/11, x64; portable |
| `SHA256SUMS.txt` | File integrity checksums |

**Windows:** extract the ZIP and launch `ZeroMovies.exe`. No installer.

**Android:** install the APK matching your device. This first production-signed release may require uninstalling an earlier debug build because its signing certificate differs. Uninstalling clears the device's local watchlist and history. Subsequent releases must keep the same production signing key.

## ✅ Validation

Android release variants run unit tests, player and remote-control regressions, compilation, lint, non-debug manifest checks, and APK signature verification. The reused Windows portable build passed UI regressions, live TMDB checks, and actual Electron single-window, fullscreen, and Back smoke tests.

TMDB supplies metadata and artwork; new catalog entries do not need an app rebuild. A listed title does not guarantee playback availability. Progress, subtitles, audio boost, and advertisement filtering depend on the embedded provider and device WebView. Surprise picks sample TMDB discovery pages rather than uniformly selecting every TMDB ID.

## Credits

This product uses the TMDB API but is not endorsed or certified by TMDB. Provider availability: JustWatch through TMDB. Embedded players: VidStuck and VidSrc.sh. QR decoding: ZXing. Android media playback: AndroidX Media3.
