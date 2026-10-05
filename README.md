# ZeroStreams for Android and Android TV

Independent native streaming app project in the **ZeroMovies** repository. The app is named **ZeroStreams** and has its own dark navy and teal interface. It does not embed, scrape, or rebrand Bingeflix pages.

## Status

First source implementation, version **0.1.0**. Backend integration tests pass. **Android compilation, APK installation, playback and TV remote behavior have not yet been tested**: the authoring environment has no Android SDK or Gradle installation. Run the manual build workflow below before treating this as a working release. No APK or production backend has been published.

The bundled catalog contains one explicitly labeled demo, Big Buck Bunny. A production movie/series/live catalog must be supplied separately. Website catalogs, proprietary APIs, account sync, provider embeds, DRM playback, downloads, casting, manga, recommendation algorithms and collections are not implemented. Direct HTTPS MP4/HLS/DASH sources are supported by the player implementation. HTML player pages are not direct video sources.

## Implemented in source

- Separate **mobile** and **tv** build flavors and package IDs.
- Touch layout on phones; landscape layout, focus borders and larger cards for TV.
- Discover, Movies, Series, Live, Watchlist and Continue views.
- Search by title, optional remote posters, title details, season/episode labels and labeled playback sources.
- Local watchlist and resume positions, stored separately on each device.
- Media3 playback, player controls, optional external subtitles and playback errors.
- Configurable HTTPS catalog endpoint and manual refresh from Settings.
- Node backend serving an independently maintained JSON catalog.

## Build the two APKs

### GitHub

Open **Actions → Build ZeroStreams APKs → Run workflow** on the repository's default branch. Download the `ZeroStreams-mobile-and-tv-debug` artifact after the run succeeds:

- `app-mobile-debug.apk`: phones and tablets.
- `app-tv-debug.apk`: Android TV / Google TV.

The workflow runs **only manually**, never on every push. Debug APKs are for sideload testing; they are not Play Store releases. GitHub creates a fresh debug signing key on each runner, so repeated workflow builds may require uninstalling the old test app (which clears its local watchlist). Use a persistent release signing key before distribution. No signing credentials are stored in this project.

### Android Studio

Open this project in Android Studio with support for AGP 8.7.3. Install SDK 35 and JDK 17, and use Gradle 8.9. There is no bundled Gradle wrapper binary. With Gradle 8.9 installed:

```sh
gradle wrapper --gradle-version 8.9
./gradlew :app:assembleMobileDebug :app:assembleTvDebug
./gradlew :app:lintMobileDebug :app:lintTvDebug
```

On Windows use `gradlew.bat` after generating the wrapper. Pick `mobileDebug` or `tvDebug` in Build Variants. The two apps can be installed alongside one another.

## Run the independent backend

Requires Node 20+ and no npm dependencies.

```sh
node backend/server.mjs
node --test backend/server.test.mjs
```

Default bind: `127.0.0.1:8080`. Routes:

- `GET /health`
- `GET /v1/catalog`
- `GET /v1/catalog?q=bunny&type=movie`

Edit `backend/catalog.json` to add your catalog. Changes are read on each request. Invalid catalogs return 503 without exposing internal errors. Configure `CATALOG_PATH`, `HOST` and `PORT` with environment variables if necessary.

Put the service behind an HTTPS reverse proxy on a server you control. In the app choose **Settings**, enter `https://your-server.example/v1/catalog`, then **Save & refresh**. Plain HTTP is intentionally disabled in the Android app; a local HTTP Node server cannot be entered directly. Blank endpoint uses the demo catalog. There is no login or account service in this backend: the catalog and any stream headers it contains are public, so do not put private account credentials in them.

## Catalog schema

See `backend/catalog.example.json` for movie, series and live examples. Replace every example URL with an actual HTTPS resource; these placeholders do not play.

Every item has a unique stable `id`, `title`, and `type` (`movie`, `series` or `live`). Optional fields include `year`, `description`, `poster` and `genres`. Movies/live items have a `streams` array. Series have `episodes`, each with a unique ID within the series, positive season/episode numbers and a `streams` array. Each stream has `label` and `url`; optional `mimeType`, `headers` and `subtitles` configure playback.

Keep IDs stable to preserve watchlists and resume positions. Group alternate sources under a single item and label them clearly. The app does not automatically identify duplicate titles. Stream rights, expiry, DRM and provider-specific restrictions must be handled by the content service. DRM configuration and automatic token refresh are not implemented.

## Validation checklist before release

1. Run the manual build and resolve compilation/lint errors if any.
2. Install both APKs on actual target devices.
3. On TV, verify D-pad focus across tabs, cards, dialogs and player controls, and Back navigation.
4. Verify MP4, HLS, DASH, audio/subtitle track selection and alternate-source errors using your own catalog.
5. Verify background/foreground behavior, rotation on mobile, watchlist persistence and resume after closing playback.
6. Replace demo data, finalize launcher/banner artwork, connect production HTTPS hosting and create signed release builds.

## Demo attribution

Big Buck Bunny: © 2008 Blender Foundation / www.bigbuckbunny.org. Creative Commons Attribution 3.0: https://creativecommons.org/licenses/by/3.0/. Project: https://peach.blender.org/about/. Demo video URL uses the public Google TV sample bucket and is not a ZeroStreams-hosted stream. The app does not guarantee continued availability of that external sample.
