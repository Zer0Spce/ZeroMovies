# Android TV playback controls (v1.0)

- Press Back once to hide playback controls; press Back again to leave the movie.
- Using the remote or touching the player starts a new hide-then-exit sequence.
- Mouse mode starts enabled: D-pad arrows move the cursor and OK clicks. Press Menu to switch to focus navigation.
- In focus mode, arrows move between visible player controls and OK activates the focused control. A mint outline marks it.
- A labelled Back / Go back / Return / Exit player control returns to the app.
- Menu toggles playback-only mouse mode and remembers your choice. Homepage navigation is unchanged.
- Controls still hide while idle and return when the remote is used.

QR ad scanning starts sooner and runs more often during the first 18 seconds. Confirmed painted ad overlays in open shadow DOM are also inspected. Video elements and genuine verification prompts remain protected. Real-device playback and third-party ad behavior still need testing; this release does not guarantee ad-free playback.

Automated checks cover the two-step Back state, focus movement, suppression of raw arrow seeking, OK activation, frame navigation, labelled player Back, and shadow DOM QR removal. Both Android flavors run their unit tests, build, and lint in GitHub Actions.

Remote arrows and OK restore control bars hidden by the provider as well as the app's idle filter. Home includes Watchlist and a night/light mode toggle. Weather is removed. Source choices are VidStuck, VidSrc.to, VidSrc.sh and SuperEmbed.

## Native PPV/Sports / LIVE TV player (v1.0)

Open PPV/Sports or LIVE TV, choose a channel, and use arrows plus OK to operate the native player controls. Controls hide after a few seconds of playback; arrows or OK reveal them. Channel Up/Down switches channels. Media Play/Pause buttons work directly.

The player offers Play/Pause, Live (return to the live edge), Retry, Channels, Audio, Subtitles, and Fit/Fill. Back hides visible controls during playback; another Back returns to browsing. Unavailable streams offer Retry or another channel. PPV/Sports checks for a newer list every 30 minutes while its tab is open. The colored Refresh buttons update either list immediately; failed refreshes preserve the last saved channels.

Catalog and search pages load more titles automatically as you approach the bottom. Search starts only after pressing the Search button or the keyboard Search action.

🖱️ Android TV movie players start with mouse mode enabled, including the first launch after this update. Arrows move the cursor and OK clicks; Menu switches to D-pad focus and remembers your choice.
