const fs=require('node:fs'),path=require('node:path');
fs.mkdirSync('ui/vendor',{recursive:true});
const root=path.dirname(require.resolve('shaka-player/package.json'));
fs.copyFileSync(path.join(root,'dist/shaka-player.compiled.js'),'ui/vendor/shaka-player.compiled.js');
fs.copyFileSync(path.join(root,'LICENSE'),'ui/vendor/SHAKA-LICENSE');
