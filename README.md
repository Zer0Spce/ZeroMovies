# ZeroMovies

Android phone and Android TV app for TMDB movie and series discovery, with VidStuck, VidSrc.to, VidSrc.sh and SuperEmbed playback. Android version **0.4.5**.

## Discovery and library

- Backdrop carousel with six trending picks, previous/next controls, slide indicators, phone swipes and TV ranked picks. Automatic rotation pauses during focus interaction and while the app is in the background.
- Continue Watching, Coming Soon with release dates, recommendations, popular titles, series and now-playing rows.
- Streaming-provider logos and movie/TV discovery filters. Provider availability is region-specific, supplied by JustWatch through TMDB. Browsing a catalog provider does not change the chosen playback source or imply a subscription is included.
- Title details with softly blurred artwork, synopsis, genres, runtime, country, director/creators, cast, trailers and related recommendations.
- Watchlist, collections, Plan to Watch and sharing public TMDB title links.
- Device-local watch history (100 recent entries) and search history (30 queries), with replay, removal and clearing. Queries are recorded on search submission or choosing a result, rather than every partially typed query.
- Continue Watching uses VidStuck and VidSrc.sh progress events when available. Percentage bars are based on reported timestamps/duration; no invented match scores or playback percentages. Titles without progress events remain marked Started. Episode history preserves the selected season/episode even before a progress event arrives.
- Local clock, saved night/light mode, and a Watchlist row on Home. The compact theme toggle and red 🎲 Surprise Me control are at the top right. Surprise picks sample TMDB discovery beyond home-page rows. Weather has been removed.
- Categories in the TV side rail and phone navigation use TMDB movie/series genres with paginated results. Watch Now uses the selected source directly; its adjacent Source control marks VidStuck Recommended.
- TV navigation has a dimmed, softly blurred artwork backdrop. Title details place Watch Now beside the poster/title and above the synopsis and cast.
- Live and Manga tabs are removed from mobile/TV navigation; restored sessions return to Home.

## TV playback and performance

The homepage and app navigation use standard D-pad focus. **Mouse mode applies only inside the video player**, with continuous movement, acceleration and frame-synced drawing. Playback defaults to D-pad focus navigation: arrows move focus and OK activates the selected control. Left does not send the player's seek hotkey. In optional mouse mode, arrows move the pointer; Menu toggles mouse/focus mode. The preference is also available in Settings. Back hides visible player controls first and keeps playback open. The second Back returns to browsing without waiting for embedded frames. There is no app toolbar over Android playback. The labelled player Back control returns to the app. Watch now appears above the synopsis and cast.

Recognized player control bars hide after three idle seconds and wake on remote input. Optional audio boost offers Off, 1.5× and 2× with a limiter. Boost requires compatible embedded audio; non-CORS sources retain their original audio path.

Artwork downloads use separate workers from catalog/search requests. Only visible artwork starts downloading, images are downsampled and cached, and stale image responses cannot replace a different carousel title. Ad-page inspection is throttled to reduce DOM work.

## QR advertisement handling

The earlier text-only QR filter did not eliminate the ad reported on the user's TV. This version additionally inspects small, temporary in-memory snapshots of the player, decodes the visible QR destination with ZXing, and targets the reported advertising domain and its narrow campaign URL fingerprint. It never visits the QR destination or responds to a verification prompt. Confirmed advertising banners can be removed even when their text/QR is painted into an image or CSS background, including viewport-sized image/canvas artwork without a white DOM wrapper.

Common ad domains, popups and top-level cross-site redirects remain blocked. Genuine CAPTCHA frames and video containers are protected by the cosmetic filter. Modern Android System WebView document-start support is needed for filtering inside cross-origin player frames; older WebViews receive an update notice and a main-frame fallback.

Tests cover decoder images and advertisement/CAPTCHA/video boundaries. Actual elimination of the provider's TV ad still needs device confirmation. Ads burned into the video, different creatives and unsupported WebViews may remain. No verification or DRM bypass is implemented.

## Website

The responsive website is prepared for Netlify. Import this repository with the root `netlify.toml` and set `TMDB_API_KEY` for Netlify Functions. See [website setup](web/README.md). Browser libraries stay local, and embedded VidStuck ads remain controlled by the provider.

## API key and builds

Create a TMDB **API Key (v3 auth)** at https://www.themoviedb.org/settings/api. Add repository Actions secret **TMDB_API_KEY** to bundle it in APK builds. A nonempty key entered in Settings overrides the bundled key; leaving it blank uses the bundled key. APK client keys can be extracted. No key is committed to repository source.

All platforms are branded **ZeroMovies**. The Windows app and uses a single window for browsing and playback, with native fullscreen from the embedded player. Windows 10/11 x64 builds are available from the **Build ZeroMovies Windows** workflow. Future Windows artifacts contain a portable ZIP only. See [Windows instructions](windows/README.md). Future Windows builds run manually on explicit request.

Run **Build ZeroMovies APKs** manually from GitHub Actions. Download **ZeroMovies-mobile-and-tv-debug**:

- `app-mobile-debug.apk`: Android phone/tablet.
- `app-tv-debug.apk`: Android TV/Google TV.

These are debug APKs. CI debug signing keys can differ; Android may require uninstalling the older debug build, which clears its local library and history.

## Refresh and progress

TMDB metadata loads when opened, on refresh and after returning following five minutes. Search, provider discovery, title details and episodes load on demand. New content needs no APK rebuild. TMDB supplies metadata, not video streams; a search result does not guarantee VidStuck availability.

Progress messages use an origin-restricted WebView listener for `https://vidstuck.xyz`. Events must match the current content ID/type and pass timestamp/duration/episode boundary checks. Other player frames do not receive an unrestricted native interface. Resume positions depend on the provider emitting its documented progress events.

History is stored on the device. Clearing watch history also clears resume positions; saved title metadata and watchlists remain.

## Credits and validation

This product uses the TMDB API but is not endorsed or certified by TMDB. The approved logo and attribution appear in Settings. Metadata and artwork: TMDB and their respective rights holders. Provider availability: JustWatch through TMDB. Video player: VidStuck. Manga: MangaDex. Sports metadata: Streamed. Optional weather: Open-Meteo; city lookup: GeoNames via Open-Meteo. QR decoding: ZXing (Apache 2.0). Android media playback: AndroidX Media3.

The APK workflow runs domain/search/progress boundary checks, DOM advertisement/control/audio regressions and JVM discovery-history/QR-decoder tests, then compiles and lints mobile and TV variants. TV navigation, actual provider playback, layout and perceived performance require device testing.
