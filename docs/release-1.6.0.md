# ZeroPlay v1.6.0 🎬

Android, Android TV, and Windows receive the same browsing and playback improvements.

- 🎮 Live Sports uses compact controls over the bottom of the video, styled like PPV/Sports. Controls hide during playback; touch/mouse activity or the TV Menu key brings them back. Retry, fullscreen, Back and clearly labeled alternate sources remain available.
- 🛡️ Windows Live Sports now uses a memory-only browser session with disk caching disabled. Startup removes the old sports browser Cache, Code Cache, GPUCache and Service Worker cache only. Watchlists, settings, histories and the sports catalogue are preserved. Android sports playback bypasses and clears WebView cache.
- 🔤 Categories are alphabetical, with Anime in the ordinary category grid plus Japanese, Korean, Filipino, French, Spanish and Hindi collections.
- ↕️ More sorts: featured, popularity, rating, newest, oldest and title A–Z/Z–A for loaded titles; playlist/name/group channel sorting; schedule/name sports sorting.
- 🏠 Fifteen more optional genre panels, readable panel buttons and checkboxes in light/dark themes. Current homepage defaults are preserved.
- 🖼️ Stable carousel height and text areas, consistent portrait movie cards, and uniform monochrome Windows navigation icons. Removed the home tagline.

## Security note
The reported `Trojan:Win32/Suschil!rfn` alert identified a file in the legacy Windows Live Sports browser cache. This release stops retaining that player's browser cache on disk and removes the old cache. A cache path alone does not identify the supplying request or prove a false positive. Keep Microsoft Defender enabled and remove/quarantine any detected item; do not restore it or add an exclusion. These changes and the release scan do not certify third-party streams or clean other files on your computer.

## Temporarily disabled
Movie downloads/preloading and torrent downloads remain disabled because of unfixable bugs in the previous implementation. They will be reimplemented in a future release once a working fix is found. There are no movie download or save-video buttons in playback.

## Known player issue
If a QR ad shows up, press its **X** button or wait for it to close itself. It is a known bug; embedded player behavior varies by provider.

## Downloads
Signed Android mobile and Android TV APKs, the Windows x64 portable ZIP, and SHA256SUMS.txt are attached. Android APKs use the existing permanent signing key.
