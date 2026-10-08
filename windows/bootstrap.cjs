const {app}=require('electron');

// Some Windows GPU/driver combinations promote decoded video into a
// DirectComposition overlay plane. When that happens the video surface can sit
// above Chromium's HTML controls for particular files/codecs even though the
// controls have a higher CSS z-index. Keep offline/movie UI in the normal
// compositor so ZeroPlay controls remain visible and clickable consistently.
if(process.platform==='win32')app.commandLine.appendSwitch('disable-direct-composition-video-overlays');

require('./main.cjs');
