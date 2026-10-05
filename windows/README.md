# ZeroMovies for Windows

Portable Electron app. Extract the ZIP and run `ZeroMovies.exe`; no installer is needed.

## Version 0.4.5

- Compact theme toggle with a red 🎲 Surprise me button beside it.
- Surprise picks released TMDB movies from randomly sampled discovery pages, with recent-pick avoidance, rather than the homepage pool.
- Categories in the sidebar, separate movie and TV genres, and paginated genre discovery.
- Watch Now and a separate source picker beside the movie name and poster, above synopsis and cast. VidStuck is marked Recommended; all four sources remain available.
- Subtle blurred catalog artwork, with sharp buttons and labels in light and night modes.
- Existing single-window playback, native fullscreen, Back handling, adblocking, watchlist and local library are retained.

`npm test` runs catalog, history and player-host tests. `scripts/ui-check.cjs` covers discovery controls using jsdom. The Windows Actions build additionally checks the configured TMDB key, runs actual Electron fullscreen/Back smoke tests and packages the portable ZIP.

TMDB metadata does not guarantee that a title is playable through an external source. Surprise samples up to 500 discovery pages per sort; it is not uniform over every TMDB ID.
