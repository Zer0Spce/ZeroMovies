# ZeroPlay v1.7

## 🎨 New UI & Themes

- Added Default, Light and three selectable color palettes inspired by Digital Synopsis's numbered collection.
- Themes switch immediately and remain saved across restarts.
- Added configurable UI animations and delayed focus/hover information previews.
- Improved sidebar typography, focus states and appearance controls.

## 🎬 Trailer Experience

- Added default-on muted trailer playback in the homepage carousel.
- Added delayed, muted focus/hover trailer previews with configurable delay.
- Only one preview plays at a time; changing focus, navigating or hiding the app stops it.
- Missing, blocked or failed trailers automatically fall back to artwork.
- Separate settings control animations, information previews, focus trailers and homepage trailers.

## 📥 RawCast Downloads

- Added RawCast strictly as a download provider, separate from streaming and trailers.
- Added movie downloads and season/episode selection for series, from title details only.
- Added an internal, single-transfer download queue and a Downloads tab.
- Added progress, percentage, speed, downloaded/total size and ETA when available.
- Added pause, cancel, retry and byte-range resume where the server supports it.
- Added persisted download history, duplicate prevention and completed-file playback.
- Direct files use their actual container extension and are checked against the device's player before completion.
- Added securely stored personal API keys, masked key display, Save Key, Remove Key and Test API controls.
- Release builds require the user's own key. No developer fallback is included.
- Added authoritative request/quota information when returned by RawCast, manual usage refresh and setup instructions.
- Cached download resolution and avoided RawCast requests during ordinary browsing, previews or streaming.
- Added a configurable Windows download folder and app-specific Android Movies storage.

## 🗑️ Download Management

- Added Delete Video with title, file size and actual-file deletion confirmation.
- Added Remove from History, preserving the local video.
- Added detection for videos deleted outside ZeroPlay.
- Updated download records and the Downloads tab after deletion.

## ▶️ Player Fixes

- Back closes an active player menu or dialog and keeps playback running.
- With no player menu open, Back immediately returns to the previous page.
- Applied the behavior across Android Mobile, Android TV and Windows.

## 🌈 Easter Egg

- Press the ZeroPlay logo ten times to activate temporary colorful effects.
- Press it again or use Exit Easter Egg to restore the selected theme.
- The temporary mode does not overwrite theme preferences.

## 🧹 Cleanup

- Removed SuperEmbed and VidSrc.to, their source options and unused provider code.
- Retained VidStuck and VidSrc.sh, with safe migration of saved source selections.
- Removed unused torrent engines and dependencies.

## ⚡ Performance

- Loaded trailers only for the featured or focused title.
- Bounded preview metadata and image caches and stopped hidden previews.
- Throttled download progress updates and limited concurrent transfers to one.
- Reduced unused download dependencies and unnecessary provider requests.

## 🐛 Bug Fixes

- Fixed saved source selections pointing to removed providers.
- Fixed mislabeled direct videos being saved with an incorrect extension.
- Rejected HTML, HLS playlists and invalid files masquerading as downloaded video.
- Fixed resume handling when servers ignore byte ranges or return invalid ranges.
- Added interrupted-transfer retries, stalled-transfer timeouts and clear storage errors.
- Prevented stale API-key requests from restoring cached results after a key change.
- Fixed missing downloaded videos remaining marked playable.
- Fixed quick theme switching requiring an Android activity restart.
- Prevented an unfinished episode picker from falling back to episode 1.
- Paused downloads safely when history storage is full or unwritable.

RawCast offers a free API tier at release time; your account determines the actual limits.

Provider availability, playable codecs and resume support depend on the returned file and device. RawCast currently exposes quota headers on relevant responses; account identity fields and a separate quota endpoint are omitted when unavailable.
