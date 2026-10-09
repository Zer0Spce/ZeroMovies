'use strict';
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8').replace(/\r\n/g,'\n');
const write=(rel,value)=>fs.writeFileSync(path.join(root,rel),value);
function replace(text,from,to,label){if(text.includes(to))return text;if(!text.includes(from))throw Error('Missing final polish marker: '+label);return text.replace(from,to);}

let core=read('core.cjs');
core=replace(core,
  'state.history=[row,...state.history.filter(x=>x.historyKey!==historyKey)].slice(0,100);state.positions[id]={...row};return row;',
  'state.history=[row,...state.history.filter(x=>x.historyKey!==historyKey)].slice(0,100);state.positions[id]={...row};state.positions[historyKey]={...row};return row;',
  'per-episode positions');
write('core.cjs',core);

let preload=read('preload.cjs');
preload=replace(preload,
  "play:(item,episode)=>ipcRenderer.invoke('play',item,episode),",
  "play:(item,episode,source)=>ipcRenderer.invoke('play',item,episode,source),",
  'source-aware preload play');
write('preload.cjs',preload);

let main=read('main.cjs');
main=replace(main,
  'async function openPlayer(value,selected,fixture,prepare=false){\n  value=core.cleanItem(value);',
  'async function openPlayer(value,selected,fixture,prepare=false,sourceOverride){\n  value=core.cleanItem(value);const requestedSource=["vidstuck","vidsrc-sh","rawcast"].includes(sourceOverride)?sourceOverride:"vidstuck";const playbackSource=requestedSource==="rawcast"&&state.settings.rawcastPlayback!==true?"vidstuck":requestedSource;',
  'source-aware openPlayer');
main=replace(main,
  "if(state.settings.source==='rawcast'&&state.settings.rawcastPlayback===true&&!fixture){",
  "if(playbackSource==='rawcast'&&state.settings.rawcastPlayback===true&&!fixture){",
  'source-aware rawcast');
main=replace(main,
  "await contents.loadURL(core.playerUrl(value,position,state.settings.source));",
  "await contents.loadURL(core.playerUrl(value,position,playbackSource));",
  'source-aware player URL');
main=replace(main,
  "ipcMain.handle('play',async(event,value,ep)=>{trusted(event);await openPlayer(value,ep);return true;});",
  "ipcMain.handle('play',async(event,value,ep,source)=>{trusted(event);await openPlayer(value,ep,null,false,source);return true;});",
  'source-aware play IPC');
write('main.cjs',main);

let app=read('ui/app.js');
app=replace(app,
  "let state,category='Home',libraryTab='Continue watching',page=1,request=0,detailRequest=0,heroIndex=0,heroTimer,heroPaused=false,providerType='movie',providerId,providerName,homeData={},activeDetail;",
  "let state,category='Home',libraryTab='Continue watching',page=1,request=0,detailRequest=0,heroIndex=0,heroTimer,heroPaused=false,providerType='movie',providerId,providerName,homeData={},activeDetail,sourcePickerItem,pendingSource;const oneTimeSources=new Map();",
  'renderer source state');
app=replace(app,
`function sourceLabel(){return sources.find(x=>x[0]===state.settings.source)?.[1]||'VidStuck';}
function sourceButton(){return \`<button data-action="source">\${escape(sourceLabel())}\${state.settings.source==='vidstuck'?' · Recommended':''} ▾</button>\`;}
function atmosphere(item){const img=$('#ui-atmosphere img');if(item?.backdrop&&img.getAttribute('src')!==item.backdrop)img.src=item.backdrop;}
function openSources(){window.zeroExperience?.stop(); $('#source-options').innerHTML=sources.filter(([id])=>id!=='rawcast'||state.settings.rawcastPlayback===true).map(([id,name])=>\`<button class="source-option \${state.settings.source===id?'selected':''}" data-source="\${id}">\${name}\${id==='vidstuck'?'<small>Recommended</small>':id==='rawcast'?'<small>Requires your API key. Streaming uses your limited request quota; availability depends on your account.</small>':''}\${state.settings.source===id?'<span>✓</span>':''}</button>\`).join('');$('#source-picker').showModal();}`,
`function sourceOverrides(){try{return JSON.parse(localStorage.getItem('zero-title-sources')||'{}')||{};}catch{return {};}}
function sourceFor(item){if(!item)return 'vidstuck';const once=oneTimeSources.get(key(item));if(sources.some(([id])=>id===once))return once;const saved=sourceOverrides()[key(item)];return sources.some(([id])=>id===saved)?saved:'vidstuck';}
function sourceName(id){return sources.find(x=>x[0]===id)?.[1]||'VidStuck';}
function sourceLabel(item){const id=sourceFor(item);return sourceName(id)+(id==='vidstuck'?' · Recommended':'');}
function sourceButton(item){return \`<button data-action="source">\${escape(sourceLabel(item))} ▾</button>\`;}
function atmosphere(item){const img=$('#ui-atmosphere img');if(item?.backdrop&&img.getAttribute('src')!==item.backdrop)img.src=item.backdrop;}
function ensureSourceConfirm(){let dialog=$('#source-confirm');if(dialog)return dialog;dialog=document.createElement('dialog');dialog.id='source-confirm';dialog.innerHTML='<div class="settings-body"><span class="eyebrow">THIS TITLE ONLY</span><h2 id="source-confirm-title">Keep source?</h2><p id="source-confirm-copy"></p><div class="actions"><button class="primary" data-action="source-keep">✓ Keep for this title</button><button data-action="source-once">Just this time</button><button data-action="source-cancel">Cancel</button></div></div>';document.body.appendChild(dialog);return dialog;}
function openSources(item){sourcePickerItem=item||activeDetail||heroPicks()[heroIndex];if(!sourcePickerItem)return;window.zeroExperience?.stop();const selected=sourceFor(sourcePickerItem);$('#source-options').innerHTML=sources.filter(([id])=>id!=='rawcast'||state.settings.rawcastPlayback===true).map(([id,name])=>\`<button class="source-option \${selected===id?'selected':''}" data-source="\${id}">\${name}\${id==='vidstuck'?'<small>Recommended · default for other titles</small>':id==='rawcast'?'<small>Requires your API key. Streaming uses your limited request quota.</small>':''}\${selected===id?'<span>✓</span>':''}</button>\`).join('');const note=$('#source-picker p');if(note)note.textContent='Choose a source for '+sourcePickerItem.title+'. Other movies and series stay on VidStuck.';$('#source-picker').showModal();}`,
  'per-title source UI');
app=app.replaceAll('${sourceButton()}','${sourceButton(item)}');
app=replace(app,
"async function loadEpisodes(item,token,resume){try{const season=Number($('#season').value);$('#episode').innerHTML='<option>Loading…</option>';const data=await api('/tv/'+item.id+'/season/'+season);if(token!==detailRequest||!$('#detail').open||Number($('#season')?.value)!==season)return;$('#episode').innerHTML=(data.episodes||[]).filter(x=>x.episode_number>0).map(x=>`<option value=\"${Number(x.episode_number)}\">E${Number(x.episode_number)} · ${escape(x.name)}</option>`).join('');if(resume&&Array.from($('#episode').options).some(x=>Number(x.value)===resume))$('#episode').value=String(resume);}catch(error){toast(error.message);}}",
"function episodeReminder(item,season,episode){const progress=state.positions[key(item)+':'+season+':'+episode];if(!progress||Number(progress.timestamp)<=0)return '';const percent=Number(progress.percent)||0;return percent>=95?' · ✓ Watched':percent>0?' · Continue '+Math.max(1,Math.round(percent))+'%':' · In progress';}\nasync function loadEpisodes(item,token,resume){try{const season=Number($('#season').value);$('#episode').innerHTML='<option>Loading…</option>';const data=await api('/tv/'+item.id+'/season/'+season);if(token!==detailRequest||!$('#detail').open||Number($('#season')?.value)!==season)return;$('#episode').innerHTML=(data.episodes||[]).filter(x=>x.episode_number>0).map(x=>`<option value=\"${Number(x.episode_number)}\">E${Number(x.episode_number)} · ${escape(x.name)}${escape(episodeReminder(item,season,Number(x.episode_number)))}</option>`).join('');if(resume&&Array.from($('#episode').options).some(x=>Number(x.value)===resume))$('#episode').value=String(resume);}catch(error){toast(error.message);}}",
  'episode reminders');
app=replace(app,
"async function play(item,ep){if(!item)return;window.zeroExperience?.stop();try{status(state.settings.source==='rawcast'?'RawCast uses your limited API quota · Resolving '+item.title+'…':'Opening '+item.title+'…');await window.zero.play(item,ep);status('Now playing in this window · F11 full screen · Back closes menus or exits playback');}catch(error){toast(error.message);}}",
"async function play(item,ep){if(!item)return;window.zeroExperience?.stop();const source=sourceFor(item);try{status(source==='rawcast'?'RawCast uses your limited API quota · Resolving '+item.title+'…':'Opening '+item.title+'…');await window.zero.play(item,ep,source);oneTimeSources.delete(key(item));status('Now playing in this window · F11 full screen · Back closes menus or exits playback');}catch(error){toast(error.message);}}",
  'source-aware renderer play');
app=replace(app,
"if(target.dataset.source){await change('settings',{...state.settings,source:target.dataset.source});$('#source-picker').close();if($('#detail').open&&activeDetail)await details(activeDetail);else if(category==='Home')renderHero();toast('Source: '+sourceLabel());return;}",
"if(target.dataset.source){pendingSource=target.dataset.source;$('#source-picker').close();const dialog=ensureSourceConfirm();$('#source-confirm-title').textContent='Use '+sourceName(pendingSource)+' for '+sourcePickerItem.title+'?';$('#source-confirm-copy').textContent='Keep this as the preferred source for this title only? Other movies and series will continue using VidStuck.';dialog.showModal();return;}\n  if(target.dataset.action==='source-keep'){const saved=sourceOverrides();saved[key(sourcePickerItem)]=pendingSource;localStorage.setItem('zero-title-sources',JSON.stringify(saved));oneTimeSources.delete(key(sourcePickerItem));$('#source-confirm').close();toast('Saved for '+sourcePickerItem.title+' only');if($('#detail').open&&activeDetail)await details(activeDetail);else if(category==='Home')renderHero();return;}\n  if(target.dataset.action==='source-once'){oneTimeSources.set(key(sourcePickerItem),pendingSource);$('#source-confirm').close();toast('Using '+sourceName(pendingSource)+' next time for this title');if($('#detail').open&&activeDetail)await details(activeDetail);else if(category==='Home')renderHero();return;}\n  if(target.dataset.action==='source-cancel'){$('#source-confirm').close();return;}",
  'source confirmation');
app=replace(app,"else if(action==='source')openSources();","else if(action==='source')openSources(activeDetail||heroPicks()[heroIndex]);",'title-aware source open');
app=replace(app,"else if(action==='settings')await settings();","else if(action==='settings')await settings();\n  else if(action==='clear-history'){if(!window.confirm('Clear watched history and all in-progress episode markers? Your watchlist, downloads and settings will be kept.'))return;await change('clear-history');toast('Watched history cleared');if(category==='Library')renderLibrary();}",'clear watched history action');
write('ui/app.js',app);

let index=read('ui/index.html');
index=replace(index,
  '<fieldset class="danger-zone"><legend>Reset application</legend>',
  '<fieldset class="history-zone"><legend>Watched history</legend><p>Clear watched and in-progress movie/episode markers and Continue Watching. Watchlist, downloads and settings are kept.</p><button data-action="clear-history">Clear watched history</button></fieldset><fieldset class="danger-zone"><legend>Reset application</legend>',
  'watched history settings control');
write('ui/index.html',index);

console.log('Applied final Windows per-title source and episode-history polish.');
