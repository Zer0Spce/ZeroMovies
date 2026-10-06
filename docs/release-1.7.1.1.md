# ZeroPlay v1.7.1.1 🎬

Windows offline playback hotfix:

- Removed the lengthy preparation step after downloads and when opening older downloads. MP4 and MKV files remain unchanged; no second movie file, full-video conversion, or extra disk space is needed.
- Added on-demand offline audio decoding for AC-3, E-AC-3 and DTS to AAC inside the existing player. Audio is decoded only during playback; the original video track is copied into a temporary in-memory playback stream.
- Seeking restarts playback at the selected position. Pause, volume and fullscreen remain available.
- Removed the MKV download option. New downloads use RawCast’s documented Direct MP4 endpoint with selectable quality on Windows. Non-MP4 responses are rejected without conversion. Existing MKV downloads can still be played. File size depends on the source supplied by RawCast.

Includes signed Android and Android TV APKs plus the portable Windows ZIP. RawCast fixes apply to all platforms: resolve ranked DASH/HLS/MP4 URLs, preserve required stream headers and subtitles, request clean retail releases, reject mismatched title IDs and known Rickroll URLs. Windows additionally receives the offline playback hotfix. Personal builds and API keys are excluded from this public release.
