# ZeroPlay v2.0.1 — Maintenance Update

> **Important for Windows users upgrading from ZeroPlay 2.0:** the updater bug in the original 2.0 Windows build may prevent the update from unpacking or relaunching correctly. Please manually download the updated **ZeroPlay 2.0.1 Windows ZIP**, extract it over your existing ZeroPlay folder, and launch ZeroPlay once. After that, the repaired built-in updater will be in place for future updates.

This is a focused maintenance patch for the native ZeroPlay apps.

## Fixed
- Movie and episode playback now requires an explicit exit confirmation before leaving playback.
- **Yes, exit** leaves playback; **No, keep watching** returns cleanly to the video.
- App-exit and playback-exit confirmations now share the same clean, opaque, uniform styling.
- Android's in-app updater dialog is now opaque, cleaner, more consistent, and easier to use on mobile and TV.
- Windows updater now waits for ZeroPlay to fully exit, reliably applies the extracted portable files with retries, verifies the updated executable after replacement, and relaunches ZeroPlay automatically.
- If the Windows updater cannot finish applying an update, it now leaves a diagnostic updater log and shows a visible failure message instead of silently disappearing.

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

This remains the same **2.0.1** maintenance update. The Windows portable ZIP was refreshed only to repair the updater handoff included in the earlier 2.0 Windows build.
