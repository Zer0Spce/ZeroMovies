# ZeroPlay for Windows

Portable Electron app. Extract the ZIP and run `ZeroPlay.exe`; no installer is needed.

## Version 0.4.5

- Compact theme toggle with a red 🎲 Surprise me button beside it.
- Surprise picks released TMDB movies from randomly sampled discovery pages, with recent-pick avoidance, rather than the homepage pool.
- Categories in the sidebar, separate movie and TV genres, and paginated genre discovery.
- Watch Now and a separate source picker beside the movie name and poster, above synopsis and cast. VidStuck is marked Recommended; all four sources remain available.
- Subtle blurred catalog artwork, with sharp buttons and labels in light and night modes.
- Existing single-window playback, native fullscreen, Back handling, adblocking, watchlist and local library are retained.

`npm test` runs catalog, history and player-host tests. `scripts/ui-check.cjs` covers discovery controls using jsdom. The Windows Actions build additionally checks the configured TMDB key, runs actual Electron fullscreen/Back smoke tests and packages the portable ZIP.

TMDB metadata does not guarantee that a title is playable through an external source. Surprise samples up to 500 discovery pages per sort; it is not uniform over every TMDB ID.

## v1.0 live viewing

PPV/Sports uses the ZeroStreams event playlist and checks for updates every 30 minutes while its tab is open. LIVE TV uses the separate IPTV list; its colored refresh button updates it on demand. Both preserve the last good list when refresh fails. Search requires pressing Search. Catalog results load more automatically near the bottom, and categories show relevant artwork.

The local live player uses bundled Shaka Player (Apache 2.0), with HLS/DASH, playlist headers, and ClearKey support. Play/Pause, Live, Retry, Channels, Audio, Subtitles, Fit/Fill, volume and fullscreen controls stay in the same window. Back returns to browsing. Codec and stream availability vary.


### 1.7.5 downloads and previews
Configure hosted TSP Search under Settings → Downloads → Torrent Search. Select and confirm a result to download with the integrated engine. Completed files open in the native offline player without conversion. RawCast playback and its controls are hidden until enabled in Settings. Trailer previews default to two seconds and fill the carousel with proportional cropping; YouTube may retain some overlays.
