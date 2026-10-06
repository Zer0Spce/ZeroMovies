# ZeroPlay v1.7.3

- Restored the 1.7.1 application baseline and download implementation after download problems with subsequent patches. This includes the original Windows MP4/MKV output choices and preparation behavior; the 1.7.1.1/1.7.2 playback and download changes are rolled back.
- RawCast playback is now disabled and hidden by default on Android, Android TV and Windows. Enable it with the RawCast playback toggle in Settings. Disabling it returns an existing RawCast selection to VidStuck. RawCast API key input, downloads and quota usage remain available independently.
- Windows homepage trailer videos fill the carousel using a responsive centered 16:9 cover crop, preserving proportions without stretching. Edges may be cropped; black bars embedded in the video may remain. Android carousel sizing is unchanged from 1.7.1.
- Updated the main page and download instructions for 1.7.3.

RawCast streaming and downloads share the account quota. Availability and upstream video content depend on the provider; this rollback does not guarantee a download for every title.

Includes signed Android and Android TV APKs, Windows portable ZIP and SHA-256 checksums. Personal API keys and private APKs are excluded from public assets.
