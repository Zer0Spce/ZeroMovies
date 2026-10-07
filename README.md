# 🎬 ZeroPlay

### Movies. Live TV. Live Sports. One place.

**Movies, series, anime, Live TV, Live PPV, and Live Sports in one app.** ZeroPlay brings TMDB discovery, your personal library, and embedded playback together in a clean interface for **Android, Android TV / Google TV, and Windows**.

Browse trending picks, explore genres, save a watchlist, or roll the 🎲 **Surprise Me** dice when you cannot decide. Softly blurred artwork, **17 color themes**, and dedicated TV controls make it comfortable on your phone, desktop, or big screen.

**[⬇️ Download the latest release](https://github.com/Zer0Spce/ZeroPlay/releases/latest)** · **[📋 v1.9 release notes](docs/release-1.9.md)** · **[📺 TV controls](docs/android-tv-controls.md)**

Previously **ZeroMovies**. ZeroPlay updates keep existing Android installations, Windows library data, and the permanent signing key.

## ✨ Features

| | What you can do |
| --- | --- |
| 🔎 **Discover & search** | Browse trending, popular, now-playing, recommended, and coming-soon titles, or search movies and TV series through TMDB. |
| 🎲 **Surprise Me** | Discover released movies beyond the homepage rows with the red dice button beside the theme toggle. |
| 🗂️ **Categories** | Explore movie and TV genres, including Anime cards in both grids. Artwork makes categories easy to browse, and more titles load as you scroll. |
| 📡 **Live PPV & Live TV** | Two dedicated tabs using the ZeroStreams playlists, colored refresh buttons, channel groups, and in-app playback on Android, Android TV and Windows. |
| 🏟️ **Live Sports** | Event categories, posters, local schedules, labeled alternate sources, fullscreen playback, and a fresh API request every time you press Refresh sports. |
| ⭐ **Favorite channels** | Star Live TV channels and browse your Favorites group. |
| ⚙️ **Homepage panels** | Keep the default layout or enable extra Action, Comedy, Horror, Animation, and Anime rows in Settings. |
| 🎞️ **Rich title details** | View artwork, ratings, synopsis, cast, genres, trailers, and related recommendations; delayed hover/focus previews show details near the poster and title. |
| ▶️ **Choose your source** | Use **VidStuck by default**, switch to VidSrc.sh, or enable **RawCast · Limited** in Settings with your own API key. RawCast playback is hidden by default. RawCast streaming uses your limited quota. |
| ❤️ **Your library** | Save a watchlist, organize collections and Plan to Watch, and revisit watch and search history. |
| ⏯️ **Continue Watching** | Return to started titles and resume where supported by the playback provider. |
| 🎨 **Three UI layouts** | **Clean UI**, **Modern UI**, and **Native / Original UI**. Fresh-install defaults are Windows → Clean, Android → Modern, Android TV → Native. Saved choices are preserved. |
| 🎨 **Make it yours** | **17 selectable themes** including Midnight Blue, Ember Glow, Forest Moss, Rose Noir, Amethyst, Cyber Mint, Golden Hour, Aurora and more; immediate switching, optional animations and delayed focus/hover previews. |
| 🎬 **Trailers** | Optional muted homepage trailers and delayed focus/hover trailers, with artwork fallback. |
| 📥 **Offline downloads** | Configure hosted **TSP Search** in Settings, review up to **20 healthy results**, then download with the integrated engine. Active transfers show poster, synopsis, quality, health, peers, speed, ETA and progress. Windows uses the upgraded WebTorrent 3 engine. |
| 💬 **Automatic subtitles** | Downloaded movies and episodes automatically use matching local SRT/VTT/ASS/SSA files. Add your own free SubDL key for automatic online fallback when a local subtitle is not available. |
| 🛡️ **Advertisement filtering** | Block known advertising requests and redirects, and remove explicit banner/ad slots, popups, and recognized timed QR overlays in supported app playback environments. |
| 📺 **TV remote support** | D-pad navigation and optional player mouse mode; idle controls hide and wake on remote input. |
| 🖥️ **Windows portable** | Browse and play in one window with no installer. Downloaded movies use a dedicated Video.js offline player with playback speed, fullscreen/PiP, Fit / Fill and automatic/manual local subtitle support. |
| 🔊 **Optional audio boost** | Off, 1.5×, or 2× for compatible embedded audio. |

Search runs when you press **Search** (or the keyboard Search action), and movie, series, genre, provider, and search lists load more near the bottom without page buttons. The two live tabs include dedicated refresh controls and preserve saved channels when a refresh fails.

## 🎨 Three layouts

Choose your layout in **Settings → Appearance → UI layout**. **Clean UI** is the Windows default, **Modern UI** is the Android phone/tablet default, and **Native / Original UI** is the Android TV default. Your saved layout, theme, library and playback preferences remain independent.

| Clean UI | Modern UI | Native / Original UI |
| --- | --- | --- |
| [![YouTube TV layout with compact icon rail](docs/screenshots/1.8.0/windows-youtube.png)](docs/screenshots/1.8.0/windows-youtube.png) | [![Google TV layout with top navigation](docs/screenshots/1.8.0/windows-google.png)](docs/screenshots/1.8.0/windows-google.png) | [![Classic ZeroPlay layout](docs/screenshots/1.8.0/windows-classic.png)](docs/screenshots/1.8.0/windows-classic.png) |

The layout screenshots were first captured for 1.8.0 and are kept at their original resolution. Click a preview to open it full size. In Clean UI, the TV rail expands when you return to navigation and collapses when you focus a movie. Phones adapt the same layouts to touch screens.

## 📸 Android, Android TV & Windows

These screenshots come from the running v1.6.0 apps: Android mobile/TV emulators and the Windows desktop build. Android is captured at **1080 × 1920** and Android TV at **1920 × 1080**. Original PNG files retain their native resolution with no resizing or recompression; phone previews are displayed smaller on this page. Click any image for the full-size original.

### 📱 Android · discovery and your homepage

Browse artwork, find a movie, change playback sources, and make the homepage your own.

<a href="docs/screenshots/android-mobile-home.png"><img src="docs/screenshots/android-mobile-home.png" alt="Android ZeroPlay home" width="360"></a>

### 🖥️ Windows · one app for your next watch

Discover movies and series, switch to Live TV or Live Sports, and keep your library close.

[![Windows ZeroPlay home and Discover navigation](docs/screenshots/windows-home.png)](docs/screenshots/windows-home.png)

### 🏟️ Android TV · compact Live Sports

Four-column cards match Live PPV. Browse sports categories, event schedules, posters, and alternate sources with a remote.

[![Android TV compact Live Sports grid](docs/screenshots/android-tv-live-sports.png)](docs/screenshots/android-tv-live-sports.png)

### 🗂️ Artwork-rich categories

Browse alphabetical movie and series categories through artwork cards. Anime and six language collections use this same grid layout.

[![Windows movie categories](docs/screenshots/windows-categories.png)](docs/screenshots/windows-categories.png)

### ⚙️ Your screen, your settings

Choose your playback source, appearance, provider region, and optional audio boost. Choose from 31 homepage panels, including all movie genres, with readable buttons and checkboxes in both themes.

[![Windows playback and appearance settings](docs/screenshots/windows-settings.png)](docs/screenshots/windows-settings.png)

[![Windows homepage panel options](docs/screenshots/windows-home-panels.png)](docs/screenshots/windows-home-panels.png)

<a href="docs/screenshots/android-mobile-home-panels.png"><img src="docs/screenshots/android-mobile-home-panels.png" alt="Android homepage panel choices" width="360"></a>

[![Android TV homepage panel choices](docs/screenshots/android-tv-home-panels.png)](docs/screenshots/android-tv-home-panels.png)

<details>
<summary>📸 More Android and Windows feature screenshots</summary>

<a href="docs/screenshots/android-mobile-categories.png"><img src="docs/screenshots/android-mobile-categories.png" alt="Android movie categories" width="360"></a>

<a href="docs/screenshots/android-mobile-live-sports.png"><img src="docs/screenshots/android-mobile-live-sports.png" alt="Android Live Sports catalogue" width="360"></a>

[![Windows Live Sports events](docs/screenshots/windows-sports.png)](docs/screenshots/windows-sports.png)

[![Android TV home](docs/screenshots/android-tv-home.png)](docs/screenshots/android-tv-home.png)

</details>

## ⬇️ Download & get started

Get the files from **[GitHub Releases](https://github.com/Zer0Spce/ZeroPlay/releases/latest)**.

| Platform | v1.9 download | Getting started |
| --- | --- | --- |
| 📱 Android phone / tablet | `ZeroPlay-1.9-Android.apk` | Android 6+. Install the signed mobile APK. |
| 📺 Android TV / Google TV | `ZeroPlay-1.9-Android-TV.apk` | Android 6+. Install the signed TV APK and navigate with your remote. |
| 🖥️ Windows 10 / 11 · x64 | `ZeroPlay-1.9-Windows-x64.zip` | Extract the ZIP and launch `ZeroPlay.exe`. |
| ✅ Integrity checks | `SHA256SUMS.txt` | Compare your downloaded files against the published SHA-256 checksums. |

Android v0.4.5 uses a permanent production signing key. Moving from an earlier debug build may require uninstalling that build first, which clears its local library and history. Future production releases retain the same signing key.

## 📺 Playback & your library

Android TV movie playback starts with **mouse mode enabled**: arrows move the cursor and OK clicks. Menu switches to D-pad focus and remembers your choice. Back closes an active player menu first; with no menu open, it returns to browsing immediately. See the [TV controls guide](docs/android-tv-controls.md).

Your watchlist, collections, history, and preferences are stored locally on the device. Resume positions and progress depend on provider events; titles without progress remain marked Started. Clearing watch history also clears resume positions.

TMDB metadata refreshes as you browse and on refresh, so new catalog entries do not require an app rebuild. Provider availability is region-specific and supplied through JustWatch/TMDB. A catalog listing does not guarantee playback availability or include a streaming subscription. Embedded-player support for progress, subtitles, audio boost, and advertisement filtering varies by provider and device WebView.

## 🛠️ Build & development

- **Android:** run **Build ZeroPlay APKs** manually in GitHub Actions for development APKs. The workflow tests both variants and uploads debug APKs plus APKs signed with the permanent Android key. Published production downloads remain in Releases.
- **Production:** **Release ZeroPlay** runs regressions, unit tests, builds, lint, non-debug checks, and signature verification before publishing signed APKs and checksums. Publishing waits for signed Android APKs, mobile/TV device tests, and a tested, Defender-scanned Windows portable ZIP. A previously tested Windows artifact is reusable only after its source identity and required checks are verified.
- **Windows:** see the [Windows guide](windows/README.md). Windows builds run manually on explicit request.
- **Website:** the responsive web version is prepared for Netlify. See [website setup](web/README.md).

For your own Android builds, add a TMDB v3 API key as the `TMDB_API_KEY` Actions secret. A nonempty key entered in app Settings overrides the bundled key. Client-side API keys can be extracted from APKs.

Production signing uses `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, and `ANDROID_KEY_ALIAS`. Preserve a private backup and reuse the same key for updates. Keep signing keys and passwords out of source and public artifacts.

## 🙌 Credits

Metadata and artwork: **TMDB** and their respective rights holders. This product uses the TMDB API but is not endorsed or certified by TMDB. Provider availability: **JustWatch through TMDB**. Embedded players: **VidStuck and VidSrc.sh**. QR decoding: **ZXing** (Apache 2.0). Android media playback: **AndroidX Media3**. Windows offline playback: **Video.js**. Windows torrent engine: **WebTorrent**.



## 🆕 Version 1.9

🖥️ **Windows torrent fix:** upgraded the integrated Windows downloader to WebTorrent 3.0.21 with stronger DHT/tracker/PEX/LSD/uTP discovery, fallback trackers and a metadata watchdog so dead jobs no longer sit forever at `metadata · 0 peers`.

🎬 **Better downloaded-movie player:** Windows downloaded videos now use a dedicated Video.js offline player with a modern seek bar, playback speed, fullscreen, Picture-in-Picture where supported, Fit / Fill, and automatic/manual SRT/VTT/ASS/SSA subtitles. **Live TV, Live PPV, Live Sports, RawCast and normal streaming players were deliberately left unchanged.**

📥 **Downloads look like media, not jobs:** active transfers now show poster, synopsis, torrent quality/codec/health, seeders, peers, speed, ETA and progress in polished cards on Windows, Android and Android TV.

🎨 **UI polish everywhere:** Clean UI gets a larger Windows carousel and normalized search/branding; Android/TV Clean UI gets a tighter collapsed rail; Modern UI gets a larger ZeroPlay logo. Movie thumbnails now carry their titles and ratings, and previews gain subtle color flare plus gold star accents.

🌈 **17 themes:** the original five remain compatible, plus 12 new palettes — Midnight Blue, Ember Glow, Forest Moss, Rose Noir, Amethyst, Cyber Mint, Cobalt Sky, Golden Hour, Coral Night, Aurora, Slate Ice and Mocha.

✨ **Golden ZeroPlay easter egg:** the old rainbow mode is replaced with a premium gold/champagne mode with golden shimmer, focus accents and sparkle particles on Windows, Android and Android TV.

See the [complete 1.9 release notes](docs/release-1.9.md).

### 🛡️ Known QR ad bug

If a QR ad appears, press its **X** button or wait for it to close automatically. This is a known bug.

## 🆕 Version 1.8.1

💬 **Automatic subtitles:** downloaded torrent sidecar subtitles are detected locally first. When none are present, Android can use a user-supplied free SubDL API key to look up the matching title/season/episode automatically. The key is stored with Android Keystore.

▶️ **External playback:** completed downloads keep ZeroPlay’s native offline player as the default and now include **Open in external player** on Android and Windows.

📱 **Phone/tablet UI:** compact Android screens now place Watch, Source and Download actions below the title/poster block instead of squeezing them into a narrow column. Wider tablets retain the TV-style side action panel.

🔐 **Private Android TV build:** CI can build a same-package private TV APK with a TSP key supplied only through the `TSP_API_KEY` Actions secret. It is not included in public release assets.

### UI layouts carried forward from 1.8.0

🎨 Choose **YouTube TV**, **Google TV**, or **Classic** in **Settings → Appearance → UI layout**. YouTube TV is the default for new and upgraded installations without a saved layout preference.

YouTube TV uses wide artwork cards and a compact icon rail that expands when you return to navigation and collapses when you focus movies. Google TV combines top navigation, a cinematic featured carousel and wide shelves. Classic preserves the original poster layout. Each design adapts to phones, desktops and TV remotes, independently of your color theme.

Existing trailers, two-second previews, animation toggles, themes, watchlist, history, search, Live TV/Sports, TSP downloads and the optional RawCast toggle remain available in every layout.

### Features carried forward

🎬 Windows carousel trailers fill the frame with a proportional crop. All trailer previews default to a two-second focus delay. Controls and annotations are hidden, with cropping to reduce YouTube title overlays where possible.

⚙️ RawCast is optional playback only and **off by default**. Turn it on in Settings to reveal its source, key and usage controls. Turning it off hides those controls and switches a selected RawCast source back to VidStuck.

📥 Downloads now use hosted **TSP Search** with an integrated torrent engine. Configure one TSP API key in **Settings → Downloads → Torrent Search**. Search, review up to twenty healthy matching results, confirm your choice, and download inside ZeroPlay. No local server or external torrent client is required. The queue supports pause/cancel/resume and native offline playback without video conversion.

Android supports app-scoped internal and available external/USB storage, a foreground download notification and Wi-Fi/Ethernet-only transfers by default. Windows lets you choose a folder. Transfers stop seeding on completion. **Delete Video** removes downloaded files after confirmation; **Remove from History** keeps the files. Existing completed downloads are retained where their files still exist.

Use downloads only for public-domain, Creative Commons, user-owned or otherwise authorized content. Reported torrent health does not guarantee speed or availability. Offline codec support depends on the native player. YouTube may still show branding or overlays. Public builds contain no personal API keys.

See the [complete 1.8.1 release notes](docs/release-1.8.1.md).

TSP key setup: open [tspsearch.dev](https://tspsearch.dev/), expand **Advanced: copy and paste it yourself**, and use **Copy URL** and **Copy key**. Paste the full values in ZeroPlay’s Downloads Settings, save, then test the connection. The Downloads tab includes this guide; Android TV also offers a QR code for opening the site on your phone.
