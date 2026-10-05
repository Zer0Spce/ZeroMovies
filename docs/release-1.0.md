# 🎬 ZeroMovies v1.0 — More to watch, less to click

A unified release for **Android phones/tablets, Android TV / Google TV, and Windows**.

## 📡 PPV/Sports & 📺 LIVE TV

- **PPV/Sports** brings the ZeroStreams live-event playlist into its own tab. It checks for updated channels every 30 minutes while the tab is open.
- **LIVE TV** brings the separate IPTV channel playlist into a dedicated tab, cached until you refresh it.
- Colored **Refresh sports** and **Refresh TV** buttons update either list immediately. Failed refreshes keep the last good channels.
- Channel groups, channel logos, and submitted channel search make finding a stream easier.

## ▶️ Our own live player

Watch directly in ZeroMovies with custom controls: Play/Pause, return to the live edge, Retry, channel switching, audio, subtitles, and Fit/Fill. Android TV supports D-pad and media controls. Windows keeps playback in the same window with fullscreen and Back controls, plus volume adjustment.

HLS/DASH playback supports playlist-provided request headers and ClearKey configurations. Playback still depends on the stream being available and on device codec support.

## ♾️ Browse without page buttons

Movie, series, genre, provider, and search results automatically load more near the bottom. Earlier titles remain in place, repeated results are removed, and failed page requests can be retried.

## 🔎 Search when you're ready

Typing no longer launches a search with every letter. Press **Search** or the keyboard Search/Enter action to submit. Channel searches follow the same rule.

## 🖼️ Categories with artwork

Movie and TV genre tiles now use relevant TMDB artwork with readable captions.

## 🛡️ QR advertisement filtering improvements

Android's QR scanner no longer requires a mostly white screen, captures more detail, and checks multiple QR codes. Native-confirmed dark overlays and smaller QR creatives are handled by the guard. Windows receives the matching overlay rules and improved capture detail. Recognized CAPTCHA widgets and movie playback controls remain preserved.

## ⬇️ Downloads

| Platform | File |
| --- | --- |
| 📱 Android phone / tablet | `ZeroMovies-1.0-Android.apk` |
| 📺 Android TV / Google TV | `ZeroMovies-1.0-Android-TV.apk` |
| 🖥️ Windows 10 / 11 · x64 | `ZeroMovies-1.0-Windows-x64.zip` |
| ✅ Integrity checks | `SHA256SUMS.txt` |

Android APKs use the permanent production signing key and can update signed v0.4.5/v0.4.6 installations while keeping local data. Windows remains portable: extract the ZIP and launch `ZeroMovies.exe`. Existing library storage is retained. No installer is required.

Automated checks cover Android release unit tests/lint/signatures and Windows core/UI/QR regressions, live-player controls, native fullscreen, Back behavior, and portable packaging. Stream availability and codec compatibility still need checking on your own device.

<sub>Made with care by JeremieWTF ✦</sub>

🖱️ Android TV movie players start with mouse mode enabled, including the first launch after this update. Arrows move the cursor and OK clicks; Menu switches to D-pad focus and remembers your choice.
