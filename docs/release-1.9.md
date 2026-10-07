# ZeroPlay v1.9 ✨

ZeroPlay 1.9 is the final polish-and-stability update before the planned 2.0 redesign. It keeps the working 1.8.2 playback stack, fixes Windows torrent downloading, upgrades downloaded-movie playback, improves Clean and Modern UI consistency, refreshes Downloads, expands color customization, and adds a new Golden ZeroPlay easter egg.

## 🖥️ Windows

- **Torrent downloads fixed:** Windows now uses **WebTorrent 3.0.21** with DHT, trackers, peer exchange, local peer discovery, uTP, NAT traversal, web seeds, fallback trackers, and a metadata timeout instead of leaving dead jobs stuck forever at `metadata · 0 peers`.
- **Clean UI carousel enlarged:** the featured carousel is taller and more cinematic.
- **Cleaner branding:** the ZeroPlay logo is larger and more uniform in Clean and Modern layouts.
- **Search bar normalized:** Clean UI uses a consistent rounded search pill with balanced height and spacing.
- **Dedicated offline player:** downloaded movies now use a separate **Video.js 8.24.1** offline player with a modern seek bar, playback speed, fullscreen, Picture-in-Picture where supported, Fit / Fill, and keyboard seeking.
- **Offline subtitle integration:** matching local **SRT, VTT, ASS and SSA** files are detected automatically. A new **Load subtitles** action lets you pick a sidecar subtitle manually. SRT/ASS/SSA are converted locally to WebVTT for playback.
- **Live playback intentionally unchanged:** Live TV, Live PPV, Live Sports, RawCast and regular embedded movie/series streaming players were not modified by the offline-player work.
- The official Windows portable ZIP still bundles the release TMDB key and requires no installer.

## 📥 Better Downloads

- Active downloads now use polished media cards similar to the Find Downloads results.
- New queue entries carry the **movie poster, synopsis, quality, codec, health, seeders, size, speed, peers, ETA and progress** into the Downloads tab.
- Pause, cancel, retry, offline playback, external-player and delete actions are grouped more cleanly.
- Older saved download entries continue to render even if they do not contain all of the newer metadata.
- Healthy TSP search results remain capped at **20** without weakening the configured health/seeder filters.

## 📺 Android TV / 📱 Android

- **Clean UI sidebar fixed:** the collapsed icon rail is narrower and centered, removing the empty strip beside the icons.
- **Modern UI logo improved:** the ZeroPlay wordmark is larger and more proportional.
- Downloads now show poster/synopsis-rich transfer cards with quality, health and progress information.
- Existing movie playback, Android TV controls, Live TV, PPV and Live Sports players remain unchanged.

## 🎨 UI polish across platforms

- Movie/series artwork now carries the **title directly on the thumbnail**, closer to the Native / Original UI presentation.
- Cards include year/type information and warm gold rating accents when ratings are available.
- Focus/hover previews gain a subtle color flare and clearer gold star ratings.
- Clean UI, Modern UI and Native / Original UI remain independently selectable from the color theme.
- Platform defaults remain:
  - **Android TV → Native / Original UI**
  - **Android phone/tablet → Modern UI**
  - **Windows → Clean UI**
- Existing saved UI choices still take precedence.

## 🌈 17 color themes

The five existing theme IDs are preserved so saved preferences continue to work. 1.9 adds **12 new palettes**, bringing the selectable total to 17:

- Midnight Blue
- Ember Glow
- Forest Moss
- Rose Noir
- Amethyst
- Cyber Mint
- Cobalt Sky
- Golden Hour
- Coral Night
- Aurora
- Slate Ice
- Mocha

The new palettes are validated against ZeroPlay's existing readability tests, including 4.5:1 text contrast across primary surfaces.

## ✨ Golden ZeroPlay easter egg

The old colorful easter egg has been replaced with a premium **Golden Mode** on Windows, Android and Android TV:

- gold/champagne accent palette
- animated gold logo shimmer
- warm gold focus and selected states
- subtle sparkle particles across the interface
- golden sidebar glow and buttons
- dedicated **Exit Golden Mode** action

It remains cosmetic only and does not modify playback, downloads, API settings or library data.

## 🛡️ Stability / security

- Windows package continues through the production unit/UI/player tests, Electron smoke test, credential audit and **Microsoft Defender scan** before publishing.
- Android production builds remain signed with the existing release key and pass mobile/TV unit, lint and emulator/device gates.
- Public artifacts contain no personal TSP key.
- TSP and user-entered provider credentials remain outside public source/release assets.

## 📦 Downloads

- `ZeroPlay-1.9-Android.apk`
- `ZeroPlay-1.9-Android-TV.apk`
- `ZeroPlay-1.9-Windows-x64.zip`
- `SHA256SUMS.txt`

Use downloads only for public-domain, Creative Commons, user-owned, or otherwise authorized content. Torrent health and peer counts are estimates and do not guarantee availability or speed.
