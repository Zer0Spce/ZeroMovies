# ZeroPlay 2.0 — Draft Release Notes

> Development draft only. Do not publish until the 2.0 release is explicitly approved.

## Important — Android updater permission

Android and Android TV users may need to allow **Install unknown apps** / **Allow from this source** for ZeroPlay before in-app updates can install.

When an update is available and the user presses **Update**, ZeroPlay will open Android's app-specific **Install unknown apps** settings page for ZeroPlay if the permission is not already enabled. Enable **Allow from this source**, then return to ZeroPlay. The updater will continue automatically, verify the downloaded APK with SHA-256, and open Android's normal package installer confirmation.

This permission is only used so ZeroPlay can hand a downloaded ZeroPlay APK to Android's package installer. Android still controls the final installation confirmation.
