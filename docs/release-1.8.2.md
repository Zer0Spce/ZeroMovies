# ZeroPlay 1.8.2

A UI and downloads polish release focused on better platform defaults and a cleaner torrent picker.

## ✨ What’s new

- **Platform-specific UI defaults** — Android TV now defaults to **Native / Original UI**, Android phone/tablet defaults to **Modern UI**, and Windows defaults to **Clean UI**. Existing saved layout choices are preserved.
- **Clean UI refresh** — the Clean layout now uses a darker YouTube-inspired presentation with compact navigation, rounded search, clearer focus states, cleaner cards, and restrained branding.
- **Up to 20 healthy torrent results** — TSP Search can now return up to 20 ranked matching results on Android and Windows while preserving the existing health, seeder, title/year, episode, and suspect-result filtering.
- **Better torrent result cards** — resolution, codec, size, seeders, leechers, health score, health bar, and a Recommended result are easier to scan.
- **Themed download confirmation** — torrent download confirmation now follows the active ZeroPlay UI instead of using a generic popup.
- **Android TV focus polish** — layout selection and torrent controls retain remote-friendly focus behavior.

## 📥 Downloads

- TSP Search remains the torrent-search provider.
- Existing v1.8 torrent download behavior is preserved.
- Confirmation remains required before a selected torrent is queued.
- Seeder counts and health scores help rank results but do not guarantee download speed.
- Public Android APKs do not contain the private TSP API key.

## 🔐 Private Android TV build

A separate private Android TV APK can be built with the repository `TSP_API_KEY` secret embedded at build time. This private APK is not attached to the public GitHub release and should not be redistributed because embedded API keys can be extracted from APK files.

## Platforms

- Android Mobile / Tablet
- Android TV
- Windows portable ZIP

Windows remains portable-only; no installer is included.
