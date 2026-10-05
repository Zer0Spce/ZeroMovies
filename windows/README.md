# ZeroStreams for Windows

Windows 10/11 (64-bit) desktop app. Catalog and search use TMDB; movie and series playback uses VidStuck. There are no Live or Manga tabs.

Features include the trending carousel, recommendations, popular titles, upcoming movies, provider filters, full TMDB title search, details/cast/trailers/related titles, season and episode selection, watchlists, Plan to Watch, collections, local search/watch history and reported playback resume positions.

Download the `ZeroStreams-Windows-x64` artifact from **Build ZeroStreams Windows** in GitHub Actions. Future builds are portable ZIP only: extract the ZIP and run `ZeroStreams.exe` inside it. Keep the extracted folder together. This first build is unsigned and Windows may display a publisher warning.

The player opens in a separate window. F11 toggles full screen. Escape/Browser Back hides visible controls first and leaves the movie open; another press can return once embedded controls report hidden. Closing the player window always returns to the catalog. Mouse movement wakes the controls; they hide after three idle seconds. Optional compatible-stream audio boost is in Settings.

The player blocks known ad hosts, popups and cross-site top-level navigation. Its QR filter uses temporary in-memory snapshots to identify the reported advertising URL, then removes confirmed ad overlays. No snapshots or decoded campaign URLs are saved. Real provider playback and QR removal need device testing; unknown creatives and burned-in video ads may remain. Genuine verification is preserved.

Library data is saved in Windows `%APPDATA%/zerostreams-windows/library.json`. Custom TMDB keys are protected with Electron safeStorage/Windows encryption. The repository `TMDB_API_KEY` secret is bundled by CI, and Settings can override it. Bundled client keys are extractable; no credential is committed to source.

Local development: install Node.js 22+, run `npm ci`, `npm run prepare-config`, then `npm start` from this folder. `npm test` validates content URLs, request boundaries, progress and history. `npm run build` packages a portable Windows x64 ZIP only. Generated config and build outputs are excluded from git.

Credits: TMDB metadata/artwork; JustWatch provider availability through TMDB; VidStuck playback; jsQR (Apache 2.0); Electron; electron-builder. This product uses the TMDB API but is not endorsed or certified by TMDB.
