# ZeroPlay v1.7.5

- Replaced RawCast downloads with hosted **TSP Search** and integrated torrent downloads on Windows, Android and Android TV. Configure your TSP URL and personal key in **Settings → Downloads → Torrent Search**; no local search server or external torrent client is required.
- Download opens a picker with up to ten matching results, reported seeds/leechers, size, quality, codec and health score. Wrong years/episodes, suspect results, invalid magnets and weak swarms are filtered. Review and confirm a result before starting.
- Added a persistent download queue with pause, cancel, resume, progress, speed and peer counts. Up to two transfers run at once. Multiple substantial video files require a file selection; samples and executable files are excluded. Android provides a foreground notification and defaults to Wi-Fi/Ethernet only.
- Added Android storage selection for app-scoped internal and available external/USB locations. Completed files use the existing native offline player. No download conversion/preparation stage or playback during torrent transfer is used. Completed legacy downloaded files remain available where their original files still exist.
- **RawCast is optional playback only, off by default.** Its source, API key controls and usage panel stay hidden while off. Disabling a selected RawCast source returns playback to VidStuck. Enable it explicitly to use your own key and limited provider quota.
- Windows homepage carousel trailers now cover the full frame using a centered proportional crop, without stretching. Preview containers resize with the window.
- Muted trailer previews on all platforms default to a **two-second focus delay**. YouTube controls and annotations are disabled and previews are cropped to reduce title overlays. YouTube can still display its own branding or overlays; complete removal is not guaranteed.
- Updated the main page, settings and download instructions for this release.

TSP reports swarm availability; these reports do not guarantee transfer speed or an available download for every title. Only download public-domain, Creative Commons, user-owned or otherwise authorized content. Codec support depends on the platform's native player. Public release artifacts contain no personal API keys.
