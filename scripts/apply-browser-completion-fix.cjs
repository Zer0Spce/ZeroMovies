'use strict';
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8').replace(/\r\n/g,'\n');
const write=(rel,value)=>fs.writeFileSync(path.join(root,rel),value);
function replace(text,from,to,label){if(text.includes(to))return text;if(!text.includes(from))throw Error('Missing browser completion marker: '+label);return text.replace(from,to);}

let activity=read('app/src/main/java/com/zerostreams/app/BrowserPlayerActivity.java');
activity=replace(activity,
`            long now=android.os.SystemClock.elapsedRealtime();
            if(now-lastProgressSaved<2500)return;
            try{
                org.json.JSONObject event=new org.json.JSONObject(data);
                history.progress(parent,type,event);
                lastProgressSaved=now;
            }catch(org.json.JSONException ignored){}`,
`            try{
                org.json.JSONObject event=new org.json.JSONObject(data);
                double timestamp=event.optDouble("timestamp",-1),duration=event.optDouble("duration",-1);
                boolean terminal=event.optBoolean("ended",false)||(duration>0&&timestamp>=0&&timestamp/duration>=.95d);
                long now=android.os.SystemClock.elapsedRealtime();
                if(!terminal&&now-lastProgressSaved<2500)return;
                if(terminal&&duration>0)event.put("timestamp",duration);
                history.progress(parent,type,event);
                lastProgressSaved=now;
            }catch(org.json.JSONException ignored){}`,
'never throttle terminal progress');
activity=replace(activity,
`            playerGuard="window.__zeroTv="+tvPlayer+";window.__zeroBlockAds="+blockAds+";window.__zeroGain="+getSharedPreferences("zero",MODE_PRIVATE).getFloat("audioBoost",1f)+";"+guardOutput.toString("UTF-8")+(tvPlayer?tvOutput.toString("UTF-8"):"");`,
`            String progressMeta="null",parent=getIntent().getStringExtra("parent"),episodeKey=getIntent().getStringExtra("key");
            if(parent!=null&&parent.matches("tmdb-(movie|series)-[0-9]+"))try{
                org.json.JSONObject meta=new org.json.JSONObject().put("id",parent.substring(parent.lastIndexOf('-')+1)).put("type",parent.startsWith("tmdb-series-")?"tv":"movie");
                if(parent.startsWith("tmdb-series-")&&episodeKey!=null){java.util.regex.Matcher m=java.util.regex.Pattern.compile(":s([0-9]+)e([0-9]+)$").matcher(episodeKey);if(m.find())meta.put("season",Integer.parseInt(m.group(1))).put("episode",Integer.parseInt(m.group(2)));}
                progressMeta=meta.toString();
            }catch(Exception ignored){}
            playerGuard="window.__zeroProgressMeta="+progressMeta+";window.__zeroTv="+tvPlayer+";window.__zeroBlockAds="+blockAds+";window.__zeroGain="+getSharedPreferences("zero",MODE_PRIVATE).getFloat("audioBoost",1f)+";"+guardOutput.toString("UTF-8")+(tvPlayer?tvOutput.toString("UTF-8"):"");`,
'embed episode metadata in player guard');
write('app/src/main/java/com/zerostreams/app/BrowserPlayerActivity.java',activity);

let guard=read('app/src/main/assets/player-guard.js');
const marker=`  window.__zeroDismissQrAd = () => {`;
const injected=`  // Track the actual HTML5 media element too. Some embed providers do not\n  // forward their final PLAYER_EVENT, so the old code could stay on In progress forever.\n  if (window.__zeroProgressMeta) {\n    const progressMeta = window.__zeroProgressMeta;\n    let lastDirectProgress = 0;\n    const validMeta = data => data && String(data.id) === String(progressMeta.id) && data.type === progressMeta.type &&\n      (data.type !== 'tv' || (Number(data.season) === Number(progressMeta.season) && Number(data.episode) === Number(progressMeta.episode)));\n    const forwardProgress = data => {\n      if (!validMeta(data)) return;\n      try {\n        if (window.ZeroProgress) window.ZeroProgress.postMessage(JSON.stringify(data));\n        else if (window.parent !== window) window.parent.postMessage({type:'zerostreams-direct-progress',data}, '*');\n      } catch (_) {}\n    };\n    const emitVideoProgress = (video, ended = false) => {\n      const duration = Number(video.duration);\n      if (!Number.isFinite(duration) || duration < 60) return;\n      let current = Number(video.currentTime);\n      if (!Number.isFinite(current) || current < 0) return;\n      const finished = ended || video.ended || current >= duration * .95;\n      const now = Date.now();\n      if (!finished && now - lastDirectProgress < 5000) return;\n      if (finished) current = duration;\n      forwardProgress({...progressMeta,timestamp:Math.min(current,duration),duration,ended:finished});\n      lastDirectProgress = now;\n    };\n    const bindVideo = video => {\n      if (video.dataset.zeroProgressBound === '1') return;\n      video.dataset.zeroProgressBound = '1';\n      video.addEventListener('timeupdate', () => emitVideoProgress(video,false), true);\n      video.addEventListener('ended', () => emitVideoProgress(video,true), true);\n      video.addEventListener('pause', () => {\n        const duration=Number(video.duration),current=Number(video.currentTime);\n        if (Number.isFinite(duration) && duration >= 60 && Number.isFinite(current) && current >= duration * .95) emitVideoProgress(video,true);\n      }, true);\n    };\n    const scanProgressVideos = () => { try { document.querySelectorAll('video').forEach(bindVideo); } catch (_) {} };\n    scanProgressVideos();\n    try { new MutationObserver(scanProgressVideos).observe(document.documentElement || document, {childList:true,subtree:true}); } catch (_) {}\n    window.addEventListener('message', event => {\n      const packet = event.data;\n      if (!packet || packet.type !== 'zerostreams-direct-progress' || !validMeta(packet.data)) return;\n      forwardProgress(packet.data);\n    });\n  }\n\n  window.__zeroDismissQrAd = () => {`;
if(!guard.includes('zerostreams-direct-progress')){
  if(!guard.includes(marker))throw Error('Missing player guard insertion marker');
  guard=guard.replace(marker,injected);
}
write('app/src/main/assets/player-guard.js',guard);
console.log('Applied embedded-player completion tracking fix.');
require('./apply-android-episode-parity-fix.cjs');
