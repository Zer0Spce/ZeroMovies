# ZeroStreams — Android and Android TV

ZeroMovies is the repository for **ZeroStreams**, an independently branded native Android app for movies, series, live sports and manga. Version **0.2.0** uses a cinematic featured banner, horizontal poster rails, dark dialogs, phone navigation and a TV sidebar with visible focus states.

## Current verification status

The previous 0.1.0 mobile and TV APKs compiled and passed Android lint in run 37251216476. The final 0.2.0 mobile and TV APKs compiled and passed lint in run 37253365919. Seven backend/importer tests pass. Initial automatic refresh published 126 titles and 40 series snapshots; 33 snapshots are partial because later-season requests returned upstream errors. The updater retains confirmed episodes and retries partial snapshots hourly. Native device testing remains required; external service availability, embedded-player behavior and TV WebView navigation are not certified by compilation. This is a development build, not a Play Store release.

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

### Version 0.2.1

External video players now block requests to a small set of common advertising domains by default. Settings and the player toolbar can disable blocking and reload a server if it fails. Popup windows and cross-site top-level redirects remain blocked. This is domain filtering, not a full EasyList engine: same-domain ads, service-worker traffic and ads encoded into video can remain. Publisher manga readers are excluded. No video CDN hosts are blocked by the built-in rules.

Phone title search supports accent-insensitive, punctuation-insensitive multiword queries and result counts. Android TV adds a Search shortcut that focuses the field and requests the keyboard. Home searches the downloaded movie and series catalog; section searches filter that section. Manga searches use MangaDex. Search does not index every title on the source website.

`tests/PlayerRulesTest.java` checks domain boundaries and normalized title matching in the APK workflow. Actual provider playback and remote keyboard behavior still require device testing.

Selected-title details now use a softly blurred movie backdrop with a dark readability gradient, sharp poster, prominent Watch action and remote-focus styling. Software blur is bounded to a 128-pixel thumbnail and works on older supported Android versions. The dialog scales to phone and TV screens. Visual appearance still needs on-device review.

### Version 0.2.2

VidStuck is the recommended first playback server for movies and series, using the TMDB embed URL format confirmed by the user-supplied VidStuck documentation. Existing Vidfast, Vidzee and Vidnest servers remain selectable fallbacks. Explicit native streams in the catalog still take precedence. The movie catalog continues to refresh from the existing backend; ZSFLIX is not used for catalog retrieval. These are external WebView players, not native MP4/HLS sources. Provider availability and ad-free behavior have not been verified: VidStuck blocked requests from the development environment. On-device playback testing is required.

VidStuck options: `branding=ZeroStreams`, `color=65E6CC`, `subtitle=english`, `overlay=true`. TV embeds additionally enable `nextEpisode`, `episodeSelector` and `autoplayNextEpisode`. The provider manages those controls and subtitle availability. Progress messages are not yet imported into native resume tracking; external Continue Watching still records opened titles rather than exact positions. No provider credentials or keys from uploaded pages are used.

### Version 0.2.3

Movies and series with TMDB IDs now use VidStuck exclusively and open directly, without a server picker. The other movie/TV providers have been removed. Live sports still use their event-specific streams, and manga uses its existing readers. Movie and series search now searches both types together in the refreshed catalog, supports title normalization and exact TMDB IDs, and opens the matching TMDB item in VidStuck. This is catalog search, not an exhaustive provider index: VidStuck's supplied documentation exposes playback endpoints but no title search API. A missing series episode snapshot falls back to VidStuck season 1 episode 1 with its episode selector. Provider availability remains unverified in this development environment.

VidStuck WebViews now accept third-party cookies and flush cookies after page loads and when leaving the player. JavaScript and DOM storage remain enabled; challenge hosts are not in the ad-domain ruleset. An Open browser button opens the same VidStuck URL in an installed browser when provider verification cannot complete in WebView. Browser cookies are separate from app WebView cookies. These compatibility changes do not bypass verification or guarantee the provider will stop requesting it.

### Version 0.2.4

External video playback now fills the screen without the app's Back, Reload, Open browser, ad-block switch or status toolbar. Android system bars use immersive mode. Use the Android/TV remote Back action to close player fullscreen and return to browsing. Ad blocking is still controlled from Settings; cookie persistence remains enabled. Publisher manga readers retain their toolbar. Device and provider behavior require on-device verification.
