# ZeroPlay website

Responsive movie/TV website using the same design and catalog features as the Windows app. Includes TMDB discovery, provider browsing, search, details, cast, trailers, related titles, episode selection, watchlists, collections, Plan to Watch and device-local watch/search history. No Live or Manga tabs. Includes saved night/light mode, a home Watchlist row, and a playback source picker for VidStuck and VidSrc.sh.

## Deploy to Vercel

1. Import `Zer0Spce/ZeroPlay` into Vercel from GitHub and use branch `main`.
2. Keep the project root at the repository root. The checked-in `vercel.json` runs `node web/scripts/build.cjs` and publishes `web/public`.
3. Add the environment variable `TMDB_API_KEY` in Vercel Project Settings → Environment Variables. Enable it for Production and Preview if you want preview deployments to load the real catalog.
4. Deploy. The browser uses `/api/tmdb`, which is backed by the Vercel Function at `api/tmdb.js`.
5. Future commits to the connected production branch can redeploy automatically through the Vercel Git integration.

The Vercel function keeps the TMDB key server-side. It validates supported TMDB routes and bounded parameters before forwarding the request, so it is not an arbitrary URL proxy. Search responses use private caching; normal catalog responses use short shared caching.

## Netlify compatibility

Netlify remains supported. Root `netlify.toml` runs the same build command, publishes `web/public`, and maps `/api/tmdb` to `web/functions/tmdb.js`. Configure `TMDB_API_KEY` in Netlify environment variables before deploying.

## Website behavior and security notes

No authentication or cross-device account synchronization is included; libraries stay in this browser.

VidStuck is embedded using its documented TMDB URLs and options. Playback progress is accepted only from the active iframe and exact VidStuck origin, matching content ID/type and validated timestamps. Embedded popups and top-level redirects are restricted by iframe sandboxing.

A normal website cannot inspect or remove content inside VidStuck's cross-origin iframe. The Android/Windows QR scanner, control filtering, remote mouse and audio boost do not run on the website. Provider advertisements/verification and playback availability remain controlled by VidStuck. The website's own close/title controls hide after idle time; the provider's controls remain its own.

## Local checks

Run:

```bash
node --test web/test/*.test.cjs
node web/scripts/build.cjs
```

For Vercel local development, use `vercel dev` with `TMDB_API_KEY` configured outside source control. For Netlify, use `netlify dev`.

Credits: TMDB metadata/artwork; JustWatch availability through TMDB; VidStuck playback. This product uses the TMDB API but is not endorsed or certified by TMDB.
