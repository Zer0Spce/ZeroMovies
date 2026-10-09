'use strict';
const fs=require('node:fs');
const path=require('node:path');

const root=path.resolve(__dirname,'..');
const mainFile=path.join(root,'main.cjs');
const packageFile=path.join(root,'package.json');
let source=fs.readFileSync(mainFile,'utf8');

if(!source.includes("const {MpvOfflinePlayer}=require('./mpv-offline.cjs');")){
  const marker="const {OfflineHost}=require('./offline-host.cjs');";
  if(!source.includes(marker))throw Error('OfflineHost import marker not found.');
  source=source.replace(marker,marker+"\nconst {MpvOfflinePlayer}=require('./mpv-offline.cjs');");
}

const globals="let main,player,toolbar,playerHost,current,scanTimer,cursorTimer,qrWorker,scanning=false,state,file,guard,lastProgress=0,offlineSelection;";
if(source.includes(globals)){
  source=source.replace(globals,"let main,player,toolbar,playerHost,current,scanTimer,cursorTimer,qrWorker,scanning=false,state,file,guard,lastProgress=0,offlineSelection,mpvOffline;");
}else if(!source.includes('offlineSelection,mpvOffline')){
  throw Error('Global player state marker not found.');
}

if(!source.includes('if(mpvOffline){try{mpvOffline.close();}')){
  const closePattern=/function closePlayer\(\)\{\r?\n\s*if\(!player\)return;/;
  if(!closePattern.test(source))throw Error('closePlayer marker not found.');
  source=source.replace(closePattern,"function closePlayer(){\n  if(mpvOffline){try{mpvOffline.close();}catch{}mpvOffline=null;offlineSelection=null;}\n  if(!player){if(main&&!main.isDestroyed()){main.setTitle('ZeroPlay');main.webContents.focus();refresh();}return;}");
}

const start=source.indexOf('async function openOffline(job,filePath){');
const end=source.indexOf('function offlineTrusted(event)',start);
if(start<0||end<0)throw Error('openOffline block markers not found.');
const replacement=`async function openOffline(job,filePath){
 const resolved=path.resolve(filePath);if(!fs.existsSync(resolved))throw Error('Downloaded video is missing.');closePlayer();
 const title=job?.item?.title||job?.title||path.basename(resolved),root=job?.dir&&fs.existsSync(job.dir)?job.dir:path.dirname(resolved);
 offlineSelection={title,file:resolved,subtitles:offlineMedia.findTracks(resolved,root)};
 mpvOffline=new MpvOfflinePlayer(app,main);
 try{mpvOffline.open({file:resolved,title,subtitleRoot:root});main.setTitle(title+' — ZeroPlay Offline');}
 catch(error){mpvOffline=null;offlineSelection=null;main.setTitle('ZeroPlay');throw error;}
}
`;
source=source.slice(0,start)+replacement+source.slice(end);

if(!source.includes("MpvOfflinePlayer(app,main)"))throw Error('mpv offline implementation was not applied.');
fs.writeFileSync(mainFile,source);

const pkg=JSON.parse(fs.readFileSync(packageFile,'utf8'));
pkg.build=pkg.build||{};
pkg.build.win=pkg.build.win||{};
pkg.build.win.artifactName='ZeroPlay-2.1-Windows-Offline-mpv-Test.${ext}';
pkg.build.extraResources=[...(pkg.build.extraResources||[]).filter(row=>row?.to!=='mpv'),{from:'vendor/mpv',to:'mpv',filter:['**/*']}];
fs.writeFileSync(packageFile,JSON.stringify(pkg,null,2)+'\n');

console.log('Applied isolated mpv-backed Windows offline-player test patch.');
