# ZeroPlay website

Responsive movie/TV website using the same design and catalog features as the Windows app. Includes TMDB discovery, provider browsing, search, details, cast, trailers, related titles, episode selection, watchlists, collections, Plan to Watch and device-local watch/search history. No Live or Manga tabs. Includes saved night/light mode, a home Watchlist row, and a playback source picker for VidStuck, VidSrc.to, VidSrc.sh and SuperEmbed.

## Connect to Netlify

1. Open https://app.netlify.com/start and import `Zer0Spce/ZeroMovies` from GitHub, using branch `main`.
2. Keep the base directory empty. Root `netlify.toml` sets build command `node web/scripts/build.cjs`, publish directory `web/public`, and Functions directory `web/functions`.
3. In Netlify environment variables, add `TMDB_API_KEY` with your TMDB v3 key, available to **Functions** and production. The GitHub Actions secret does not automatically transfer to Netlify. Redeploy after setting it.
4. Publish and open the resulting `*.netlify.app` URL. Future commits to the connected production branch update the website automatically.

[Deploy to Netlify](https://app.netlify.com/start/deploy?repository=https://github.com/Zer0Spce/ZeroMovies) can also create a project from this repository. Use direct repository import to keep your existing GitHub repository connected.

The TMDB key stays in the serverless function. It is never injected into public assets or browser storage. The metadata endpoint accepts only supported TMDB routes and bounded parameters; it is not an arbitrary URL proxy. Search responses use private caching. No authentication or cross-device account synchronization is included; libraries stay in this browser.

VidStuck is embedded using its documented TMDB URLs and options. Playback progress is accepted only from the active iframe and exact VidStuck origin, matching content ID/type and validated timestamps. Embedded popups and top-level redirects are restricted by iframe sandboxing.

A normal website cannot inspect or remove content inside VidStuck's cross-origin iframe. The Android/Windows QR scanner, control filtering, remote mouse and audio boost do not run on the website. Provider advertisements/verification and playback availability remain controlled by VidStuck. The website's own close/title controls hide after idle time; the provider's controls remain its own.

Run `node --test web/test/*.test.cjs` and `node web/scripts/build.cjs` from the repository root. To preview with the real serverless API, use Netlify CLI `netlify dev` and configure the environment variable locally outside source control.

Credits: TMDB metadata/artwork; JustWatch availability through TMDB; VidStuck playback. This product uses the TMDB API but is not endorsed or certified by TMDB.
