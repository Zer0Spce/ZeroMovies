from pathlib import Path
p=Path('README.md')
text=p.read_text(encoding='utf-8')

def once(old,new):
    global text
    count=text.count(old)
    if count!=1: raise SystemExit(f'README expected one match, found {count}: {old[:100]!r}')
    text=text.replace(old,new,1)

once('**[⬇️ Download the latest release](https://github.com/Zer0Spce/ZeroPlay/releases/latest)** · **[📋 v1.8.0 release notes](docs/release-1.8.0.md)** · **[📺 TV controls](docs/android-tv-controls.md)**',
     '**[⬇️ Download the latest release](https://github.com/Zer0Spce/ZeroPlay/releases/latest)** · **[📋 v1.8.1 release notes](docs/release-1.8.1.md)** · **[📺 TV controls](docs/android-tv-controls.md)**')
once('| 📥 **Offline downloads** | Configure hosted **TSP Search** in Settings. Select a healthy matching result, confirm, and download with the integrated engine. Queue, pause, resume, play offline, or delete files. |',
     '| 📥 **Offline downloads** | Configure hosted **TSP Search** in Settings. Select a healthy matching result, confirm, and download with the integrated engine. Queue, pause, resume, play offline, open the completed file in an external video player, or delete files. |\n| 💬 **Automatic subtitles** | Downloaded movies and episodes automatically use matching local SRT/VTT/ASS/SSA files. Add your own free SubDL key for automatic online fallback when a local subtitle is not available. |')
once('| Platform | v1.8.0 download | Getting started |','| Platform | v1.8.1 download | Getting started |')
once('| 📱 Android phone / tablet | `ZeroPlay-1.8.0-Android.apk` | Android 6+. Install the signed mobile APK. |','| 📱 Android phone / tablet | `ZeroPlay-1.8.1-Android.apk` | Android 6+. Install the signed mobile APK. |')
once('| 📺 Android TV / Google TV | `ZeroPlay-1.8.0-Android-TV.apk` | Android 6+. Install the signed TV APK and navigate with your remote. |','| 📺 Android TV / Google TV | `ZeroPlay-1.8.1-Android-TV.apk` | Android 6+. Install the signed TV APK and navigate with your remote. |')
once('| 🖥️ Windows 10 / 11 · x64 | `ZeroPlay-1.8.0-Windows-x64.zip` | Extract the ZIP and launch `ZeroPlay.exe`. |','| 🖥️ Windows 10 / 11 · x64 | `ZeroPlay-1.8.1-Windows-x64.zip` | Extract the ZIP and launch `ZeroPlay.exe`. |')
once('## 🆕 Version 1.8.0\n\n🎨 Choose **YouTube TV**, **Google TV**, or **Classic** in **Settings → Appearance → UI layout**. YouTube TV is the default for new and upgraded installations without a saved layout preference.',
     '## 🆕 Version 1.8.1\n\n💬 **Automatic subtitles:** downloaded torrent sidecar subtitles are detected locally first. When none are present, Android can use a user-supplied free SubDL API key to look up the matching title/season/episode automatically. The key is stored with Android Keystore.\n\n▶️ **External playback:** completed downloads keep ZeroPlay’s native offline player as the default and now include **Open in external player** on Android and Windows.\n\n📱 **Phone/tablet UI:** compact Android screens now place Watch, Source and Download actions below the title/poster block instead of squeezing them into a narrow column. Wider tablets retain the TV-style side action panel.\n\n🔐 **Private Android TV build:** CI can build a same-package private TV APK with a TSP key supplied only through the `TSP_API_KEY` Actions secret. It is not included in public release assets.\n\n### UI layouts carried forward from 1.8.0\n\n🎨 Choose **YouTube TV**, **Google TV**, or **Classic** in **Settings → Appearance → UI layout**. YouTube TV is the default for new and upgraded installations without a saved layout preference.')
once('See the [complete 1.8.0 release notes](docs/release-1.8.0.md).','See the [complete 1.8.1 release notes](docs/release-1.8.1.md).')
p.write_text(text,encoding='utf-8')
print('Updated README for 1.8.1.')
