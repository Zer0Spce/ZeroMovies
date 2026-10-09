'use strict';
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const mainPath=path.join(root,'main.cjs');
let main=fs.readFileSync(mainPath,'utf8').replace(/\r\n/g,'\n');
function replace(from,to,label){
  if(main.includes(to))return;
  if(!main.includes(from))throw Error('Missing Windows completion marker: '+label);
  main=main.replace(from,to);
}

if(!main.includes('playerProgressTimer')){
  const declaration='let main,player,toolbar,playerHost,current,scanTimer,cursorTimer,qrWorker,scanning=false,state,file,guard,lastProgress=0,offlineSelection,mpvOffline;';
  if(!main.includes(declaration))throw Error('Missing Windows completion marker: progress timer declaration');
  main=main.replace(declaration,'let main,player,toolbar,playerHost,current,scanTimer,cursorTimer,playerProgressTimer,qrWorker,scanning=false,state,file,guard,lastProgress=0,offlineSelection,mpvOffline;');
}

if(!main.includes('clearInterval(playerProgressTimer)')){
  const cleanup='clearInterval(scanTimer);clearInterval(cursorTimer);';
  if(!main.includes(cleanup))throw Error('Missing Windows completion marker: progress timer cleanup');
  main=main.replace(cleanup,cleanup+'clearInterval(playerProgressTimer);playerProgressTimer=null;');
}

if(!main.includes('__zeroEpisodeProbe')){
  const marker='  scanTimer=setInterval(scanAd,3500);';
  if(!main.includes(marker))throw Error('Missing Windows completion marker: movie scan timer');
  const probe=`${marker}\n  const trackedEpisode=core.episode(position);\n  let playbackCompleted=false;\n  const pollPlaybackProgress=async()=>{\n    if(playbackCompleted||player!==view||!current||contents.isDestroyed())return;\n    let best=null;\n    const probe=\`(()=>{\n      try{\n        if(!window.__zeroEpisodeProbe){\n          window.__zeroEpisodeProbe={ended:null};\n          window.__zeroBindEpisodeVideo=(video)=>{\n            if(video.__zeroEpisodeBound)return;video.__zeroEpisodeBound=true;\n            video.addEventListener('ended',()=>{const d=Number(video.duration);if(Number.isFinite(d)&&d>=120)window.__zeroEpisodeProbe.ended={timestamp:d,duration:d,ended:true,at:Date.now()};},true);\n          };\n        }\n        const videos=Array.from(document.querySelectorAll('video'));\n        videos.forEach(window.__zeroBindEpisodeVideo);\n        const ended=window.__zeroEpisodeProbe.ended;\n        if(ended&&Date.now()-ended.at<15000)return ended;\n        let chosen=null;\n        for(const video of videos){\n          const d=Number(video.duration),t=Number(video.currentTime);\n          if(!Number.isFinite(d)||!Number.isFinite(t)||d<120||t<0)continue;\n          const r=video.getBoundingClientRect();\n          const row={timestamp:Math.min(t,d),duration:d,ended:video.ended||t>=d-2,area:Math.max(0,r.width*r.height)};\n          if(!chosen||row.area>chosen.area||row.duration>chosen.duration)chosen=row;\n        }\n        return chosen;\n      }catch(_){return null;}\n    })()\`;\n    for(const frame of contents.mainFrame.framesInSubtree){\n      try{const sample=await frame.executeJavaScript(probe);if(!sample)continue;\n        if(sample.ended){best=sample;break;}\n        if(!best||Number(sample.area)>Number(best.area)||Number(sample.duration)>Number(best.duration))best=sample;\n      }catch{}\n    }\n    if(!best)return;\n    const payload={id:String(value.id),type:value.type,timestamp:Number(best.timestamp),duration:Number(best.duration)};\n    if(value.type==='tv'){payload.season=trackedEpisode.season;payload.episode=trackedEpisode.episode;}\n    const watched=core.progress(payload,value);if(!watched)return;\n    if(best.ended||watched.percent>=95){watched.timestamp=watched.duration;watched.percent=100;playbackCompleted=true;}\n    core.record(state,value,watched);persist();\n    if(playbackCompleted){clearInterval(playerProgressTimer);playerProgressTimer=null;}\n  };\n  clearInterval(playerProgressTimer);\n  playerProgressTimer=setInterval(()=>{pollPlaybackProgress().catch(()=>{});},2000);`;
  main=main.replace(marker,probe);
}

replace(
"  ipcMain.on('progress',(event,data)=>{\n    if(event.sender!==player?.webContents||!playerOrigin(event.senderFrame?.url)||!current||Date.now()-lastProgress<2500)return;\n    const position=core.progress(sources.normalize(data),current);if(!position)return;lastProgress=Date.now();core.record(state,current,position);persist();\n  });",
"  ipcMain.on('progress',(event,data)=>{\n    if(event.sender!==player?.webContents||!playerOrigin(event.senderFrame?.url)||!current)return;\n    const position=core.progress(sources.normalize(data),current);if(!position)return;\n    const completed=position.percent>=95;if(!completed&&Date.now()-lastProgress<2500)return;\n    if(completed){position.timestamp=position.duration;position.percent=100;}\n    lastProgress=Date.now();core.record(state,current,position);persist();\n  });",
'completion event bypasses throttle');

fs.writeFileSync(mainPath,main);
console.log('Applied Windows episode completion tracking fix.');
