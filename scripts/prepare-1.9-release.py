from pathlib import Path

def load(path): return Path(path).read_text(encoding='utf-8')
def save(path,text): Path(path).write_text(text,encoding='utf-8')
def rep(text,old,new,label,count=1):
    found=text.count(old)
    if found!=count: raise RuntimeError(f'{label}: expected {count}, found {found}')
    return text.replace(old,new,count)

p='scripts/publish-release.py'; s=load(p)
if s.count('1.8.2')<8: raise RuntimeError('publish script no longer matches expected 1.8.2 baseline')
s=s.replace('1.8.2','1.9')
save(p,s)

p='README.md'; s=load(p)
s=rep(s,'Softly blurred artwork, light and dark themes, and dedicated TV controls make it comfortable on your phone, desktop, or big screen.','Softly blurred artwork, **17 color themes**, and dedicated TV controls make it comfortable on your phone, desktop, or big screen.','README intro')
s=rep(s,'**[⬇️ Download the latest release](https://github.com/Zer0Spce/ZeroPlay/releases/latest)** · **[📋 v1.8.1 release notes](docs/release-1.8.1.md)** · **[📺 TV controls](docs/android-tv-controls.md)**','**[⬇️ Download the latest release](https://github.com/Zer0Spce/ZeroPlay/releases/latest)** · **[📋 v1.9 release notes](docs/release-1.9.md)** · **[📺 TV controls](docs/android-tv-controls.md)**','README release link')
s=rep(s,'| 🎨 **Three UI layouts** | YouTube TV (default), Google TV and Classic; choose a layout independently of your color theme. |','| 🎨 **Three UI layouts** | **Clean UI**, **Modern UI**, and **Native / Original UI**. Fresh-install defaults are Windows → Clean, Android → Modern, Android TV → Native. Saved choices are preserved. |','README layout feature')
s=rep(s,'| 🎨 **Make it yours** | Default, Light and three numbered color palettes; immediate theme switching, optional animations and delayed focus/hover previews. |','| 🎨 **Make it yours** | **17 selectable themes** including Midnight Blue, Ember Glow, Forest Moss, Rose Noir, Amethyst, Cyber Mint, Golden Hour, Aurora and more; immediate switching, optional animations and delayed focus/hover previews. |','README theme feature')
s=rep(s,'| 📥 **Offline downloads** | Configure hosted **TSP Search** in Settings. Select a healthy matching result, confirm, and download with the integrated engine. Queue, pause, resume, play offline, open the completed file in an external video player, or delete files. |','| 📥 **Offline downloads** | Configure hosted **TSP Search** in Settings, review up to **20 healthy results**, then download with the integrated engine. Active transfers show poster, synopsis, quality, health, peers, speed, ETA and progress. Windows uses the upgraded WebTorrent 3 engine. |','README download feature')
s=rep(s,'| 🖥️ **Windows portable** | Browse and play in one window, use native fullscreen, and return with the player Back button. No installer. |','| 🖥️ **Windows portable** | Browse and play in one window with no installer. Downloaded movies use a dedicated Video.js offline player with playback speed, fullscreen/PiP, Fit / Fill and automatic/manual local subtitle support. |','README windows feature')
s=rep(s,'## 🎨 Three layouts in 1.8.0','## 🎨 Three layouts','README layout heading')
s=rep(s,'Choose your layout in **Settings → Appearance → UI layout**. YouTube TV is the default; your theme, library and playback preferences stay independent of the layout.','Choose your layout in **Settings → Appearance → UI layout**. **Clean UI** is the Windows default, **Modern UI** is the Android phone/tablet default, and **Native / Original UI** is the Android TV default. Your saved layout, theme, library and playback preferences remain independent.','README layout paragraph')
s=rep(s,'| YouTube TV · default | Google TV | Classic · original |','| Clean UI | Modern UI | Native / Original UI |','README layout table')
s=rep(s,'Actual 1.8.0 Windows captures, kept at their original resolution. Click a preview to open it full size. On Android TV, the YouTube rail expands when you return to navigation and collapses when you focus a movie. Phones adapt the same layouts to touch screens.','The layout screenshots were first captured for 1.8.0 and are kept at their original resolution. Click a preview to open it full size. In Clean UI, the TV rail expands when you return to navigation and collapses when you focus a movie. Phones adapt the same layouts to touch screens.','README screenshot note')
s=rep(s,'| Platform | v1.8.1 download | Getting started |','| Platform | v1.9 download | Getting started |','README download table head')
s=rep(s,'`ZeroPlay-1.8.1-Android.apk`','`ZeroPlay-1.9-Android.apk`','README android asset')
s=rep(s,'`ZeroPlay-1.8.1-Android-TV.apk`','`ZeroPlay-1.9-Android-TV.apk`','README tv asset')
s=rep(s,'`ZeroPlay-1.8.1-Windows-x64.zip`','`ZeroPlay-1.9-Windows-x64.zip`','README windows asset')
s=rep(s,'Embedded players: **VidStuck and VidSrc.sh**. QR decoding: **ZXing** (Apache 2.0). Android media playback: **AndroidX Media3**.','Embedded players: **VidStuck and VidSrc.sh**. QR decoding: **ZXing** (Apache 2.0). Android media playback: **AndroidX Media3**. Windows offline playback: **Video.js**. Windows torrent engine: **WebTorrent**.','README credits')
s=s.replace('Search, review up to ten healthy matching results, confirm your choice, and download inside ZeroPlay.','Search, review up to twenty healthy matching results, confirm your choice, and download inside ZeroPlay.')
insert='''\n## 🆕 Version 1.9\n\n🖥️ **Windows torrent fix:** upgraded the integrated Windows downloader to WebTorrent 3.0.21 with stronger DHT/tracker/PEX/LSD/uTP discovery, fallback trackers and a metadata watchdog so dead jobs no longer sit forever at `metadata · 0 peers`.\n\n🎬 **Better downloaded-movie player:** Windows downloaded videos now use a dedicated Video.js offline player with a modern seek bar, playback speed, fullscreen, Picture-in-Picture where supported, Fit / Fill, and automatic/manual SRT/VTT/ASS/SSA subtitles. **Live TV, Live PPV, Live Sports, RawCast and normal streaming players were deliberately left unchanged.**\n\n📥 **Downloads look like media, not jobs:** active transfers now show poster, synopsis, torrent quality/codec/health, seeders, peers, speed, ETA and progress in polished cards on Windows, Android and Android TV.\n\n🎨 **UI polish everywhere:** Clean UI gets a larger Windows carousel and normalized search/branding; Android/TV Clean UI gets a tighter collapsed rail; Modern UI gets a larger ZeroPlay logo. Movie thumbnails now carry their titles and ratings, and previews gain subtle color flare plus gold star accents.\n\n🌈 **17 themes:** the original five remain compatible, plus 12 new palettes — Midnight Blue, Ember Glow, Forest Moss, Rose Noir, Amethyst, Cyber Mint, Cobalt Sky, Golden Hour, Coral Night, Aurora, Slate Ice and Mocha.\n\n✨ **Golden ZeroPlay easter egg:** the old rainbow mode is replaced with a premium gold/champagne mode with golden shimmer, focus accents and sparkle particles on Windows, Android and Android TV.\n\nSee the [complete 1.9 release notes](docs/release-1.9.md).\n\n'''
marker='### 🛡️ Known QR ad bug\n'
if marker not in s: raise RuntimeError('README 1.9 insertion marker missing')
s=s.replace(marker,insert+marker,1)
save(p,s)
print('Prepared README and publish script for ZeroPlay 1.9')
