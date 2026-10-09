# ZeroPlay 2.1

ZeroPlay 2.1 is a reliability and UX update for Windows, Android, and Android TV / Google TV. The biggest change is a complete repair of the Windows portable updater, plus carousel-source parity across all platforms and a set of navigation/settings fixes.

> [!IMPORTANT]
> ## Windows 2.0 / 2.0.1 / 2.0.2 / 2.0.3 users must update manually once
>
> The Windows updater shipped in 2.0 through 2.0.3 is the bug being replaced by this release, so those versions cannot reliably upgrade themselves to 2.1.
>
> **Windows users on 2.0, 2.0.1, 2.0.2, or 2.0.3 should manually download `ZeroPlay-2.1-Windows-x64.zip`, extract it to a fresh folder, and launch `ZeroPlay.exe`.**
>
> After 2.1 is installed, future Windows releases can be installed through ZeroPlay's in-app updater.

Android and Android TV builds keep the established ZeroPlay signing identity and can continue to use the normal Android package update flow.

---

## Highlights

### Windows updater rebuilt

- Replaced the fragile in-app ZIP replacement flow with a dedicated **`ZeroPlayUpdater.exe`** helper.
- Update downloads are SHA-256 verified before activation.
- Updates are extracted with the .NET ZIP implementation instead of the old PowerShell/tar/in-place replacement path.
- New versions are installed under a versioned `versions/<version>/` directory instead of overwriting the running portable app.
- `current.json` is switched atomically only after the new portable build is validated.
- The updater waits for the running ZeroPlay process to close before changing the active version.
- The stable launcher now starts the selected version as an independent detached process so the updated app stays alive after handoff.
- Pending-version confirmation and rollback behavior are retained for safer activation.
- Temporary `.download-*` and staging folders are cleaned after a successful update.
- The helper writes `ZeroPlayUpdater-error.txt` when a helper-level update error occurs.
- The final helper architecture was validated through temporary newer-version updater tests before this release.

### Homepage carousel parity

The homepage carousel source setting now behaves consistently across **Windows, Android, and Android TV**.

Available sources:

1. **This Week Top Picks**
2. **Watchlist**
3. **Recommended Movies**
4. **Popular Movies**
5. **Now Playing**
6. **Continue Watching**

Additional fixes:

- Carousel source changes now replace the actual visible hero data rather than leaving the release renderer on Trending.
- Android / Android TV now use the real launcher/release presentation path instead of a lower-level renderer that was being overridden.
- Recommended, Popular, and Now Playing use their own ordered TMDB feeds.
- Watchlist and Continue Watching no longer silently fall back to Trending when empty.
- Carousel size is capped at **10 cards**.
- Trailer previews are bound to the exact movie currently displayed in the hero.
- Windows hero trailers now follow the selected carousel source instead of always using Top Picks.

### Android / Android TV controls and settings

- Season and Episode selectors have stronger visible focused/pressed/selected states.
- Selector styling is applied consistently in dark and light themes.
- Season/Episode labels are clearer and use the active accent treatment.
- Exit-choice copy now uses **`No, Go Back`** where that confirmation remains part of the Android playback/application flow.
- Added **Reset application and settings** under Settings.
- Reset clears settings, watchlist, history, collections, and API preferences while leaving downloaded media files intact.

### Windows behavior cleanup

- Removed the desktop **Exit ZeroPlay?** confirmation; closing the Windows app now exits normally.
- Kept playback-specific safeguards separate from ordinary desktop window closing.
- Fixed the Windows carousel source/trailer mismatch.

---

## Windows updater migration details

The previous Windows updater could successfully download an update yet fail during extraction, validation, replacement, or relaunch. 2.1 changes the updater boundary completely: Electron downloads and verifies the package, then hands installation to the standalone updater helper.

Because the broken updater lives inside the already-installed 2.0–2.0.3 applications, it cannot be relied on to deliver its own replacement. That is why the **manual 2.1 download is required once** for those Windows versions.

After you are running 2.1, the repaired updater is part of the portable build and future updates can use the in-app flow.

---

## Files

- `ZeroPlay-2.1-Android.apk` — Android phone / tablet
- `ZeroPlay-2.1-Android-TV.apk` — Android TV / Google TV
- `ZeroPlay-2.1-Windows-x64.zip` — Windows 10 / 11 x64 portable build
- `SHA256SUMS.txt` — SHA-256 checksums for all release assets

Windows remains **portable only**. There is no installer.

---

## Validation performed for 2.1

Before publication, the 2.1 production pipeline performs:

- Android Mobile unit tests
- Android TV unit tests
- signed production APK builds
- Android lint for Mobile and TV
- APK signature verification
- Windows test suite
- Windows desktop smoke test
- standalone updater-helper build
- verification that `ZeroPlayUpdater.exe`, `ZeroPlay.exe`, and `resources/app.asar` are present in the Windows portable package
- verification that the packaged Windows application reports version `2.1.0`
- verification that the old internal extraction path is absent
- verification that the Windows desktop exit confirmation is absent
- Microsoft Defender scan of the packaged Windows application
- release credential audit
- SHA-256 generation for published assets

---

## Upgrade instructions

### Windows 2.0–2.0.3

1. Download `ZeroPlay-2.1-Windows-x64.zip` manually from this release.
2. Extract it into a **new/fresh folder**.
3. Launch `ZeroPlay.exe`.
4. Confirm **2.1.0** in Settings → About.
5. Future versions can then use the repaired in-app updater.

### Android / Android TV

Install the matching signed 2.1 APK over the existing production installation, or use the normal in-app/package update flow where available.

---

Thanks to everyone who tested the updater and carousel behavior across Windows, Android, and Android TV. Those repeated real-device tests directly exposed the final renderer and updater-handoff bugs fixed in this release.
