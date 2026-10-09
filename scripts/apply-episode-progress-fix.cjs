'use strict';
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8').replace(/\r\n/g,'\n');
const write=(rel,value)=>fs.writeFileSync(path.join(root,rel),value);
function replace(text,from,to,label){if(text.includes(to))return text;if(!text.includes(from))throw Error('Missing episode-progress marker: '+label);return text.replace(from,to);}

// Android: create a real per-episode started marker even when an embed provider
// does not expose exact playback duration yet. Provider/native progress upgrades it.
let history=read('app/src/main/java/com/zerostreams/app/HistoryStore.java');
history=replace(history,
'                SharedPreferences.Editor edit=prefs.edit().putInt("resumeSeason:"+item.id,season).putInt("resumeEpisode:"+item.id,number).putLong("position:"+item.id,Math.max(1,position)).putLong("duration:"+item.id,duration);',
'                SharedPreferences.Editor edit=prefs.edit().putInt("resumeSeason:"+item.id,season).putInt("resumeEpisode:"+item.id,number).putLong("position:"+key,Math.max(1,position)).putLong("duration:"+key,duration).putLong("position:"+item.id,Math.max(1,position)).putLong("duration:"+item.id,duration);',
'Android started episode marker');
write('app/src/main/java/com/zerostreams/app/HistoryStore.java',history);

// Android native player: persist exact position + duration every few seconds and
// on exit/end. Completion is retained instead of deleting the episode state.
let player=read('app/src/main/java/com/zerostreams/app/PlayerActivity.java');
player=replace(player,
'    private SharedPreferences prefs;\n    private JSONObject source;',
'    private SharedPreferences prefs;\n    private HistoryStore history;\n    private final android.os.Handler progressUi=new android.os.Handler(android.os.Looper.getMainLooper());\n    private JSONObject source;',
'Android player history fields');
player=replace(player,
'        prefs=getSharedPreferences("zero",MODE_PRIVATE);key=getIntent().getStringExtra("key");parent=getIntent().getStringExtra("parent");live=getIntent().getBooleanExtra("live",false);',
'        prefs=getSharedPreferences("zero",MODE_PRIVATE);history=new HistoryStore(prefs);key=getIntent().getStringExtra("key");parent=getIntent().getStringExtra("parent");live=getIntent().getBooleanExtra("live",false);',
'Android player history init');
player=replace(player,
'            @Override public void onPlaybackStateChanged(int state){if(state==Player.STATE_ENDED&&!live)prefs.edit().remove("position:"+key).remove("position:"+parent).apply();}',
'            @Override public void onPlaybackStateChanged(int state){if(state==Player.STATE_ENDED&&!live)saveHistoryProgress(true);}',
'Android completion persistence');
player=replace(player,
'        media.setSubtitleConfigurations(tracks);player.setMediaItem(download==null?media.build():download.request.toMediaItem());if(!live)player.seekTo(position);player.prepare();player.setPlayWhenReady(playWhenReady);view.requestFocus();view.showController();if(BuildConfig.TV)tvUi.postDelayed(this::focusFirstTvControl,120);',
'        media.setSubtitleConfigurations(tracks);player.setMediaItem(download==null?media.build():download.request.toMediaItem());if(!live)player.seekTo(position);player.prepare();player.setPlayWhenReady(playWhenReady);progressUi.removeCallbacks(progressTick);progressUi.postDelayed(progressTick,2500);view.requestFocus();view.showController();if(BuildConfig.TV)tvUi.postDelayed(this::focusFirstTvControl,120);',
'Android progress timer start');
player=replace(player,
'    private void stopPlayer() {\n        if(player==null)return;position=player.getCurrentPosition();playWhenReady=player.getPlayWhenReady();\n        if(!live){SharedPreferences.Editor edit=prefs.edit();if(player.getPlaybackState()==Player.STATE_ENDED)edit.remove("position:"+key).remove("position:"+parent);else{edit.putLong("position:"+key,position);edit.putLong("position:"+parent,position);}edit.apply();}\n        view.setPlayer(null);player.release();player=null;\n    }',
'    private final Runnable progressTick=new Runnable(){@Override public void run(){if(player==null||live)return;saveHistoryProgress(false);progressUi.postDelayed(this,2500);}};\n    private void saveHistoryProgress(boolean completed){if(player==null||live||history==null||parent==null)return;long duration=player.getDuration();if(duration<=0||duration==androidx.media3.common.C.TIME_UNSET)return;long current=completed?duration:Math.max(0,player.getCurrentPosition());if(current<=0&&!completed)return;try{String type=parent.startsWith("tmdb-series-")?"tv":"movie";String id=parent.substring(parent.lastIndexOf(\'-\')+1);JSONObject data=new JSONObject().put("id",id).put("type",type).put("timestamp",current/1000d).put("duration",duration/1000d);if(type.equals("tv")){data.put("season",source.optInt("season",getIntent().getIntExtra("season",0))).put("episode",source.optInt("episode",getIntent().getIntExtra("episode",1)));}history.progress(parent,type,data);}catch(Exception ignored){}}\n    private void stopPlayer() {\n        if(player==null)return;progressUi.removeCallbacks(progressTick);boolean completed=player.getPlaybackState()==Player.STATE_ENDED;saveHistoryProgress(completed);position=completed&&player.getDuration()>0?player.getDuration():player.getCurrentPosition();playWhenReady=player.getPlayWhenReady();\n        if(!live){long duration=player.getDuration();SharedPreferences.Editor edit=prefs.edit().putLong("position:"+key,Math.max(1,position)).putLong("position:"+parent,Math.max(1,position));if(duration>0&&duration!=androidx.media3.common.C.TIME_UNSET)edit.putLong("duration:"+key,duration).putLong("duration:"+parent,duration);edit.apply();}\n        view.setPlayer(null);player.release();player=null;\n    }',
'Android native progress persistence');
player=replace(player,
'    @Override protected void onDestroy(){tvUi.removeCallbacksAndMessages(null);super.onDestroy();}',
'    @Override protected void onDestroy(){progressUi.removeCallbacksAndMessages(null);tvUi.removeCallbacksAndMessages(null);super.onDestroy();}',
'Android progress cleanup');
write('app/src/main/java/com/zerostreams/app/PlayerActivity.java',player);

// Windows renderer: a selected episode is at least "In progress" immediately,
// then exact progress upgrades it to Continue xx% / Watched. Refresh an open
// detail sheet when the player closes so the marker changes without reopening.
let app=read('windows/ui/app.js');
app=replace(app,
"function episodeReminder(item,season,episode){const progress=state.positions[key(item)+':'+season+':'+episode];if(!progress||Number(progress.timestamp)<=0)return '';const percent=Number(progress.percent)||0;return percent>=95?' · ✓ Watched':percent>0?' · Continue '+Math.max(1,Math.round(percent))+'%':' · In progress';}",
"function episodeReminder(item,season,episode){const progress=state.positions[key(item)+':'+season+':'+episode];if(!progress)return '';const percent=Number(progress.percent)||0;return percent>=95?' · ✓ Watched':percent>0?' · Continue '+Math.max(1,Math.round(percent))+'%':' · In progress';}",
'Windows started episode reminder');
app=replace(app,
"window.zero.onRefresh(async()=>{state=await window.zero.state();applyTheme();if(category==='Library')renderLibrary();else if(category==='Home')await renderHome();else observePaging();});",
"window.zero.onRefresh(async()=>{state=await window.zero.state();applyTheme();if($('#detail').open&&activeDetail)await details(activeDetail);else if(category==='Library')renderLibrary();else if(category==='Home')await renderHome();else observePaging();});",
'Windows live episode marker refresh');
write('windows/ui/app.js',app);

console.log('Applied real per-episode progress persistence and reminders.');
