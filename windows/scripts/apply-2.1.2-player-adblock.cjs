'use strict';
const fs=require('node:fs');
const path=require('node:path');
const file=path.resolve(__dirname,'..','main.cjs');
let source=fs.readFileSync(file,'utf8');
const marker=`  const view=player,contents=view.webContents;\n  playerHost=new PlayerHost(main,view,toolbar);installPlayerScripts(contents);`;
const replacement=`  const view=player,contents=view.webContents;\n  // Apply ZeroPlay's host rules at the network layer for embedded movie/show players.\n  // This blocks known ad/tracker frames (including Histats) before their UI can render.\n  contents.session.webRequest.onBeforeRequest((details,callback)=>{\n    let cancel=false;\n    try{cancel=core.blocked(new URL(details.url).hostname);}catch{}\n    callback({cancel});\n  });\n  playerHost=new PlayerHost(main,view,toolbar);installPlayerScripts(contents);`;
if(!source.includes('blocks known ad/tracker frames (including Histats)')){
  if(!source.includes(marker))throw new Error('Missing embedded player network-filter marker.');
  source=source.replace(marker,replacement);
}
fs.writeFileSync(file,source);
console.log('Applied 2.1.2 embedded-player network adblock.');
