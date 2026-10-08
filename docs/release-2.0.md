# ZeroPlay 2.0 🎬📺🏟️

ZeroPlay 2.0 is the largest UI, TV-control, player, updater and reliability release since the ZeroMovies → ZeroPlay transition. This release keeps the existing Android signing identity and local libraries while rebuilding several parts that had accumulated too many one-off fixes.

## Highlights

- 📺 Android TV D-pad player navigation rewritten as one clean controller.
- 🖱️ Android TV Mouse mode back behavior fixed and preserved.
- 🎨 Four UI choices: Clean, Modern, Flix and Native / Original.
- 🧭 Platform-specific fresh-install defaults.
- 🖥️ Windows app fullscreen button beside Surprise Me / Update.
- 🔄 Native update flows for Windows, Android and Android TV.
- 🎬 Clickable cast and filmography navigation.
- 🍅 Rotten Tomatoes ratings through OMDb when configured.
- 🗂️ Rebuilt categories with international collections and Anime.
- 🛡️ Versioned 2.0 adblock hardening with learned-host quarantine.
- 🚪 Exit confirmation for playback and the app to prevent accidental exits.

---

## Every fix and improvement since 1.9

1. **Windows updater rebuilt** — checks GitHub on launch and manually, shows version/changelog, supports Update / Cancel / Skip, download progress, verification and relaunch.
2. **Android / Android TV updater added** — checks the GitHub release, downloads the matching APK and hands it to the Android installer with TV/mobile-friendly controls.
3. **Windows Settings reorganized** into General, Home, Appearance, Experience, Playback & Downloads, Player and About while preserving existing settings handlers.
4. **Android / Android TV Settings cleanup** brought the same grouping and readability improvements to the mobile/TV builds.
5. **Clean UI rebuilt around a YouTube-TV-style navigation model** with a full sidebar that collapses to a compact icon rail when browsing content.
6. **Modern UI rebuilt around a Google-TV-style presentation** with balanced header/navigation, cinematic discovery and portrait movie cards.
7. **Flix UI added** as a fourth cinematic layout with its own isolated layout rules so it does not leak styling into the other interfaces.
8. **Native / Original UI preserved** for users who prefer the original ZeroPlay layout.
9. **Fresh-install defaults corrected:** Windows → Clean UI, Android phone/tablet → Modern UI, Android TV → Native / Original UI. Existing saved choices remain untouched.
10. **Modern Movies & Shows shelves made more compact** so more content fits naturally without oversized cards.
11. **Portrait vs. landscape card behavior corrected** across content sections.
12. **Carousel timing standardized to 15 seconds** with directional transitions that respect the UI Animations setting.
13. **17 exact themes finalized:** Zero Dark, Zero Light, Ocean, Orchid, Sunset, Midnight Blue, Ember Glow, Forest Moss, Rose Noir, Amethyst, Cyber Mint, Cobalt Sky, Golden Hour, Coral Night, Aurora, Slate Ice and Mocha.
14. **Theme-aware ZeroPlay branding added** so `Zero` remains the primary word while `Play` follows the active accent color.
15. **Clickable cast added on Windows** using the exact TMDB person ID rather than name guessing.
16. **Clickable cast / filmography added on Android** using TMDB combined credits.
17. **Filmography pages corrected** to use combined movie + TV credits and the selected person’s exact TMDB identity.
18. **Categories redesigned** with clearer artwork, alphabetical browsing, international/language collections and Anime using the same visual system as the other categories.
19. **Surprise Me Again scoped correctly** so the control appears only on a title that was actually opened through Surprise Me.
20. **Rotten Tomatoes ratings added** through OMDb when `OMDB_API_KEY` is configured.
21. **Android TV Settings focus visibility fixed** so dropdowns and selectable settings show a clear highlight.
22. **Android TV Home navigation restored** to normal Android focus dispatch after custom key interception caused focus regressions.
23. **Android TV player mode made Settings-only** — Mouse / D-pad selection is no longer accidentally changed by a playback key.
24. **Android TV D-pad player navigation rewritten from scratch.** The previous collection of iframe guesses, wake interceptors and competing handlers was removed in favor of one TV input controller.
25. **D-pad focus highlight cleaned up** with a slimmer teal focus treatment that also works with open Shadow DOM controls.
26. **D-pad left/right navigation no longer intentionally maps to provider seek actions** while navigating the control surface.
27. **D-pad hidden-control wake handling rebuilt** so the first remote input is reserved for restoring provider controls before normal navigation continues.
28. **Android TV Mouse mode kept independent** from the D-pad controller; the smooth virtual pointer remains the Mouse-mode input path.
29. **Mouse-mode Back sequence fixed:** an open settings/quality/subtitle function closes first; visible player controls hide next; only the following Back exits playback.
30. **Player Back behavior is no longer allowed to dump the user out of playback just because an embedded provider is slow to answer.**
31. **Playback exit confirmation added** so leaving a movie/episode requires an explicit `Yes, exit` choice; `No` returns to playback.
32. **App exit confirmation added** to reduce accidental exits from the main application.
33. **Live TV reliability improved** with safer retry/error handling on Windows and Android.
34. **Cignal and Converge controls separated** so each provider can be enabled independently; Windows defaults both off while keeping other Live TV channels available.
35. **Android TV icon centering corrected** across focusable navigation surfaces.
36. **Windows Flix top-right controls corrected** and kept isolated from the other layouts.
37. **Windows Offline Player rebuilt around local/native playback** with local SRT/VTT/ASS/SSA parsing, playback controls, Fit / Fill, speed and fullscreen support.
38. **Windows Offline Player compositor handling improved** with the Direct Composition video-overlay workaround retained for files that previously hid controls behind the video surface.
39. **Manual Offline Player show/hide control added** as a fallback after automatic hide proved unreliable across Windows media/compositor combinations.
40. **Windows app fullscreen button added** beside Surprise Me / Update. It enters true app fullscreen, removes the normal Windows chrome and hides the visual scrollbar while preserving scrolling.
41. **Live PPV / Live TV / Live Sports player behavior retained** while the movie/offline-player work was isolated from those stacks.
42. **Adblock ruleset versioned** as `2.0-known-good-2026-10-08` so the known-good baseline is identifiable and reversible.
43. **Confirmed-host quarantine added:** a host positively identified by the QR scanner is blocked exactly for the rest of the current session.
44. **Temporary learned ad-host list added:** confirmed hosts are remembered for seven days rather than becoming permanent rules forever.
45. **Explicit provider/CDN allowlist added** so VidStuck, VidSrc.sh and common player/video CDN hosts cannot be accidentally caught by future ad rules.
46. **Local adblock debug log added** with the ruleset version, blocked host and reason, making playback regressions easier to diagnose without sending browsing data anywhere.
47. **Safer cosmetic ad cleanup added:** the app first removes an exact confirmed-host ad frame/container; the broader legacy QR cleanup is used only as a confirmed-QR fallback.
48. **Popunder/new-window hardening retained and reinforced** through denied popup windows, denied unsupported top-level redirects and allowlist-aware network rules.
49. **Windows adblock now mirrors the learned-host model** with an expiring local learned-host file and rolling local debug log.
50. **QR confirmation never opens the QR destination and never interacts with CAPTCHA/verification controls.**
51. **Release/test coverage expanded** for the rewritten TV controller, Shadow DOM focus, staged Back behavior, adblock allowlist, ruleset version and exact-host quarantine.
52. **Windows portable packaging remains installer-free** and keeps all normal browsing/playback in one application window.

---

## Adblock 2.0

The adblock upgrade deliberately favors **confirmed evidence over aggressive guessing**.

- Static ad-network rules remain deliberately small.
- A QR destination must be positively decoded before its exact host is learned.
- Learned hosts expire after seven days.
- The current-process quarantine blocks the exact confirmed host immediately.
- Player/provider/CDN allowlists take priority over blocking rules.
- Block decisions are logged locally with the ruleset version and reason.
- New-window/popunder attempts remain denied inside app playback.
- CAPTCHA / Cloudflare / verification controls are not clicked, solved or removed by ZeroPlay.

The stable 2.0 restore point is preserved on:

`backup/v2.0-stable-2026-10-08`

---

## Known issues / workarounds

### Windows Offline Player controls

On some Windows systems/video files, the Offline Player’s control chrome can still become unreliable after using the manual eye control. In the affected state the eye control itself or subtitle overlay may also disappear.

**Workaround:** from the completed download, choose **Open in external player** and play the file with your preferred local player. The downloaded media file itself is unaffected.

### Microsoft Defender SmartScreen

If the Windows build is not signed with a trusted Authenticode certificate, Windows may show an **Unrecognized app / Windows protected your PC** warning. The release workflow still runs the packaged Windows files through Microsoft Defender before publishing. SmartScreen reputation requires trusted code signing and reputation over time.

### Third-party embedded players

VidStuck / VidSrc.sh can change their player UI or advertising behavior independently of ZeroPlay. A provider update can temporarily affect control discovery, resume events, subtitle behavior or ad filtering until ZeroPlay adapts.

### QR overlays

2.0 is substantially stricter about confirmed QR-ad hosts, but if a provider changes its creative before the filter recognizes it, close the overlay with its **X** or wait for it to expire. ZeroPlay does not bypass verification/CAPTCHA challenges.

---

## Downloads

Release assets:

- `ZeroPlay-2.0-Android.apk`
- `ZeroPlay-2.0-Android-TV.apk`
- `ZeroPlay-2.0-Windows-x64.zip`
- `SHA256SUMS.txt`

Android production APKs continue using the existing ZeroPlay signing identity so production installations can update in place.

---

Thanks to everyone who kept testing the awkward stuff: TV focus, Back sequencing, provider menus, local playback, live channels and the ads that only show up when you think you are finally done. 2.0 exists because those edge cases got tested instead of hand-waved away.
