# 🎬 ZeroPlay 2.0

### Movies. Series. Live TV. Live Sports. Your screen, your way.

**ZeroPlay** is a cross-platform entertainment hub for **Android, Android TV / Google TV, and Windows**. Browse movies, TV series and anime through TMDB, keep a local library and watch history, switch playback sources, follow Live TV / PPV / Sports, customize the interface, and use TV-friendly playback controls from one app.

**[⬇️ Download the latest release](https://github.com/Zer0Spce/ZeroPlay/releases/latest)** · **[📋 ZeroPlay 2.0 release notes](docs/release-2.0.md)** · **[📺 Android TV controls](docs/android-tv-controls.md)**

Previously **ZeroMovies**. Production Android builds keep the existing signing identity so supported production installs can update in place.

---

## 🆕 What is new in 2.0

ZeroPlay 2.0 is a major reliability and interface release. The biggest changes are:

- 📺 **Android TV D-pad player navigation rewritten from scratch** with one input controller, visible focus, Shadow DOM support and wake-only first input after player idle.
- 🖱️ **Mouse mode Back behavior fixed** — close the open player function first, hide player controls next, then exit playback.
- 🎨 **Four UI layouts:** Clean, Modern, Flix and Native / Original.
- 🌈 **17 exact color themes** with theme-aware ZeroPlay branding.
- 🔄 **Built-in update flows** for Windows, Android and Android TV.
- 🧑‍🎬 **Clickable cast and filmography** using exact TMDB person IDs and combined credits.
- 🍅 **Rotten Tomatoes ratings** through OMDb when configured.
- 🗂️ **Rebuilt Categories** with movie/TV genres, international collections and Anime.
- 🛡️ **Adblock 2.0** with confirmed-host quarantine, temporary learned hosts, provider/CDN protection, local debug logging, safer cosmetic cleanup and hardened popup/navigation handling.
- 🖥️ **Windows app fullscreen** beside Surprise Me / Update — hides the normal Windows chrome and visual scrollbar while keeping scrolling available.
- 🚪 **Exit confirmation** before leaving playback or the app, helping prevent accidental exits.

For the full one-by-one changelog since 1.9, see **[ZeroPlay 2.0 release notes](docs/release-2.0.md)**.

---

## ✨ Everything ZeroPlay can do

| | Feature |
| --- | --- |
| 🔎 **TMDB discovery & search** | Trending, popular, now playing, upcoming, recommendations and explicit Search-button results without searching every keystroke. |
| 🎲 **Surprise Me** | Pick a random released TMDB movie beyond the currently visible homepage rows. **Surprise Me Again** appears only when a title was opened through Surprise Me. |
| 🗂️ **Categories** | Artwork-rich movie and TV genres, Anime and international/language collections with infinite loading. |
| 🎞️ **Rich title pages** | Artwork, synopsis, genres, cast, trailers, ratings, recommendations and provider information. |
| 🧑‍🎬 **Cast & filmography** | Select a cast member to browse their movie + TV combined credits using the exact TMDB person ID. |
| ⭐ **Ratings** | TMDB metadata plus Rotten Tomatoes through OMDb when an OMDb key is configured. |
| ❤️ **Library** | Watchlist, Plan to Watch, custom collections, watch history and search history stored locally. |
| ⏯️ **Continue Watching** | Resume supported movie / episode playback positions when the provider reports progress. |
| ▶️ **Playback sources** | **VidStuck recommended**, VidSrc.sh, plus optional RawCast playback when enabled with your own key. |
| 📡 **Live PPV** | Dedicated PPV/Sports playlist browsing with refresh and in-app playback. |
| 📺 **Live TV** | IPTV groups, favorites, refresh and independent Windows controls for Cignal and Converge channels. |
| 🏟️ **Live Sports** | Event categories, schedules, artwork, alternate streams, refresh/retry and fullscreen playback. |
| 🎨 **Four layouts** | Clean, Modern, Flix and Native / Original. Layout choice is independent from color theme. |
| 🌈 **17 themes** | Zero Dark, Zero Light, Ocean, Orchid, Sunset, Midnight Blue, Ember Glow, Forest Moss, Rose Noir, Amethyst, Cyber Mint, Cobalt Sky, Golden Hour, Coral Night, Aurora, Slate Ice and Mocha. |
| ✨ **UI animation controls** | Optional animations, focus/hover information previews, focus trailers and a muted homepage trailer carousel. |
| ⚙️ **Homepage customization** | Enable/disable homepage panels and additional categories from Settings. |
| 📥 **Downloads** | Hosted TSP Search configuration, healthy-result filtering, integrated download queue, progress/health/speed information, deletion controls and completed-download history. |
| 💬 **Offline subtitles** | Local SRT, VTT, ASS and SSA support for downloaded media, including automatic matching where available. |
| ↗️ **External player** | Completed Windows/Android downloads can be opened in an external local video player. |
| 🛡️ **Adblock 2.0** | Known ad-network blocking, confirmed QR-ad learning, popup/navigation hardening and provider/CDN protection. |
| 🔊 **Audio boost** | Off / 1.5× / 2× on compatible embedded audio. |
| 🔄 **In-app update checks** | Windows, Android and Android TV update flows with version/changelog handling. |
| 🖥️ **Windows portable** | No installer required. Extract the ZIP and run ZeroPlay. |
| 🖥️ **Windows fullscreen app** | Full-screen the entire ZeroPlay interface from the header; Windows chrome and visual scrollbar disappear until fullscreen is exited. |
| 📺 **Android TV remote support** | Settings-selected Mouse or D-pad mode, clean D-pad focus/navigation and staged Back behavior. |
| 🚪 **Exit confirmation** | Playback and application exit confirmations reduce accidental exits. |

---

## 🎨 Four interfaces

Choose the layout under **Settings → Appearance → UI layout**.

| Layout | Best for | Fresh-install default |
| --- | --- | --- |
| **Clean UI** | YouTube-TV-inspired navigation with a sidebar that collapses to an icon rail while browsing | **Windows** |
| **Modern UI** | Google-TV-inspired top navigation, cinematic discovery and portrait content cards | **Android phone / tablet** |
| **Flix UI** | More cinematic artwork-first presentation and overlapping shelves | Optional |
| **Native / Original UI** | The familiar original ZeroPlay layout and Android TV focus flow | **Android TV / Google TV** |

Saved layout choices are preserved. Changing the color theme does not change the selected layout.

### Clean UI

[![ZeroPlay Clean UI](docs/screenshots/1.8.0/windows-youtube.png)](docs/screenshots/1.8.0/windows-youtube.png)

### Modern UI

[![ZeroPlay Modern UI](docs/screenshots/1.8.0/windows-google.png)](docs/screenshots/1.8.0/windows-google.png)

### Native / Original UI

[![ZeroPlay Native UI](docs/screenshots/1.8.0/windows-classic.png)](docs/screenshots/1.8.0/windows-classic.png)

Flix UI is available from the same Settings selector and uses an isolated cinematic layout so its styling does not leak into the other interfaces.

---

## 📸 ZeroPlay across platforms

The main page now highlights the current feature surfaces rather than tying screenshots to an old release number. Open any image for the original repository PNG.

### 🖥️ Windows discovery

[![ZeroPlay Windows home](docs/screenshots/windows-home.png)](docs/screenshots/windows-home.png)

### 📱 Android home

<a href="docs/screenshots/android-mobile-home.png"><img src="docs/screenshots/android-mobile-home.png" alt="ZeroPlay Android home" width="360"></a>

### 📺 Android TV home

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

<a href="docs/screenshots/android-mobile-home-panels.png"><img src="docs/screenshots/android-mobile-home-panels.png" alt="ZeroPlay Android homepage panel settings" width="360"></a>

[![ZeroPlay Android TV homepage panels](docs/screenshots/android-tv-home-panels.png)](docs/screenshots/android-tv-home-panels.png)

---

## 📺 Android TV controls in 2.0

Player mode is selected in **Settings** and is no longer switched accidentally during playback.

### D-pad mode

- Arrow keys navigate real player controls.
- A slim teal focus treatment shows the active control.
- OK activates the selected control.
- Left/right navigation is intercepted by ZeroPlay while moving focus so navigation does not intentionally become a seek action.
- After the provider hides its controls, the first remote input is used to wake the player controls before navigation continues.

### Mouse mode

- Arrow keys move ZeroPlay’s virtual pointer smoothly.
- OK clicks at the pointer.
- Back closes an open player function/menu first.
- With no function open, Back hides visible player controls.
- The following Back exits playback.

Both modes use the same **exit confirmation** before playback is actually closed.

See **[Android TV controls](docs/android-tv-controls.md)** for the full guide.

---

## 🛡️ Adblock 2.0

2.0 keeps the working blocker conservative rather than turning it into an aggressive page shredder.

- **Confirmed-host quarantine:** once the QR scanner positively confirms an ad destination, that exact host is blocked for the current session.
- **Temporary learned blocklist:** confirmed exact hosts are remembered for **7 days** and then expire automatically.
- **Explicit provider allowlist:** VidStuck, VidSrc.sh and common video/CDN hosts are protected from future ad-rule mistakes.
- **Local debug log:** blocked host + reason + ruleset version are recorded locally for troubleshooting.
- **Safer cosmetic cleanup:** ZeroPlay tries the exact confirmed-host ad frame/container before using the older broad QR cleanup fallback.
- **Popunder hardening:** popup windows and unsupported top-level redirects stay denied without blocking normal player interaction.
- **Rule-set versioning:** the 2.0 baseline is labeled `2.0-known-good-2026-10-08`.

ZeroPlay does **not** open QR destinations and does **not** solve, click or bypass CAPTCHA / verification challenges.

Rollback points are retained in the repository:

- `backup/adblock-working-2026-10-08` — pre-upgrade known-good adblock
- `backup/2.0-frozen-2026-10-08` — frozen pre-final 2.0 candidate

---

## ⬇️ Download ZeroPlay 2.0

Get production files from **[GitHub Releases](https://github.com/Zer0Spce/ZeroPlay/releases/latest)**.

| Platform | File | Getting started |
| --- | --- | --- |
| 📱 Android phone / tablet | `ZeroPlay-2.0-Android.apk` | Android 6+. Install the signed mobile APK. |
| 📺 Android TV / Google TV | `ZeroPlay-2.0-Android-TV.apk` | Android 6+. Install the signed TV APK and choose Mouse/D-pad mode in Settings. |
| 🖥️ Windows 10 / 11 x64 | `ZeroPlay-2.0-Windows-x64.zip` | Extract the ZIP and launch `ZeroPlay.exe`. No installer is required. |
| ✅ Integrity | `SHA256SUMS.txt` | Verify downloaded assets against the published SHA-256 hashes. |

---

## ⚠️ Known issues & workarounds

### Windows Offline Player controls

Some Windows media/compositor combinations can still make the **Offline Player control chrome unreliable after using its manual eye control**. In the affected state, the eye control itself or the subtitle overlay can also disappear.

**Workaround:** on the completed download choose **Open in external player** and use your preferred local video player. The downloaded media file itself is unaffected.

### Windows SmartScreen

A Windows build without a trusted Authenticode signing certificate may show **Windows protected your PC / Unrecognized app**. The production workflow scans the packaged Windows build with Microsoft Defender before publication, but SmartScreen reputation still depends on trusted signing/reputation.

### Embedded providers

VidStuck / VidSrc.sh are third-party players and can change independently. Provider changes can temporarily affect control discovery, progress events, subtitles or advertising behavior.

### QR overlays

If a new provider creative is not yet recognized, close it with its own **X** or wait for it to expire. ZeroPlay deliberately avoids bypassing verification challenges.

---

## 🔧 Configuration notes

- **TMDB:** catalogue and metadata. A user-entered TMDB v3 key overrides a bundled key.
- **OMDb:** optional Rotten Tomatoes ratings when `OMDB_API_KEY` is configured.
- **TSP Search:** optional hosted torrent-search configuration for authorized/public-domain/user-owned downloads.
- **RawCast:** optional playback source, hidden/off by default and using the user’s own API quota.
- **Live TV:** Cignal and Converge can be enabled independently on Windows and are disabled there by default.

Use download functionality only for content you are authorized to obtain. Torrent health is an estimate and does not guarantee availability or speed.

---

## 🛠️ Build & release

- **Android:** `Build ZeroPlay APKs` runs player/input regressions, unit tests, debug builds, lint and signed update APK generation.
- **Windows:** `Build ZeroPlay Windows` runs unit/UI/player regressions, TMDB checks, a desktop smoke test and portable ZIP packaging.
- **Production:** the 2.0 release pipeline builds signed Android APKs, validates player behavior, builds/scans the Windows portable package, produces screenshots/checksums, audits release files for credentials and only then publishes the GitHub release.
- **Windows packaging:** portable ZIP only; no installer.

Production Android signing uses the established ZeroPlay keystore. Keep `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD` and `ANDROID_KEY_ALIAS` private and backed up.

---

## 🙌 Credits

Metadata and artwork: **TMDB** and their respective rights holders. This product uses the TMDB API but is not endorsed or certified by TMDB. Provider availability: **JustWatch through TMDB**. Optional ratings: **OMDb**. Embedded players: **VidStuck** and **VidSrc.sh**. QR decoding: **ZXing**. Android media playback: **AndroidX Media3**. Windows torrent engine: **WebTorrent**.

See **[ZeroPlay 2.0 release notes](docs/release-2.0.md)** for the complete 1.9 → 2.0 changelog.
