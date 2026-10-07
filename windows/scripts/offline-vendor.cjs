const fs=require('node:fs'),path=require('node:path');
fs.mkdirSync('ui/vendor',{recursive:true});
const root=path.dirname(require.resolve('video.js/package.json'));
fs.copyFileSync(path.join(root,'dist/video.min.js'),'ui/vendor/video.min.js');
fs.copyFileSync(path.join(root,'dist/video-js.min.css'),'ui/vendor/video-js.min.css');
fs.copyFileSync(path.join(root,'LICENSE'),'ui/vendor/VIDEOJS-LICENSE');
