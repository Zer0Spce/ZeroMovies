# ZeroStreams — Android and Android TV

ZeroMovies is the repository for **ZeroStreams**, an independently branded native Android app for movies, series, live sports and manga. Version **0.2.0** uses a cinematic featured banner, horizontal poster rails, dark dialogs, phone navigation and a TV sidebar with visible focus states.

## Current verification status

The previous 0.1.0 mobile and TV APKs compiled and passed Android lint in run 37251216476. The first expanded 0.2.0 APKs compiled and passed lint in run 37252846761; final reader and memory refinements are undergoing another build. Seven backend/importer tests pass. Native device testing remains required; external service availability, embedded-player behavior and TV WebView navigation are not certified by compilation. This is a development build, not a Play Store release.

## App features

- Home hero and Trending, Popular Movies, Series, Recent Releases and Continue Watching rails.
- Movie/series catalog search, title/year sorting, synopsis, artwork and ratings.
- Local watchlists and named collections, including manga and live entries.
- Series season/episode selection from published episode snapshots.
- Labeled movie/episode server choices and an external embedded-player view with fullscreen support.
- Native Media3 playback for configured direct MP4, HLS and DASH sources; subtitle and audio controls.
- Live sports events and per-event stream selection from a configurable sports API.
- MangaDex title search, paginated results, English chapter lists and a native page reader with bookmarks, touch zoom/pan and remote page-turn keys.
- Catalog refresh on launch and when returning after five minutes, plus manual refresh in Settings.

Watchlists, collections and bookmarks are stored locally and do not sync between devices. Exact playback timestamps are saved for native video sources. Embedded players keep their own progress; the app tracks recently opened titles without reading or modifying cross-origin player internals.

## Download / build

The workflow **Build ZeroStreams APKs** produces:

- `app-mobile-debug.apk` — phones and tablets.
- `app-tv-debug.apk` — Android TV and Google TV.

Use **Actions → Build ZeroStreams APKs → Run workflow**, then download **ZeroStreams-mobile-and-tv-debug**. Debug APKs are for sideload testing. A newly generated GitHub runner debug key may require uninstalling an older test build before installation, which clears local app data. Persistent release signing is not configured.

Android Studio requirements: SDK 35, JDK 17, AGP 8.7.3, Gradle 8.9. There is no bundled wrapper binary; with Gradle 8.9 installed:

```sh
gradle wrapper --gradle-version 8.9
./gradlew :app:assembleMobileDebug :app:assembleTvDebug
./gradlew --continue :app:lintMobileDebug :app:lintTvDebug
```

Use `gradlew.bat` on Windows after generating the wrapper. Both package variants can be installed side by side.

## Automatic catalog updates

The app defaults to this published feed:

```text
https://raw.githubusercontent.com/Zer0Spce/ZeroMovies/main/public/catalog.json
```

The **Refresh movie catalog** workflow runs hourly at minute 17 and supports manual dispatch. It retrieves metadata visible on Bingeflix's public homepage, imports unique movie/series IDs, preserves configured native playback sources, and publishes changes. This is not an exhaustive mirror of every title in the website database. Listed but unreleased titles may have no playable server yet. No site scripts are executed and no private API key is copied or used.

The same workflow enriches series snapshots under `public/series/` through the publicly accessible season API. Existing series snapshots refresh at most once per day. Initial enrichment covers at most 100 series and 20 regular seasons each; specials and series with more than 20 seasons are not covered by that importer. Upstream errors preserve previous snapshots. A later-season error still publishes confirmed episodes and retries partial snapshots hourly. Episode availability can lag the first catalog import.

**New movies and episodes do not require rebuilding the APK.** The app fetches published metadata from GitHub, not directly from Bingeflix. GitHub scheduled jobs can be delayed or paused after inactivity. Site layout/API changes or source blocking require an importer fix while cached content remains available.

An already installed 0.1.0 app can enter the feed in Settings without rebuilding to see metadata; the expanded UI, embedded players, manga reader and new episode support require the 0.2.0 APK once.

## Playback and content integrations

Movies and episodes have the externally hosted player options observed in the website's public client configuration: Vidfast, Vidzee and Vidnest. These are embedded HTML players, not extracted direct video URLs. Availability, ads, subtitles, authentication and player restrictions belong to those providers. Cross-site top-level redirects/popups are not opened by the app; this may affect providers that require such navigation. External fullscreen is supported. Native TV remote compatibility for the embedded pages must be tested on an actual TV.

Configured `streams` override these fallbacks. `streams` entries with `embed: true` use the WebView; other entries use Media3. Stream URLs must be HTTPS. Provider URLs are not proof that a title is currently playable. No DRM bypass or provider token extraction is implemented.

Manga browsing and reading use MangaDex's public API and its chapter image servers directly. Native reading supports available English chapters; entries with HTTPS external chapter URLs open a labeled publisher reader instead. Some titles have no readable English chapters. The reader requests image pages one at a time and stores the current page locally.

Live events use the public sports proxy configured by the website, with the base URL editable in Settings. The direct upstream returned a gateway error and the proxy timed out from the authoring environment, so live playback remains an integration requiring live service/device verification. Failure displays an unavailable state; alternate API bases must expose the same `/api/matches/all-today` and `/api/stream/{source}/{id}` shapes.

## Independent Node backend

Node 20+; no npm dependencies:

```sh
node --test backend/server.test.mjs backend/sync-catalog.test.mjs backend/sync-series.test.mjs
node backend/sync-catalog.mjs
node backend/sync-series.mjs
node backend/server.mjs
```

The server binds to `127.0.0.1:8080`. It serves `GET /health` and `GET /v1/catalog`, with optional `q` and `type` filters. Default catalog is `public/catalog.json`; `CATALOG_PATH`, `HOST` and `PORT` override these settings. Runtime automatic homepage sync runs at startup and hourly; `AUTO_SYNC=0` disables it. Season files are enriched by the refresh command/workflow, not by the server timer.

The APKs work with the published static feed without hosting this server. To use a private backend, put it behind HTTPS, set the app catalog URL, and make corresponding series snapshots available; the current app's default series snapshot URL targets this repository. There is no backend authentication, user account, admin panel or cloud watchlist sync. Do not place private account credentials in this public catalog.

`backend/catalog.example.json` documents custom movies, series and direct live sources. Stable IDs preserve local state. Blank catalog URL uses the bundled Big Buck Bunny demo.

## Release validation remaining

Install both expanded APKs, check D-pad navigation across all screens and embedded players, and test actual MP4/HLS/DASH playback, external servers, manga images, chapter paging, live sources, collection persistence, lifecycle changes and mobile rotation. Add persistent release signing, production artwork and distribution metadata before publishing a release. Downloads, casting, cloud accounts, autoplay-next and automatic provider failover are not implemented.

## Demo attribution

Big Buck Bunny: © 2008 Blender Foundation / www.bigbuckbunny.org, CC BY 3.0, https://creativecommons.org/licenses/by/3.0/. Project: https://peach.blender.org/about/. Demo URL uses the public Google TV sample bucket. Catalog images and metadata retain their original sources; the app does not host the movie or manga media itself.
