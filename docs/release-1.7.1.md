# ZeroPlay v1.7.1 🎬

## 🐛 Fixes across Android Mobile, Android TV and Windows

- Moved Downloads into Your Space. On mobile, open Your Space from the library button.
- Added masked RawCast API key entry, Save Key, Remove Key and Test API directly in Downloads alongside the usage panel.
- Added RawCast as an optional streaming source with a clear limited API quota warning. Streaming uses the securely stored personal key and shares usage reporting with downloads. Only explicit RawCast playback resolves a stream; catalog browsing and trailers consume no RawCast quota.
- Kept VidStuck as the default and recommended playback source, while preserving an explicitly selected alternate source.
- Positioned delayed movie descriptions beside the selected poster and title, with placement adjusted to fit the screen.

## 🪟 Windows fixes

- Fixed the homepage and hover YouTube trailer embed origin by serving the local UI from a matching loopback HTTP origin. Previews remain muted and fall back to artwork when YouTube blocks a trailer.
- Added local AAC stereo audio preparation for downloaded videos, covering MKV files with audio codecs unsupported by Chromium.
- Added MP4 and MKV output choices plus 1080p, 720p, 480p and 360p quality selection before downloading.
- Converts the provider file into the selected container locally; this does not claim a provider-side format option. Lower quality can reduce download size; changing the container alone does not guarantee a smaller file.
- Copies video without re-encoding where supported, with H.264 conversion when required by the built-in player.
- Prepares legacy downloads for compatible playback when opened. Preparation can take time and requires additional disk space. Successful legacy preparation replaces the old file with a compatible MP4.
- Validates video playback and audio decoding before finalizing newly downloaded videos.

Includes signed Android Mobile and Android TV APKs and a Windows x64 portable ZIP. RawCast keys are stored securely and are never bundled in releases. Usage displays authoritative provider quota information when available.
