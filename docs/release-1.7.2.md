# ZeroPlay v1.7.2

- Restored original-format downloads: accept MP4, MKV and other supported direct video containers returned by RawCast, as in 1.7.1. Removed the MP4-only restriction introduced in 1.7.1.1.
- Downloads preserve the original file and its correct extension. No format selection, preparation, conversion, or full-file audio processing after downloading.
- Restored the JSON download response request (`redirect=false`) used in 1.7.1, while retaining safe handling of attachment redirects.
- Windows retains on-demand AAC audio decoding for supported AC-3/E-AC-3/DTS audio during playback; the original downloaded file is unchanged.
- Android offline files explicitly use Media3/ExoPlayer with a local FileDataSource, saved playback position and native controls; no HTTP source or online subtitles are requested for downloaded files. Codec support on Android depends on the device.
- Android downloads also finalize without the post-download player preparation check.

Availability remains dependent on RawCast; this patch does not guarantee a source for every title or verify the identity of upstream video content.

Includes signed Android / Android TV APKs and the portable Windows ZIP. Personal API keys and private APKs are excluded from the public release.
