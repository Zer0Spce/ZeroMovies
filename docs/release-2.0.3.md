# ZeroPlay 2.0.3

## Windows updater repair

ZeroPlay 2.0.3 replaces the Windows portable updater handoff. The updater now waits for every ZeroPlay process using the installed executable, force-closes only remaining ZeroPlay processes if necessary, overlays the complete extracted portable package with retry handling, verifies both `ZeroPlay.exe` and `resources/app.asar` after replacement, and relaunches the updated application from the installation directory. A detailed `ZeroPlay-updater.log` is written to the Windows temporary directory if installation fails.

> **Important for Windows users:** the updater in earlier builds cannot reliably replace its own files. Please manually download the full **ZeroPlay 2.0.3 Windows ZIP**, extract it over your current ZeroPlay folder, and launch ZeroPlay once. This installs the repaired updater for future updates.

## Series playback selection

On Android mobile/tablet, Android TV, Windows, and Web, TV-series details now show separate **Season** and **Episode** selectors beside or directly below the Watch Now area. Selecting a season loads its episode list, and **Watch Now** opens the exact selected episode. Movies are unchanged.
