# ZeroStreams

Android phone and Android TV app for movie and series discovery using **TMDB**, with **VidStuck** video playback. Version **0.3.2**.

## Features

- TMDB trending titles, popular movies, popular series and now-playing discovery.
- Online movie and TV search with result pages, artwork, synopsis and ratings.
- Movie and series browsing with pagination.
- TMDB season and episode lists loaded on demand, including specials.
- VidStuck-only movie/series playback with ZeroStreams loading text, mint accent, English subtitle preference and episode controls.
- TV D-pad focus navigation without a mouse pointer; playback control bars hide after three idle seconds and wake on remote input.
- Optional Settings audio boost: Off, 1.5× or 2× for compatible embedded media, with a limiter. Non-CORS sources keep their original audio path.
- Fullscreen video without the app's top toolbar; Android/remote Back returns to browsing.
- Softly blurred selected-title artwork, sharp posters and remote focus highlights.
- Watchlist, collections and local Continue Watching. Embedded progress still records opened titles rather than exact timestamps.
- MangaDex English manga readers and publisher readers.
- Live sports use the official Streamed API directly; event streams remain separate from movie playback.

## API key and builds

Create your own TMDB **API Key (v3 auth)** at https://www.themoviedb.org/settings/api. Add repository Actions secret **TMDB_API_KEY** to include it in APK builds. A nonempty key entered in app Settings overrides the bundled key; leaving it blank uses the bundled key. If neither is available, Settings explains that a key is required. No third-party credentials are copied into source. A key bundled in an APK can be extracted from that APK.

Run **Build ZeroStreams APKs** manually from GitHub Actions. It builds and lints both variants and uploads **ZeroStreams-mobile-and-tv-debug**:

- `app-mobile-debug.apk`: Android phone/tablet.
- `app-tv-debug.apk`: Android TV/Google TV.

These are debug APKs, not Play Store releases. Debug signing keys can differ between CI runners; Android may require uninstalling an older debug build, which clears its local data.

## Refresh behavior

The app retrieves movie and TV metadata directly from TMDB when opened, on refresh and after returning to the app following five minutes. Search and browse pages request TMDB on demand. Seasons and episodes load when selected. New titles and episodes require no APK rebuild. The previous static catalog, importer backend, episode snapshots and scheduled catalog workflow have been removed. No GitHub catalog feed or website scraper is needed.

TMDB supplies metadata, not video streams. A TMDB search result does not guarantee VidStuck has a playable source. Manga and live events have their own APIs.

## External-player limitations

Common ad-domain requests, new windows and top-level cross-site redirects are blocked. The reported timed QR advertisement is targeted using its decoded destination domain and a narrow creative filter: matching label, large QR graphic, circular countdown, white fullscreen container, and no video or genuine CAPTCHA inside that container. The filter runs inside player frames when Android System WebView supports document-start scripts; older WebViews receive a main-frame fallback and an update notice. Genuine provider verification remains intact. The filter has DOM regression coverage, but elimination of the actual TV ad still requires device confirmation.

TV keeps the HTML player surface instead of entering native video fullscreen, so embedded playback controls can remain accessible. Recognized and detected bottom control bars hide after three idle seconds; remote input wakes the controls through the frame tree. Audio boost only connects compatible streams after the audio context is running, so unsupported sources are not deliberately rerouted into silence. Real provider layouts, remote navigation and audio remain subject to device testing. No native JavaScript bridge or verification/DRM bypass is introduced.

## Credits

This product uses the TMDB API but is not endorsed or certified by TMDB. The approved TMDB logo and attribution appear in Settings. Artwork and metadata belong to their respective rights holders. Manga data: MangaDex. Live event metadata: Streamed. Video player: VidStuck.

## Verification

The APK workflow checks domain-boundary blocking, normalized title matching, timed QR ad removal, preservation of CAPTCHA/video content, late ads, remote controls and audio routing, compiles mobile/TV variants and runs Android lint. Live TMDB discovery, show and season endpoints were checked using the user's own credential. No credential appears in repository source. Playback and challenge behavior cannot be verified from this development environment.
