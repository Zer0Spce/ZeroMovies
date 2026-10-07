# ZeroPlay 1.8.1

A focused playback and Android UI update built on the 1.8.0 interface release.

## ✨ What’s new

- **Automatic offline subtitles** — ZeroPlay now checks downloaded torrent folders for local `.srt`, `.vtt`, `.ass`, and `.ssa` subtitles and loads matching files automatically.
- **Optional SubDL fallback** — add your own free SubDL API key in Settings and ZeroPlay can automatically look up subtitles by TMDB title, season, and episode when no local subtitle is available.
- **External video players** — completed downloads keep ZeroPlay’s built-in offline player as the default, with a new **Open in external player** option on Android and Windows.
- **Better Android phone/tablet layout** — movie actions no longer get squeezed beside the poster on smaller screens; phones use a clean stacked action area while wider tablets keep the TV-style side actions.
- **Private Android TV TSP build support** — a separate private-TV build can receive a TSP Search key at build time. The normal public Android and Android TV APKs do not contain that key.

## 🔐 Subtitle & API-key handling

- SubDL is optional. Local downloaded subtitles work without an API key.
- SubDL keys entered in Android are encrypted with Android Keystore.
- The public release does **not** ship a shared SubDL key.
- The private Android TV APK is intentionally kept separate from public release assets because an API key embedded in an APK can be extracted by anyone who receives that APK.

## 📥 Downloads

- TSP Search remains the torrent search provider.
- Existing health/seeder filtering and download controls are unchanged.
- Downloaded sidecar subtitle files are preferred before any online subtitle lookup.
- Delete Video still removes the local downloaded video/torrent data after confirmation.

## Platforms

- Android Mobile / Tablet
- Android TV
- Windows portable ZIP

No installer is added for Windows.
