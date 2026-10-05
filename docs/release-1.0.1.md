# 🎬 ZeroPlay v1.0.1 — New name, better playback

**ZeroMovies is now ZeroPlay — Movies. Live TV. One place.** The new name appears in Android, Android TV, Windows, and the portable executable. Existing app IDs and saved data remain compatible.

## 📺 Windows LIVE TV

- Corrects invalid audio-channel counts in ZTE/Converge DASH manifests. Valid multichannel layouts and other channel-description schemes remain preserved.
- Updates audio-track controls to the bundled Shaka player's current APIs, so working playback is not reported as unavailable.
- Native Windows checks now decode real DASH, HLS, and ClearKey test media and require playback time to advance. The DASH fixture includes the malformed audio metadata seen in Converge's playlist.

## 🛡️ Broader advertisement blocking

- Removes explicit banner/ad slots and ad-labelled popups; blocks known advertising requests, redirects, and new windows.
- Handles dark or smaller timed “Confirm you're not a robot” QR advertisements with a close button, nested headings, and open shadow roots.
- Continues checking for ads inserted after playback starts. Genuine CAPTCHA widgets, checkbox challenges, and movie controls remain preserved.

## 🖱️ Android TV

Mouse mode stays enabled by default for movie playback. Arrows move the cursor; OK clicks; Menu switches to focus navigation and remembers your choice.

## ⬇️ Downloads

- 📱 `ZeroPlay-1.0.1-Android.apk`
- 📺 `ZeroPlay-1.0.1-Android-TV.apk`
- 🖥️ `ZeroPlay-1.0.1-Windows-x64.zip` — extract and launch `ZeroPlay.exe`.
- ✅ `SHA256SUMS.txt`

Signed Android APKs update earlier production builds while preserving local data. Windows library data is retained. PPV/Sports, LIVE TV, automatic catalog loading, submitted search, and category artwork remain included.

Stream availability still depends on the provider and device codecs. Automated checks do not guarantee every third-party stream or advertisement behaves identically on every device.

<sub>Made with care by JeremieWTF ✦</sub>
