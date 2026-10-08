# ZeroPlay v2.0.1 — Maintenance Update

This is a focused updater-delivery maintenance patch for the native ZeroPlay apps.

## Fixed
- Movie and episode playback now requires an explicit exit confirmation before leaving playback.
- **Yes, exit** leaves playback; **No, keep watching** returns cleanly to the video.
- App-exit and playback-exit confirmations now share the same clean, opaque, uniform styling.
- Android's in-app updater dialog is now opaque, cleaner, more consistent, and easier to use on mobile and TV.

## Android TV / Modern UI
- Renamed **For you** to **Home**.
- Added **Categories** to Modern UI on Android TV by replacing the Downloads navigation slot there. Downloads functionality itself is not removed from ZeroPlay.

## Live refresh behavior
- **Live PPV** catalogue network refreshes are limited to once per hour.
- **Live Sports** catalogue network refreshes are limited to once per hour.
- Saved/cached data remains available between refreshes.

## Version
- Android / Android TV: **2.0.1** (`versionCode 38`)
- Windows: **2.0.1**

This release is intentionally small and exists primarily so ZeroPlay 2.0 users can receive the fixes through the built-in updater.
