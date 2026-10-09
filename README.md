# 🎬 ZeroPlay 2.1

### Movies. Series. Live TV. Live Sports. Your screen, your way.

**ZeroPlay** is a cross-platform entertainment hub for **Android, Android TV / Google TV, and Windows**. Discover movies, TV series and anime through TMDB, keep a local library and history, switch playback sources, follow Live TV / PPV / Sports, use offline/download features for authorized media, and customize the experience from one app.

[![ZeroPlay Windows home](docs/screenshots/windows-home.png)](docs/screenshots/windows-home.png)

**[⬇️ Download ZeroPlay 2.1](https://github.com/Zer0Spce/ZeroPlay/releases/tag/v2.1)** · **[📋 Full 2.1 release notes](docs/release-2.1.md)** · **[📺 Android TV controls](docs/android-tv-controls.md)**

> [!IMPORTANT]
> ### Windows 2.0 / 2.0.1 / 2.0.2 / 2.0.3 users: manual 2.1 download required
>
> The Windows updater included in 2.0 through 2.0.3 is the updater bug fixed by 2.1, so those versions cannot be relied on to install their own replacement.
>
> **Download `ZeroPlay-2.1-Windows-x64.zip` manually, extract it to a fresh folder, and launch `ZeroPlay.exe`. Once you are on 2.1, future Windows updates can be installed in-app.**

Android production builds keep the established signing identity so supported production installs can update in place.

---

## 🚀 What changed in ZeroPlay 2.1

### 🔄 Windows updater repaired

ZeroPlay 2.1 replaces the fragile Windows update/replacement flow with a dedicated **`ZeroPlayUpdater.exe`** helper.

- SHA-256 verifies the downloaded update before activation.
- The helper waits for ZeroPlay to close before installing.
- Updates are extracted with the .NET ZIP implementation.
- New versions are installed into `versions/<version>/` instead of overwriting the running app.
- `current.json` is switched atomically only after validation.
- The launcher uses a detached handoff so the updated app stays alive after relaunch.
- Pending-version confirmation and rollback remain available if activation fails.
- Temporary update/staging folders are cleaned after success.
- Helper failures can write `ZeroPlayUpdater-error.txt` with the exact error.
- The final updater path was validated with multiple temporary newer-version tests before 2.1 was released.

### 🎞️ Homepage carousel source parity

Windows, Android and Android TV now use the same carousel-source behavior.

Choose from:

- **This Week Top Picks**
- **Watchlist**
- **Recommended Movies**
- **Popular Movies**
- **Now Playing**
- **Continue Watching**

The carousel now supports up to **10 cards**, uses the actual ordered source feed, and keeps the muted trailer tied to the exact movie currently displayed. Android/TV also fixes the release-layer renderer that previously forced the visible hero back to Trending regardless of the selected setting.

### 📺 Android / Android TV polish

- Stronger Season/Episode focus, pressed and selected states.
- Clearer selector styling in both dark and light themes.
- Improved Season/Episode labels and sizing.
- `No, Go Back` confirmation copy where Android playback/application confirmation is used.
- New **Reset application and settings** option that clears settings/library/history/API preferences while keeping downloaded media files.

### 🖥️ Windows behavior cleanup

- Removed the desktop **Exit ZeroPlay?** confirmation — closing the Windows app now closes it normally.
- Fixed carousel trailer/source mismatch on Windows.
- Windows portable packaging now includes the standalone updater helper at the portable root.

Read the complete change record in **[docs/release-2.1.md](docs/release-2.1.md)**.

---

## ✨ What ZeroPlay can do

| | Feature |
| --- | --- |
| 🔎 **TMDB discovery & search** | Trending, popular, now playing, upcoming, recommendations and explicit Search-button results without searching every keystroke. |
| 🎲 **Surprise Me** | Pick a random released TMDB movie beyond the currently visible homepage. |
| 🗂️ **Categories** | Artwork-rich movie and TV genres, Anime, alphabetical browsing and international/language collections with infinite loading. |
| 🎞️ **Rich title pages** | Artwork, synopsis, genres, cast, trailers, ratings, recommendations and provider information. |
| 🧑‍🎬 **Clickable cast & filmography** | Browse movie + TV combined credits using the exact TMDB person ID. |
| 🍅 **Ratings** | TMDB metadata plus Rotten Tomatoes through OMDb when an OMDb key is configured. |
| ❤️ **Library** | Watchlist, Plan to Watch, custom collections, watch history and search history stored locally. |
| ⏯️ **Continue Watching** | Resume supported movie / episode playback positions when the provider reports progress. |
| ▶️ **Playback sources** | VidStuck recommended, VidSrc.sh, plus optional RawCast playback when enabled with your own key. |
| 📡 **Live PPV** | Dedicated PPV/Sports playlist browsing with refresh and in-app playback. |
| 📺 **Live TV** | IPTV groups, favorites, refresh and independent Windows controls for Cignal and Converge channels. |
| 🏟️ **Live Sports** | Event categories, schedules, artwork, alternate streams, refresh/retry and fullscreen playback. |
| 🎨 **Four UI layouts** | Clean, Modern, Flix and Native / Original. Layout choice is independent from color theme. |
| 🌈 **17 themes** | Zero Dark, Zero Light, Ocean, Orchid, Sunset, Midnight Blue, Ember Glow, Forest Moss, Rose Noir, Amethyst, Cyber Mint, Cobalt Sky, Golden Hour, Coral Night, Aurora, Slate Ice and Mocha. |
| 🎞️ **Configurable homepage carousel** | Choose Top Picks, Watchlist, Recommended, Popular, Now Playing or Continue Watching; up to 10 cards. |
| ✨ **UI animation controls** | Optional animations, focus/hover previews, focus trailers and a muted homepage trailer carousel. |
| ⚙️ **Homepage customization** | Enable/disable homepage panels and additional categories from Settings. |
| ♻️ **Reset app/settings** | Restore local app settings and library/history state without deleting downloaded media files. |
| 📥 **Downloads** | Hosted TSP Search configuration, healthy-result filtering, queue/progress information, delete controls and completed-download history. |
| 💬 **Offline subtitles** | Local SRT, VTT, ASS and SSA support for downloaded media, including automatic matching where available. |
| ↗️ **External player** | Completed Windows/Android downloads can be opened in an external local video player. |
| 🛡️ **Adblock 2.0** | Known ad-network blocking, confirmed QR-ad learning, popup/navigation hardening, provider/CDN protection and expiring learned-host quarantine. |
| 🔊 **Audio boost** | Off / 1.5× / 2× on compatible embedded audio. |
| 🔄 **In-app updater** | Repaired Windows updater plus Android and Android TV update flows with version/changelog handling. |
| 🖥️ **Windows portable** | No installer required. Extract the ZIP and run ZeroPlay. |
| 🖥️ **True app fullscreen** | Full-screen the entire Windows interface while keeping scrolling available. |
| 📺 **Android TV remote support** | Settings-selected Mouse or D-pad mode, visible focus/navigation and staged Back behavior. |

---

## 🎨 Four interfaces

Choose the layout under **Settings → Appearance → UI layout**.

| Layout | Experience | Fresh-install default |
| --- | --- | --- |
| **Clean UI** | YouTube-TV-inspired navigation with a sidebar that collapses to an icon rail while browsing | **Windows** |
| **Modern UI** | Google-TV-inspired top navigation, cinematic discovery and portrait content cards | **Android phone / tablet** |
| **Flix UI** | Cinematic artwork-first presentation with isolated layout rules and overlapping shelves | Optional |
| **Native / Original UI** | The familiar ZeroPlay layout and Android TV focus flow | **Android TV / Google TV** |

### Clean UI

[![ZeroPlay Clean UI](docs/screenshots/1.8.0/windows-youtube.png)](docs/screenshots/1.8.0/windows-youtube.png)

### Modern UI

[![ZeroPlay Modern UI](docs/screenshots/1.8.0/windows-google.png)](docs/screenshots/1.8.0/windows-google.png)

### Native / Original UI

[![ZeroPlay Native UI](docs/screenshots/1.8.0/windows-classic.png)](docs/screenshots/1.8.0/windows-classic.png)

Flix is the fourth selectable layout and stays isolated so its cinematic CSS does not leak into Clean, Modern or Native.

---

## 📸 ZeroPlay across platforms

### 📱 Android

<a href="docs/screenshots/android-mobile-home.png"><img src="docs/screenshots/android-mobile-home.png" alt="ZeroPlay Android home" width="360"></a>

### 📺 Android TV / Google TV

[![ZeroPlay Android TV home](docs/screenshots/android-tv-home.png)](docs/screenshots/android-tv-home.png)

### 🗂️ Categories

[![ZeroPlay Windows categories](docs/screenshots/windows-categories.png)](docs/screenshots/windows-categories.png)

<a href="docs/screenshots/android-mobile-categories.png"><img src="docs/screenshots/android-mobile-categories.png" alt="ZeroPlay Android categories" width="360"></a>

### 🏟️ Live Sports

[![ZeroPlay Windows Live Sports](docs/screenshots/windows-sports.png)](docs/screenshots/windows-sports.png)

[![ZeroPlay Android TV Live Sports](docs/screenshots/android-tv-live-sports.png)](docs/screenshots/android-tv-live-sports.png)

### ⚙️ Settings & homepage customization

[![ZeroPlay Windows settings](docs/screenshots/windows-settings.png)](docs/screenshots/windows-settings.png)

[![ZeroPlay Windows homepage panels](docs/screenshots/windows-home-panels.png)](docs/screenshots/windows-home-panels.png)

<a href="docs/screenshots/android-mobile-home-panels.png"><img src="docs/screenshots/android-mobile-home-panels.png" alt="ZeroPlay Android homepage customization" width="360"></a>

[![ZeroPlay Android TV homepage panels](docs/screenshots/android-tv-home-panels.png)](docs/screenshots/android-tv-home-panels.png)

---

## 📺 Android TV controls

Player mode is selected in **Settings**.

### D-pad mode

- Arrow keys navigate real player controls.
- A visible focus treatment shows the active control.
- OK activates the selected control.
- Hidden player controls can be woken before normal navigation continues.

### Mouse mode

- Arrow keys move ZeroPlay’s virtual pointer.
- OK clicks at the pointer.
- Back closes an open player function/menu first.
- With no function open, Back hides visible player controls.
- The following Back exits playback.

---

## 🛡️ Adblock 2.0

ZeroPlay favors confirmed evidence over aggressive guessing:

- Confirmed QR-ad hosts are quarantined for the current session.
- Learned confirmed hosts expire instead of becoming permanent forever.
- VidStuck, VidSrc.sh and common player/video CDN hosts are explicitly protected.
- Block decisions can be logged locally with ruleset version + reason.
- New-window/popunder attempts are denied inside app playback.
- CAPTCHA / Cloudflare / verification controls are not clicked, solved or removed by ZeroPlay.

---

## ⬇️ Download ZeroPlay 2.1

Get production files from **[GitHub Releases](https://github.com/Zer0Spce/ZeroPlay/releases/tag/v2.1)**.

| Platform | File | Getting started |
| --- | --- | --- |
| 📱 Android phone / tablet | `ZeroPlay-2.1-Android.apk` | Android 6+. Install the signed mobile APK. |
| 📺 Android TV / Google TV | `ZeroPlay-2.1-Android-TV.apk` | Android 6+. Install the signed TV APK and choose Mouse/D-pad mode in Settings. |
| 🖥️ Windows 10 / 11 x64 | `ZeroPlay-2.1-Windows-x64.zip` | **2.0–2.0.3 users: manual download required once.** Extract to a fresh folder and launch `ZeroPlay.exe`. |
| ✅ Integrity | `SHA256SUMS.txt` | Verify downloaded assets against the published SHA-256 hashes. |

### Windows upgrade note

If you are currently using **2.0, 2.0.1, 2.0.2, or 2.0.3 on Windows**, do not rely on that version's in-app updater for the move to 2.1. Manually download the 2.1 Windows ZIP once. **Future updates after 2.1 can use the repaired in-app updater.**

Windows stays portable-only; no installer is required.

---

## ⚠️ Known issues & workarounds

### Windows Offline Player controls

Some Windows media/compositor combinations can make Offline Player controls unreliable. If needed, choose **Open in external player** from a completed download and use your preferred local player. The downloaded media file itself is unaffected.

### Windows SmartScreen

A Windows build without a trusted Authenticode signing certificate may show **Windows protected your PC / Unrecognized app**. The production pipeline scans the packaged Windows build with Microsoft Defender before publication, but SmartScreen reputation still depends on trusted signing/reputation.

### Embedded providers

VidStuck / VidSrc.sh are third-party players and can change independently. Provider changes can temporarily affect controls, progress events, subtitles or advertising behavior.

### QR overlays

If a new creative is not yet recognized, close it with its own **X** or wait for it to expire. ZeroPlay deliberately does not bypass verification challenges.

---

## 🔧 Configuration notes

- **TMDB:** catalogue and metadata. A user-entered TMDB v3 key overrides a bundled key.
- **OMDb:** optional Rotten Tomatoes ratings when `OMDB_API_KEY` is configured.
- **TSP Search:** optional hosted search configuration for authorized/public-domain/user-owned downloads.
- **RawCast:** optional playback source, hidden/off by default and using the user’s own API quota.
- **Live TV:** Cignal and Converge can be enabled independently on Windows.

Use download functionality only for content you are authorized to obtain.

---

## 🛠️ Build & release

The 2.1 production pipeline builds from the merged `main` commit and validates both platforms before publishing:

- signed Android Mobile + Android TV production APKs
- Android unit tests + lint + APK signature/version verification
- Windows test suite + desktop smoke test
- standalone `ZeroPlayUpdater.exe` build and package validation
- verification that legacy Windows updater replacement logic is absent
- Microsoft Defender scan of the packaged Windows build
- credential audit
- SHA-256 checksums
- final GitHub Release publication only after Android and Windows gates pass

**Windows packaging remains portable ZIP only — no installer.**

Production Android signing uses the established ZeroPlay keystore. Keep signing credentials private and backed up.

---

## 🙌 Credits

Metadata and artwork: **TMDB** and their respective rights holders. This product uses the TMDB API but is not endorsed or certified by TMDB. Provider availability: **JustWatch through TMDB**. Optional ratings: **OMDb**. Embedded players: **VidStuck** and **VidSrc.sh**. QR decoding: **ZXing**. Android media playback: **AndroidX Media3**. Windows torrent engine: **WebTorrent**.

See **[ZeroPlay 2.1 release notes](docs/release-2.1.md)** for the complete 2.1 change record and Windows migration instructions.
