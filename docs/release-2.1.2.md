# ZeroPlay 2.1.2 Hotfix

ZeroPlay 2.1.2 is a focused hotfix for Windows playback UI stability and player ad filtering across Windows, Android, and Android TV / Google TV.

## Highlights

### Windows series / source UI hotfix

- Fixes the `Cannot access 'action' before initialization` regression in the Windows UI.
- Restores the close/X behavior after selecting a series.
- Keeps source-selection actions clickable and functional.
- Retains the working Windows per-title source confirmation flow.

### Windows watched-state tracking retained

The Windows episode completion logic that was manually verified before this hotfix remains included:

- checks real `currentTime` + `duration`
- catches the actual `ended` event
- treats 95%+ as completed
- forces completed episodes to 100% / `✓ Watched`
- final completion events bypass the normal progress throttle
- completed episodes stop being tracked so auto-next cannot overwrite them

### Stronger embedded-player ad blocking

- Adds `histats.com` and `histats.net` to the static ad/tracker blocklist.
- Adds a network-layer request filter to the Windows embedded movie/show player so blocked ad/tracker frames are cancelled before they render.
- Keeps provider/CDN allowlists intact to avoid blocking legitimate playback traffic.
- Android and Android TV include the updated HiStats block rules in their WebView filtering path.

### Android / Android TV note

Android episode watched/completion markers remain on the existing 2.1.1 behavior in this hotfix. The incomplete parity experiment is not being advertised as fixed in 2.1.2.

## Files

- `ZeroPlay-2.1.2-Android.apk` — Android phone / tablet
- `ZeroPlay-2.1.2-Android-TV.apk` — Android TV / Google TV
- `ZeroPlay-2.1.2-Windows-x64.zip` — Windows 10 / 11 x64 portable build
- `SHA256SUMS.txt` — SHA-256 checksums for all release assets

Windows remains portable only; there is no installer.

## Validation

The 2.1.2 production pipeline performs:

- Android Mobile and Android TV unit tests
- signed Android production builds
- APK signature and version verification
- Android lint
- Windows test suite
- pinned mpv SHA-256 verification
- native mpv video-surface helper build
- Windows source/action hotfix verification
- Windows episode-completion verification
- HiStats adblock wiring verification
- Windows smoke test
- portable ZIP build and packaged-source verification
- Microsoft Defender scan
- credential audit
- SHA-256 generation for all published assets

## Upgrade

### Windows

Users on 2.1 or 2.1.1 can use ZeroPlay's in-app updater, or download and extract the 2.1.2 portable ZIP manually.

### Android / Android TV

Install the matching signed 2.1.2 APK over the existing ZeroPlay installation using the normal Android update flow.
