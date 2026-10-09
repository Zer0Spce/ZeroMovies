'use strict';
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8').replace(/\r\n/g,'\n');
const write=(rel,value)=>fs.writeFileSync(path.join(root,rel),value);
function replace(text,from,to,label){if(text.includes(to))return text;if(!text.includes(from))throw Error('Missing Android progress marker: '+label);return text.replace(from,to);}

let activity=read('app/src/main/java/com/zerostreams/app/BrowserPlayerActivity.java');
activity=replace(activity,
`    private long lastProgressSaved;\n    private long lastPlayerGesture;`,
`    private long lastProgressSaved;\n    private boolean playbackCompleted;\n    private long lastPlayerGesture;`,
'completion lock field');
activity=replace(activity,
`            try{\n                org.json.JSONObject event=new org.json.JSONObject(data);\n                double timestamp=event.optDouble("timestamp",-1),duration=event.optDouble("duration",-1);\n                boolean terminal=event.optBoolean("ended",false)||(duration>0&&timestamp>=0&&timestamp/duration>=.95d);\n                long now=android.os.SystemClock.elapsedRealtime();\n                if(!terminal&&now-lastProgressSaved<2500)return;\n                if(terminal&&duration>0)event.put("timestamp",duration);\n                history.progress(parent,type,event);\n                lastProgressSaved=now;\n            }catch(org.json.JSONException ignored){}`,
`            try{\n                if(playbackCompleted)return;\n                org.json.JSONObject event=new org.json.JSONObject(data);\n                double timestamp=event.optDouble("timestamp",-1),duration=event.optDouble("duration",-1);\n                boolean terminal=event.optBoolean("ended",false)||(duration>0&&timestamp>=0&&timestamp/duration>=.95d);\n                long now=android.os.SystemClock.elapsedRealtime();\n                if(!terminal&&now-lastProgressSaved<2500)return;\n                if(terminal&&duration>0)event.put("timestamp",duration).put("ended",true);\n                history.progress(parent,type,event);\n                if(terminal)playbackCompleted=true;\n                lastProgressSaved=now;\n            }catch(org.json.JSONException ignored){}`,
'lock completion against auto-next overwrite');
write('app/src/main/java/com/zerostreams/app/BrowserPlayerActivity.java',activity);

let history=read('app/src/main/java/com/zerostreams/app/HistoryStore.java');
history=replace(history,
`        long position=(long)(timestamp*1000),total=(long)(duration*1000);\n        int percent=ProgressRules.percent(timestamp,duration);\n        SharedPreferences.Editor edit=prefs.edit().putLong("position:"+key,position).putLong("duration:"+key,total)`,
`        long position=(long)(timestamp*1000),total=(long)(duration*1000);\n        int percent=ProgressRules.percent(timestamp,duration);\n        long priorPosition=prefs.getLong("position:"+key,0),priorDuration=prefs.getLong("duration:"+key,0);\n        if(priorDuration>0&&ProgressRules.percent(priorPosition,priorDuration)>=95&&percent<95)return;\n        if(percent>=95){position=total;timestamp=duration;percent=100;}\n        SharedPreferences.Editor edit=prefs.edit().putLong("position:"+key,position).putLong("duration:"+key,total)`,
'persist terminal progress as 100 and prevent downgrade');
write('app/src/main/java/com/zerostreams/app/HistoryStore.java',history);

let main=read('app/src/main/java/com/zerostreams/app/MainActivity.java');
main=replace(main,
`    String episodeReminder(Catalog.Item item,int season,int episode){String key=item.id+":s"+season+"e"+episode;long position=prefs.getLong("position:"+key,0),duration=prefs.getLong("duration:"+key,0);if(position<=0)return "";if(duration>0){int percent=ProgressRules.percent(position,duration);if(percent>=95)return " · ✓ Watched";return " · Continue "+Math.max(1,percent)+"%";}return " · In progress";}`,
`    String episodeReminder(Catalog.Item item,int season,int episode){String key=item.id+":s"+season+"e"+episode;long position=prefs.getLong("position:"+key,0),duration=prefs.getLong("duration:"+key,0);if(position<=0)return "";if(duration>0){int percent=ProgressRules.percent(position,duration);if(percent>=95)return "✓ Watched · ";return "Continue "+Math.max(1,percent)+"% · ";}return "In progress · ";}`,
'put episode state before title');
main=main.replaceAll('labels\\[i\\]="Episode "\\+numbers\\[i\\]\\+" · "\\+ep\\.optString\\("title","Episode "\\+numbers\\[i\\]\\)\\+episodeReminder\\(item,season,numbers\\[i\\]\\);','labels[i]=episodeReminder(item,season,numbers[i])+"Episode "+numbers[i]+" · "+ep.optString("title","Episode "+numbers[i]);');
main=main.replaceAll('labels\\[i\\]="Episode "\\+ep\\.optInt\\("episode"\\)\\+" · "\\+ep\\.optString\\("title"\\)\\+episodeReminder\\(item,number,ep\\.optInt\\("episode"\\)\\);','labels[i]=episodeReminder(item,number,ep.optInt("episode"))+"Episode "+ep.optInt("episode")+" · "+ep.optString("title");');
main=main.replaceAll('titles\\[i\\]="Episode "\\+selected\\.get\\(i\\)\\.optInt\\("episode",i\\+1\\)\\+" · "\\+selected\\.get\\(i\\)\\.optString\\("title","Episode"\\)\\+episodeReminder\\(item,seasons\\[index\\],selected\\.get\\(i\\)\\.optInt\\("episode",i\\+1\\)\\);','titles[i]=episodeReminder(item,seasons[index],selected.get(i).optInt("episode",i+1))+"Episode "+selected.get(i).optInt("episode",i+1)+" · "+selected.get(i).optString("title","Episode");');
main=replace(main,
`int progress=prefs.getInt("percent:"+item.id,-1);if(progress>=0){`,
`int progress=item.type.equals("series")?-1:prefs.getInt("percent:"+item.id,-1);if(progress>=0){`,
'hide generic series poster percentage');
write('app/src/main/java/com/zerostreams/app/MainActivity.java',main);

let guard=read('app/src/main/assets/player-guard.js');
if(guard.includes('const progressMeta = window.__zeroProgressMeta;')&&!guard.includes('let directProgressCompleted = false;')){
  guard=guard.replace('    const progressMeta = window.__zeroProgressMeta;\n    let lastDirectProgress = 0;', '    const progressMeta = window.__zeroProgressMeta;\n    let lastDirectProgress = 0;\n    let directProgressCompleted = false;');
  guard=guard.replace('    const emitVideoProgress = (video, ended = false) => {\n      const duration = Number(video.duration);', '    const emitVideoProgress = (video, ended = false) => {\n      if (directProgressCompleted) return;\n      const duration = Number(video.duration);');
  guard=guard.replace('      forwardProgress({...progressMeta,timestamp:Math.min(current,duration),duration,ended:finished});\n      lastDirectProgress = now;', '      forwardProgress({...progressMeta,timestamp:Math.min(current,duration),duration,ended:finished});\n      if (finished) directProgressCompleted = true;\n      lastDirectProgress = now;');
  guard=guard.replace("    const scanProgressVideos = () => { try { document.querySelectorAll('video').forEach(bindVideo); } catch (_) {} };\n    scanProgressVideos();", "    const scanProgressVideos = () => { try { all('video',true).forEach(bindVideo); } catch (_) {} };\n    const probeProgressVideos = () => { if (directProgressCompleted) return; try { all('video',true).forEach(video => emitVideoProgress(video,false)); } catch (_) {} };\n    scanProgressVideos();\n    setInterval(() => { scanProgressVideos(); probeProgressVideos(); }, 2000);");
  guard=guard.replace("    window.addEventListener('message', event => {\n      const packet = event.data;", "    window.addEventListener('message', event => {\n      if (directProgressCompleted) return;\n      const packet = event.data;");
}
write('app/src/main/assets/player-guard.js',guard);
console.log('Applied Android Windows-parity episode completion and visible episode status UI.');