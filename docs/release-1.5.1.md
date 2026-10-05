# ZeroPlay v1.5.1 🎬🏟️

A focused update for **Android, Android TV / Google TV, and Windows**.

## 🏟️ Live Sports first

- **Live Sports now sits in Discover**, alongside Movies, Series, PPV/Sports, and LIVE TV. Android mobile keeps it in its browsing tabs; Android TV and Windows place it in their Discover navigation.
- Android TV Live Sports uses compact four-column cards and a category filter, matching the PPV/Sports layout.
- Live Sports now uses ZeroPlay’s advertisement filtering: known ad domains, banners, popups, redirects, and recognized timed QR overlays are filtered. Player-triggered file downloads and popup windows are blocked.
- URL and HTML iframe sources, fullscreen, Back, TV remote controls, loading/error states, Retry, and alternate sources remain supported.
- The catalogue refreshes approximately every minute while open. **↻ Refresh sports** requests fresh API data on every press.
- This remains a separate embedded API player, alongside the existing native M3U players.

## 🐛 Downloads temporarily disabled

**Movie downloads and torrent downloads are disabled because of bugs we have not been able to fix in the current implementation.** The Downloads tab, Download / Download as torrent buttons, and the Save movie button below playback have been removed for now.

We plan to reimplement these features in a future version once a reliable fix is found. Existing downloaded files are not deleted by this update.

## ✨ Still included

Anime appears as an artwork card in both movie and series category grids. Also included: homepage panel settings, LIVE TV favorites, explicit Search, automatic loading as you scroll, watchlists, collections, and light/dark themes.

## 🛡️ Playback notes

If a QR ad appears, press its **X** button or wait for it to close automatically. This is a known bug. Advertisement filtering cannot guarantee removal of every provider ad.

A Windows Defender detection was reported for v1.5; its affected file and cause have not been confirmed. This update does not establish that alert was caused by sports ads or that it was a false positive. Do not restore quarantined files or disable antivirus protection.

## ⬇️ Downloads

- `ZeroPlay-1.5.1-Android.apk` — signed Android mobile build.
- `ZeroPlay-1.5.1-Android-TV.apk` — signed Android TV build, with mouse mode enabled by default.
- `ZeroPlay-1.5.1-Windows-x64.zip` — Windows portable build; extract and launch `ZeroPlay.exe`.
- `SHA256SUMS.txt` — checksums for all three files.

Android updates use the same permanent signing key as earlier production versions. Functional validation covers mobile/TV emulators and Windows; it is separate from malware analysis.
