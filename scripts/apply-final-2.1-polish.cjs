'use strict';
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
function file(rel){return path.join(root,rel);}
function replaceRequired(text,from,to,label){if(!text.includes(from))throw Error('Missing patch marker: '+label);return text.replace(from,to);}

// Android / Android TV
const mainPath=file('app/src/main/java/com/zerostreams/app/MainActivity.java');
let main=fs.readFileSync(mainPath,'utf8');
main=replaceRequired(main,
'private LinearLayout activeProviderCards;\n    private String submittedQuery="", channelGroup="All";',
'private LinearLayout activeProviderCards;\n    private final Map<String,String> oneTimePlaybackSources=new HashMap<>();\n    private String submittedQuery="", channelGroup="All";',
'Android one-time source state');

main=replaceRequired(main,
'String selectedPlaybackSource(){String source=prefs.getString("playbackSource","vidstuck");return source.equals("rawcast")&&!prefs.getBoolean("rawcastPlayback",false)?"vidstuck":source;}\n    String sourceLabel(){int index=PlaybackSources.index(selectedPlaybackSource());return index==0?"VidStuck · Recommended":"Source: "+PlaybackSources.NAMES[index];}\n    void sourcePicker(Button button){String[] labels=prefs.getBoolean("rawcastPlayback",false)?PlaybackSources.NAMES.clone():java.util.Arrays.copyOf(PlaybackSources.NAMES,2);labels[0]="VidStuck · Recommended";new AlertDialog.Builder(this).setTitle("Playback source").setSingleChoiceItems(labels,PlaybackSources.index(selectedPlaybackSource()),(d,n)->{prefs.edit().putString("playbackSource",PlaybackSources.IDS[n]).apply();button.setText("compact-source".equals(button.getTag())?"Source ▾":sourceLabel());d.dismiss();}).setNegativeButton("Close",null).show();}',
`String selectedPlaybackSource(){String source=prefs.getString("playbackSource","vidstuck");return source.equals("rawcast")&&!prefs.getBoolean("rawcastPlayback",false)?"vidstuck":source;}\n    boolean allowedPlaybackSource(String source){return source!=null&&PlaybackSources.index(source)<PlaybackSources.IDS.length&&(!source.equals("rawcast")||prefs.getBoolean("rawcastPlayback",false));}\n    String playbackSourceFor(Catalog.Item item){String once=oneTimePlaybackSources.get(item.id);if(allowedPlaybackSource(once))return once;String saved=prefs.getString("playbackSourceFor:"+item.id,"");if(allowedPlaybackSource(saved))return saved;return "vidstuck";}\n    String sourceLabel(Catalog.Item item){int index=PlaybackSources.index(playbackSourceFor(item));return index==0?"VidStuck · Recommended":"Source: "+PlaybackSources.NAMES[index];}\n    void confirmTitleSource(Catalog.Item item,String source,Button button,boolean useAfter,Runnable after){int index=PlaybackSources.index(source);String name=index==0?"VidStuck":PlaybackSources.NAMES[index];new AlertDialog.Builder(this).setTitle("Use "+name+" for "+item.title+"?").setMessage("Keep this source as the preferred source for this title only? Other movies and series will continue using VidStuck.").setPositiveButton("✓ Keep for this title",(dialog,which)->{prefs.edit().putString("playbackSourceFor:"+item.id,source).apply();oneTimePlaybackSources.remove(item.id);if(button!=null)button.setText("compact-source".equals(button.getTag())?"Source · "+name:sourceLabel(item));if(after!=null)after.run();}).setNegativeButton("Just this time",(dialog,which)->{if(!useAfter)oneTimePlaybackSources.put(item.id,source);if(button!=null)button.setText("compact-source".equals(button.getTag())?"Source · "+name:sourceLabel(item));if(after!=null)after.run();}).setNeutralButton("Cancel",null).show();}\n    void sourcePicker(Catalog.Item item,Button button){String[] labels=prefs.getBoolean("rawcastPlayback",false)?PlaybackSources.NAMES.clone():java.util.Arrays.copyOf(PlaybackSources.NAMES,2);labels[0]="VidStuck · Recommended";new AlertDialog.Builder(this).setTitle("Playback source · "+item.title).setSingleChoiceItems(labels,PlaybackSources.index(playbackSourceFor(item)),(d,n)->{String source=PlaybackSources.IDS[n];d.dismiss();confirmTitleSource(item,source,button,false,null);}).setNegativeButton("Close",null).show();}`,
'Android per-title source helpers');

main=replaceRequired(main,'Button source=button(sourceLabel(),()->{});source.setTextSize(BuildConfig.TV?13:11);source.setContentDescription("Change playback source. VidStuck recommended");source.setOnClickListener(v->sourcePicker(source));','Button source=button(sourceLabel(item),()->{});source.setTextSize(BuildConfig.TV?13:11);source.setContentDescription("Change playback source for this title. VidStuck recommended");source.setOnClickListener(v->sourcePicker(item,source));','Android details source button');
main=replaceRequired(main,'heroSource.setOnClickListener(v->sourcePicker(heroSource));','heroSource.setOnClickListener(v->sourcePicker(picks.get(heroIndex),heroSource));','Android hero source button');

main=replaceRequired(main,
'if(item.id.startsWith("tmdb-")&&sources.length()==PlaybackSources.IDS.length){openStream(item,sources.optJSONObject(PlaybackSources.index(selectedPlaybackSource())),key);return;}',
'if(item.id.startsWith("tmdb-")&&sources.length()==PlaybackSources.IDS.length){String selected=playbackSourceFor(item);oneTimePlaybackSources.remove(item.id);openStream(item,sources.optJSONObject(PlaybackSources.index(selected)),key);return;}',
'Android TMDB source selection');
main=replaceRequired(main,
'new AlertDialog.Builder(this).setTitle("Choose playback source").setSingleChoiceItems(labels,PlaybackSources.index(selectedPlaybackSource()),(d,n)->{if(n<PlaybackSources.IDS.length)prefs.edit().putString("playbackSource",PlaybackSources.IDS[n]).apply();d.dismiss();openStream(item,sources.optJSONObject(n),key);}).setNegativeButton("Cancel",null).show();',
'new AlertDialog.Builder(this).setTitle("Choose playback source · "+item.title).setSingleChoiceItems(labels,PlaybackSources.index(playbackSourceFor(item)),(d,n)->{d.dismiss();if(n<PlaybackSources.IDS.length){final int chosen=n;confirmTitleSource(item,PlaybackSources.IDS[n],null,true,()->openStream(item,sources.optJSONObject(chosen),key));}else openStream(item,sources.optJSONObject(n),key);}).setNegativeButton("Cancel",null).show();',
'Android manual source choice');

// Episode status helper and canonical episode keys.
main=replaceRequired(main,
'void loadSeriesEpisodeSelector(Catalog.Item item,int season,Spinner episodePicker,int[] selectedEpisode){selectedEpisode[0]=0;',
'String episodeReminder(Catalog.Item item,int season,int episode){String key=item.id+":s"+season+"e"+episode;long position=prefs.getLong("position:"+key,0),duration=prefs.getLong("duration:"+key,0);if(position<=0)return "";if(duration>0){int percent=ProgressRules.percent(position,duration);if(percent>=95)return " · ✓ Watched";return " · Continue "+Math.max(1,percent)+"%";}return " · In progress";}\n    void loadSeriesEpisodeSelector(Catalog.Item item,int season,Spinner episodePicker,int[] selectedEpisode){selectedEpisode[0]=0;',
'Android episode reminder helper');
main=replaceRequired(main,
'labels[i]="Episode "+numbers[i]+" · "+ep.optString("title","Episode "+numbers[i]);',
'labels[i]="Episode "+numbers[i]+" · "+ep.optString("title","Episode "+numbers[i])+episodeReminder(item,season,numbers[i]);',
'Android detail episode labels');
main=replaceRequired(main,
'labels[i]="Episode "+ep.optInt("episode")+" · "+ep.optString("title");',
'labels[i]="Episode "+ep.optInt("episode")+" · "+ep.optString("title")+episodeReminder(item,number,ep.optInt("episode"));',
'Android season dialog labels');
main=replaceRequired(main,
'chooseStreams(item,ContentApi.movieSources(id,"tv",number,ep.optInt("episode")),item.id+":"+ep.optString("id"));',
'chooseStreams(item,ContentApi.movieSources(id,"tv",number,ep.optInt("episode")),item.id+":s"+number+"e"+ep.optInt("episode"));',
'Android canonical season episode key');
main=replaceRequired(main,
'titles[i]="Episode "+selected.get(i).optInt("episode",i+1)+" · "+selected.get(i).optString("title","Episode");',
'titles[i]="Episode "+selected.get(i).optInt("episode",i+1)+" · "+selected.get(i).optString("title","Episode")+episodeReminder(item,seasons[index],selected.get(i).optInt("episode",i+1));',
'Android alternate episode labels');
main=replaceRequired(main,
'chooseStreams(item,sources,item.id+":"+ep.optString("id"));',
'chooseStreams(item,sources,item.id+":s"+ep.optInt("season",1)+"e"+ep.optInt("episode",1));',
'Android alternate canonical episode key');

// Android TV D-pad default + Settings copy.
main=replaceRequired(main,'tvPlayerControl.setSelection(prefs.getBoolean("playerMouse",true)?0:1);','tvPlayerControl.setSelection(prefs.getBoolean("playerMouse",false)?0:1);','Android TV player control default');
main=replaceRequired(main,'panel.addView(text("Mouse remains the default. Press Menu during movie playback to switch modes instantly.",12,MUTED));','panel.addView(text("D-pad navigation is the default on Android TV. Press Menu during movie playback to switch to mouse mode when needed.",12,MUTED));','Android TV settings copy');

// Clear watched history control.
main=replaceRequired(main,
'space(panel,20);settingsHeading(panel,"ABOUT","ZeroPlay");',
'space(panel,20);settingsHeading(panel,"HISTORY","Watch progress");Button clearWatchHistory=button("Clear watched history",()->new AlertDialog.Builder(this).setTitle("Clear watched history?").setMessage("This clears watched and in-progress episode markers and Continue Watching. Your watchlist, downloads and settings are kept.").setPositiveButton("Clear history",(dialog,which)->{history.clear("watchHistory");message("Watched history cleared");if(!detailsOpen)render();}).setNegativeButton("Cancel",null).show());clearWatchHistory.setTextColor(Color.rgb(255,150,150));panel.addView(clearWatchHistory);panel.addView(text("Removes watched and unfinished progress markers from movies and episodes.",12,MUTED));space(panel,20);settingsHeading(panel,"ABOUT","ZeroPlay");',
'Android clear watched history setting');
fs.writeFileSync(mainPath,main);

// Windows: track episode positions individually.
const corePath=file('windows/core.cjs');
let core=fs.readFileSync(corePath,'utf8');
core=replaceRequired(core,
'state.history=[row,...state.history.filter(x=>x.historyKey!==historyKey)].slice(0,100);state.positions[id]={...row};return row;',
'state.history=[row,...state.history.filter(x=>x.historyKey!==historyKey)].slice(0,100);state.positions[id]={...row};state.positions[historyKey]={...row};return row;',
'Windows per-episode positions');
fs.writeFileSync(corePath,core);

// Windows preload: source override argument.
const preloadPath=file('windows/preload.cjs');
let preload=fs.readFileSync(preloadPath,'utf8');
preload=replaceRequired(preload,'play:(item,episode)=>ipcRenderer.invoke(\'play\',item,episode),','play:(item,episode,source)=>ipcRenderer.invoke(\'play\',item,episode,source),','Windows preload source override');
fs.writeFileSync(preloadPath,preload);

// Windows main process: validate a per-title source without mutating global defaults.
const winMainPath=file('windows/main.cjs');
let winMain=fs.readFileSync(winMainPath,'utf8');
winMain=replaceRequired(winMain,
'async function openPlayer(value,selected,fixture,prepare=false){\n  value=core.cleanItem(value);',
'async function openPlayer(value,selected,fixture,prepare=false,sourceOverride){\n  value=core.cleanItem(value);const requestedSource=["vidstuck","vidsrc-sh","rawcast"].includes(sourceOverride)?sourceOverride:"vidstuck";const playbackSource=requestedSource==="rawcast"&&state.settings.rawcastPlayback!==true?"vidstuck":requestedSource;',
'Windows openPlayer source override');
winMain=replaceRequired(winMain,'if(state.settings.source===\'rawcast\'&&state.settings.rawcastPlayback===true&&!fixture){','if(playbackSource===\'rawcast\'&&state.settings.rawcastPlayback===true&&!fixture){','Windows rawcast override');
winMain=replaceRequired(winMain,'await contents.loadURL(core.playerUrl(value,position,state.settings.source));','await contents.loadURL(core.playerUrl(value,position,playbackSource));','Windows provider URL override');
winMain=replaceRequired(winMain,"ipcMain.handle('play',async(event,value,ep)=>{trusted(event);await openPlayer(value,ep);return true;});","ipcMain.handle('play',async(event,value,ep,source)=>{trusted(event);await openPlayer(value,ep,null,false,source);return true;});",'Windows play IPC source override');
fs.writeFileSync(winMainPath,winMain);

// Windows renderer: per-title source choice, clean confirmation, episode reminders, clear history.
const appPath=file('windows/ui/app.js');
let app=fs.readFileSync(appPath,'utf8');
app=replaceRequired(app,
"let state,category='Home',libraryTab='Continue watching',page=1,request=0,detailRequest=0,heroIndex=0,heroTimer,heroPaused=false,providerType='movie',providerId,providerName,homeData={},activeDetail;",
"let state,category='Home',libraryTab='Continue watching',page=1,request=0,detailRequest=0,heroIndex=0,heroTimer,heroPaused=false,providerType='movie',providerId,providerName,homeData={},activeDetail,sourcePickerItem,pendingSource;const oneTimeSources=new Map();",
'Windows source picker state');
app=replaceRequired(app,
`function sourceLabel(){return sources.find(x=>x[0]===state.settings.source)?.[1]||'VidStuck';}\nfunction sourceButton(){return \`<button data-action="source">\${escape(sourceLabel())}\${state.settings.source==='vidstuck'?' · Recommended':''} ▾</button>\`;}\nfunction atmosphere(item){const img=$('#ui-atmosphere img');if(item?.backdrop&&img.getAttribute('src')!==item.backdrop)img.src=item.backdrop;}\nfunction openSources(){window.zeroExperience?.stop(); $('#source-options').innerHTML=sources.filter(([id])=>id!=='rawcast'||state.settings.rawcastPlayback===true).map(([id,name])=>\`<button class="source-option \${state.settings.source===id?'selected':''}" data-source="\${id}">\${name}\${id==='vidstuck'?'<small>Recommended</small>':id==='rawcast'?'<small>Requires your API key. Streaming uses your limited request quota; availability depends on your account.</small>':''}\${state.settings.source===id?'<span>✓</span>':''}</button>\`).join('');$('#source-picker').showModal();}`,
`function sourceOverrides(){try{return JSON.parse(localStorage.getItem('zero-title-sources')||'{}')||{};}catch{return {};}}\nfunction sourceFor(item){if(!item)return 'vidstuck';const once=oneTimeSources.get(key(item));if(sources.some(([id])=>id===once))return once;const saved=sourceOverrides()[key(item)];return sources.some(([id])=>id===saved)?saved:'vidstuck';}\nfunction sourceName(id){return sources.find(x=>x[0]===id)?.[1]||'VidStuck';}\nfunction sourceLabel(item){const id=sourceFor(item);return sourceName(id)+(id==='vidstuck'?' · Recommended':'');}\nfunction sourceButton(item){return \`<button data-action="source">\${escape(sourceLabel(item))} ▾</button>\`;}\nfunction atmosphere(item){const img=$('#ui-atmosphere img');if(item?.backdrop&&img.getAttribute('src')!==item.backdrop)img.src=item.backdrop;}\nfunction ensureSourceConfirm(){let dialog=$('#source-confirm');if(dialog)return dialog;dialog=document.createElement('dialog');dialog.id='source-confirm';dialog.innerHTML='<div class="settings-body"><span class="eyebrow">THIS TITLE ONLY</span><h2 id="source-confirm-title">Keep source?</h2><p id="source-confirm-copy"></p><div class="actions"><button class="primary" data-action="source-keep">✓ Keep for this title</button><button data-action="source-once">Just this time</button><button data-action="source-cancel">Cancel</button></div></div>';document.body.appendChild(dialog);return dialog;}\nfunction openSources(item){sourcePickerItem=item||activeDetail||heroPicks()[heroIndex];if(!sourcePickerItem)return;window.zeroExperience?.stop();const selected=sourceFor(sourcePickerItem);$('#source-options').innerHTML=sources.filter(([id])=>id!=='rawcast'||state.settings.rawcastPlayback===true).map(([id,name])=>\`<button class="source-option \${selected===id?'selected':''}" data-source="\${id}">\${name}\${id==='vidstuck'?'<small>Recommended · default for other titles</small>':id==='rawcast'?'<small>Requires your API key. Streaming uses your limited request quota.</small>':''}\${selected===id?'<span>✓</span>':''}</button>\`).join('');const note=$('#source-picker p');if(note)note.textContent='Choose a source for '+sourcePickerItem.title+'. Other movies and series stay on VidStuck.';$('#source-picker').showModal();}`,
'Windows per-title source UI');
app=replaceRequired(app,'${sourceButton()}</div></div>','${sourceButton(item)}</div></div>','Windows detail source button');
// The same template fragment occurs in hero and detail more than once; replace remaining bare sourceButton calls.
app=app.replaceAll('${sourceButton()}','${sourceButton(item)}');
app=replaceRequired(app,
"async function loadEpisodes(item,token,resume){try{const season=Number($('#season').value);$('#episode').innerHTML='<option>Loading…</option>';const data=await api('/tv/'+item.id+'/season/'+season);if(token!==detailRequest||!$('#detail').open||Number($('#season')?.value)!==season)return;$('#episode').innerHTML=(data.episodes||[]).filter(x=>x.episode_number>0).map(x=>`<option value=\"${Number(x.episode_number)}\">E${Number(x.episode_number)} · ${escape(x.name)}</option>`).join('');if(resume&&Array.from($('#episode').options).some(x=>Number(x.value)===resume))$('#episode').value=String(resume);}catch(error){toast(error.message);}}",
"function episodeReminder(item,season,episode){const progress=state.positions[key(item)+':'+season+':'+episode];if(!progress||Number(progress.timestamp)<=0)return '';const percent=Number(progress.percent)||0;return percent>=95?' · ✓ Watched':percent>0?' · Continue '+Math.max(1,Math.round(percent))+'%':' · In progress';}\nasync function loadEpisodes(item,token,resume){try{const season=Number($('#season').value);$('#episode').innerHTML='<option>Loading…</option>';const data=await api('/tv/'+item.id+'/season/'+season);if(token!==detailRequest||!$('#detail').open||Number($('#season')?.value)!==season)return;$('#episode').innerHTML=(data.episodes||[]).filter(x=>x.episode_number>0).map(x=>`<option value=\"${Number(x.episode_number)}\">E${Number(x.episode_number)} · ${escape(x.name)}${escape(episodeReminder(item,season,Number(x.episode_number)))}</option>`).join('');if(resume&&Array.from($('#episode').options).some(x=>Number(x.value)===resume))$('#episode').value=String(resume);}catch(error){toast(error.message);}}",
'Windows episode reminders');
app=replaceRequired(app,
"async function play(item,ep){if(!item)return;window.zeroExperience?.stop();try{status(state.settings.source==='rawcast'?'RawCast uses your limited API quota · Resolving '+item.title+'…':'Opening '+item.title+'…');await window.zero.play(item,ep);status('Now playing in this window · F11 full screen · Back closes menus or exits playback');}catch(error){toast(error.message);}}",
"async function play(item,ep){if(!item)return;window.zeroExperience?.stop();const source=sourceFor(item);try{status(source==='rawcast'?'RawCast uses your limited API quota · Resolving '+item.title+'…':'Opening '+item.title+'…');await window.zero.play(item,ep,source);oneTimeSources.delete(key(item));status('Now playing in this window · F11 full screen · Back closes menus or exits playback');}catch(error){toast(error.message);}}",
'Windows play source override');

app=replaceRequired(app,
"if(target.dataset.source){await change('settings',{...state.settings,source:target.dataset.source});$('#source-picker').close();if($('#detail').open&&activeDetail)await details(activeDetail);else if(category==='Home')renderHero();toast('Source: '+sourceLabel());return;}",
"if(target.dataset.source){pendingSource=target.dataset.source;$('#source-picker').close();const dialog=ensureSourceConfirm();$('#source-confirm-title').textContent='Use '+sourceName(pendingSource)+' for '+sourcePickerItem.title+'?';$('#source-confirm-copy').textContent='Keep this as the preferred source for this title only? Other movies and series will continue using VidStuck.';dialog.showModal();return;}\n  if(action==='source-keep'){const saved=sourceOverrides();saved[key(sourcePickerItem)]=pendingSource;localStorage.setItem('zero-title-sources',JSON.stringify(saved));oneTimeSources.delete(key(sourcePickerItem));$('#source-confirm').close();toast('Saved for '+sourcePickerItem.title+' only');if($('#detail').open&&activeDetail)await details(activeDetail);else if(category==='Home')renderHero();return;}\n  if(action==='source-once'){oneTimeSources.set(key(sourcePickerItem),pendingSource);$('#source-confirm').close();toast('Using '+sourceName(pendingSource)+' next time for this title');if($('#detail').open&&activeDetail)await details(activeDetail);else if(category==='Home')renderHero();return;}\n  if(action==='source-cancel'){$('#source-confirm').close();return;}",
'Windows source confirmation click');
app=replaceRequired(app,"else if(action==='source')openSources();","else if(action==='source')openSources(activeDetail||heroPicks()[heroIndex]);",'Windows open source with title');
app=replaceRequired(app,"else if(action==='settings')await settings();","else if(action==='settings')await settings();\n  else if(action==='clear-history'){if(!window.confirm('Clear watched history and all in-progress episode markers? Your watchlist, downloads and settings will be kept.'))return;await change('clear-history');toast('Watched history cleared');if(category==='Library')renderLibrary();}",'Windows clear history action');
fs.writeFileSync(appPath,app);

// Add a dedicated history control in Windows settings.
const indexPath=file('windows/ui/index.html');
let index=fs.readFileSync(indexPath,'utf8');
index=replaceRequired(index,
'<fieldset class="danger-zone"><legend>Reset application</legend>',
'<fieldset class="history-zone"><legend>Watched history</legend><p>Clear watched and in-progress movie/episode markers and Continue Watching. Watchlist, downloads and settings are kept.</p><button data-action="clear-history">Clear watched history</button></fieldset><fieldset class="danger-zone"><legend>Reset application</legend>',
'Windows clear history setting');
fs.writeFileSync(indexPath,index);

console.log('Applied final ZeroPlay 2.1 cross-platform polish.');
