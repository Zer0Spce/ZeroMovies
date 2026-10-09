# ZeroPlay 2.1.1

ZeroPlay 2.1.1 is a reliability hotfix and Windows playback update for Windows, Android, and Android TV / Google TV.

The biggest Windows changes are the new native mpv-backed offline player and repaired episode completion tracking. Android and Android TV also include the finalized 2.1 carousel behavior and UI fixes.

## Highlights

### Windows offline player rebuilt

- Replaced the old Chromium-only offline video path with a bundled **mpv** playback engine.
- Video renders through a dedicated native Windows child surface while ZeroPlay keeps its own modern controls.
- Keeps playback inside the ZeroPlay experience instead of opening the normal mpv interface.
- Supports local **SRT, VTT, ASS, and SSA** subtitles.
- Supports embedded subtitle and audio tracks.
- Includes play/pause, seek, volume, mute, playback speed, fit/fill, fullscreen, subtitle selection, and external subtitle loading.
- Uses D3D11 / gpu-next playback with hardware decoding where available.
- The final player implementation was manually tested successfully before this release.

### Windows episode progress / completion fixed

- Episode progress now refreshes while the title details screen is open.
- Windows no longer relies only on provider progress messages for the final watched state.
- ZeroPlay also checks the real video playback position and duration.
- The actual video `ended` state is captured when available.
- Episodes at 95% or later are finalized as **100% / Watched**.
- Final completion updates bypass the normal progress-event throttle so the last state is not dropped.
- Completed episodes are locked before auto-next can overwrite the finished episode state.
- Episode selectors now correctly show **Continue %** and **✓ Watched** status.

### Windows title-source and history polish

- Playback source preference can be kept per title without changing every other title.
- One-time source switching remains available.
- Episode history is stored per season/episode instead of only at the series level.
- Added a dedicated watched-history clear action that keeps downloads, watchlist, and settings.
- Windows desktop exit remains immediate without the old exit confirmation dialog.

### Android / Android TV

- Finalized homepage carousel source parity with Windows.
- Carousel source choices now drive the actual visible hero cards.
- Watchlist and Continue Watching stay true to their selected source instead of silently falling back to Trending.
- Carousel is capped at 10 cards.
- Trailer previews follow the movie currently displayed in the hero.
- Season and Episode selector focus/selection visibility is improved.
- Reset application/settings support is retained.

### Windows updater

The dedicated `ZeroPlayUpdater.exe` architecture introduced in 2.1 is retained in 2.1.1.

- Users already on **2.1** can use the repaired in-app updater for 2.1.1.
- Users on **2.0–2.0.3** should still update manually because those older builds contain the broken updater.
- Update packages continue to be SHA-256 verified before activation.

## Files

- `ZeroPlay-2.1.1-Android.apk` — Android phone / tablet
- `ZeroPlay-2.1.1-Android-TV.apk` — Android TV / Google TV
- `ZeroPlay-2.1.1-Windows-x64.zip` — Windows 10 / 11 x64 portable build
- `SHA256SUMS.txt` — SHA-256 checksums for all release assets

Windows remains **portable only**. There is no installer.

## Validation

The 2.1.1 production pipeline performs:

- Android Mobile unit tests
- Android TV unit tests
- signed Android production APK builds
- Android lint for Mobile and TV
- APK signature verification and version verification
- Windows test suite
- pinned mpv download with SHA-256 verification
- native mpv video-surface helper build
- Windows episode-completion/source/history patch verification
- Windows desktop smoke test with bounded shutdown handling
- portable Windows ZIP build
- packaged mpv/native-host verification
- standalone updater verification
- Microsoft Defender scan of the packaged Windows application
- credential audit
- SHA-256 generation for all published assets

## Upgrade

### Windows 2.1

Use ZeroPlay's in-app updater, or download and extract `ZeroPlay-2.1.1-Windows-x64.zip` manually.

### Windows 2.0–2.0.3

Download `ZeroPlay-2.1.1-Windows-x64.zip` manually, extract it to a fresh folder, and launch `ZeroPlay.exe`.

### Android / Android TV

Install the matching signed 2.1.1 APK over the existing ZeroPlay installation using the normal Android update flow.
