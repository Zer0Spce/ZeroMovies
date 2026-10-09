'use strict';
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8').replace(/\r\n/g,'\n');
const write=(rel,value)=>fs.writeFileSync(path.join(root,rel),value);
function replace(text,from,to,label){if(text.includes(to))return text;if(!text.includes(from))throw Error('Missing Android episode parity marker: '+label);return text.replace(from,to);}

let history=read('app/src/main/java/com/zerostreams/app/HistoryStore.java');
history=replace(history,
`                SharedPreferences.Editor edit=prefs.edit().putInt("resumeSeason:"+item.id,season).putInt("resumeEpisode:"+item.id,number).putLong("position:"+item.id,Math.max(1,position)).putLong("duration:"+item.id,duration);\n                if(position>0&&duration>0)edit.putInt("percent:"+item.id,ProgressRules.percent(position,duration));else edit.remove("percent:"+item.id);edit.apply();`,
`                SharedPreferences.Editor edit=prefs.edit().putInt("resumeSeason:"+item.id,season).putInt("resumeEpisode:"+item.id,number).putLong("watchedAt:"+item.id,System.currentTimeMillis());\n                edit.remove("position:"+item.id).remove("duration:"+item.id).remove("percent:"+item.id).apply();`,
'series start must not write poster progress');

history=replace(history,
`        SharedPreferences.Editor edit=prefs.edit().putLong("position:"+key,position).putLong("duration:"+key,total)\n            .putLong("position:"+parent,position).putLong("duration:"+parent,total).putInt("percent:"+parent,percent).putLong("watchedAt:"+parent,System.currentTimeMillis());\n        if(type.equals("tv"))edit.putInt("resumeSeason:"+parent,season).putInt("resumeEpisode:"+parent,episode);`,
`        SharedPreferences.Editor edit=prefs.edit().putLong("position:"+key,position).putLong("duration:"+key,total).putLong("watchedAt:"+parent,System.currentTimeMillis());\n        if(type.equals("tv")){\n            edit.putInt("resumeSeason:"+parent,season).putInt("resumeEpisode:"+parent,episode)\n                .remove("position:"+parent).remove("duration:"+parent).remove("percent:"+parent);\n        }else{\n            edit.putLong("position:"+parent,position).putLong("duration:"+parent,total).putInt("percent:"+parent,percent);\n        }`,
'episode progress must stay episode-scoped');
write('app/src/main/java/com/zerostreams/app/HistoryStore.java',history);

let main=read('app/src/main/java/com/zerostreams/app/MainActivity.java');
main=replace(main,
`        if(source.optBoolean("embed")){if(prefs.getLong("position:"+item.id,0)<=0)prefs.edit().putLong("position:"+item.id,1).apply();String address=source.optString("url");`,
`        if(source.optBoolean("embed")){if(!item.type.equals("series")&&prefs.getLong("position:"+item.id,0)<=0)prefs.edit().putLong("position:"+item.id,1).apply();String address=source.optString("url");`,
'embedded series must not create poster progress');
write('app/src/main/java/com/zerostreams/app/MainActivity.java',main);

let player=read('app/src/main/java/com/zerostreams/app/BrowserPlayerActivity.java');
player=replace(player,
`    private long lastProgressSaved;`,
`    private long lastProgressSaved;\n    private boolean playbackCompleted;`,
'completion lock field');
player=replace(player,
`            try{\n                org.json.JSONObject event=new org.json.JSONObject(data);\n                double timestamp=event.optDouble("timestamp",-1),duration=event.optDouble("duration",-1);\n                boolean terminal=event.optBoolean("ended",false)||(duration>0&&timestamp>=0&&timestamp/duration>=.95d);\n                long now=android.os.SystemClock.elapsedRealtime();\n                if(!terminal&&now-lastProgressSaved<2500)return;\n                if(terminal&&duration>0)event.put("timestamp",duration);\n                history.progress(parent,type,event);\n                lastProgressSaved=now;\n            }catch(org.json.JSONException ignored){}`,
`            try{\n                if(playbackCompleted)return;\n                org.json.JSONObject event=new org.json.JSONObject(data);\n                String episodeKey=getIntent().getStringExtra("key");\n                if(type.equals("tv")&&episodeKey!=null){\n                    java.util.regex.Matcher selected=java.util.regex.Pattern.compile(":s([0-9]+)e([0-9]+)$").matcher(episodeKey);\n                    if(selected.find())event.put("season",Integer.parseInt(selected.group(1))).put("episode",Integer.parseInt(selected.group(2)));\n                }\n                double timestamp=event.optDouble("timestamp",-1),duration=event.optDouble("duration",-1);\n                boolean terminal=event.optBoolean("ended",false)||(duration>0&&timestamp>=0&&timestamp/duration>=.95d);\n                long now=android.os.SystemClock.elapsedRealtime();\n                if(!terminal&&now-lastProgressSaved<2500)return;\n                if(terminal&&duration>0)event.put("timestamp",duration).put("ended",true);\n                history.progress(parent,type,event);\n                lastProgressSaved=now;\n                if(terminal)playbackCompleted=true;\n            }catch(org.json.JSONException ignored){}`,
'authoritative selected episode and completion lock');
write('app/src/main/java/com/zerostreams/app/BrowserPlayerActivity.java',player);

console.log('Applied Android episode progress parity fix.');