(()=>{'use strict';
const q=s=>document.querySelector(s), settings=q('#settings .settings-body');
if(!settings)return;
const section=(name,description)=>{const box=document.createElement('section');box.className='settings-section';box.dataset.settingsSection=name.toLowerCase().replace(/[^a-z]+/g,'-');const h=document.createElement('h3');h.textContent=name;box.append(h);if(description){const p=document.createElement('p');p.className='settings-section-copy';p.textContent=description;box.append(p);}return box;};
const marker=(el)=>{if(!el)return null;if(el.tagName==='LABEL'||el.tagName==='FIELDSET'||el.classList?.contains('rawcast-controls'))return el;return el.closest('label,fieldset,.rawcast-controls')||el;};
const move=(box,...selectors)=>{for(const sel of selectors){const el=marker(q(sel));if(el&&el.parentElement===settings)box.append(el);}};
const general=section('General','Core catalog, region, and update preferences.');
move(general,'#api-key','#key-state','#region');
const home=section('Home','Choose what appears on your ZeroPlay home screen.');
move(home,'#home-panels');const restore=q('[data-action="restore-panels"]');if(restore)home.append(restore);
const appearance=section('Appearance','Choose your interface and theme. Existing saved choices are preserved.');
move(appearance,'#ui-layout','#theme');
const experience=section('Experience','Control motion, previews, and browsing behavior.');
move(experience,'#preview-settings');
const playback=section('Playback & Downloads','Streaming sources, downloads, and torrent search controls.');
move(playback,'#playback-source','#rawcastPlayback','#rawcast-controls','#torrentSearchSettings-enabled');
const tsp=q('#torrentSearchSettings-enabled')?.closest('fieldset');if(tsp&&tsp.parentElement===settings)playback.append(tsp);
const player=section('Player','Playback sound and Live TV provider visibility.');
move(player,'#gain');
let live=q('#liveCignal')?.closest('fieldset');
if(!live){live=document.createElement('fieldset');live.innerHTML='<legend>Live TV channel providers</legend><p>World and other Live TV channels always remain enabled.</p><label class="panel-toggle"><input type="checkbox" id="liveCignal">Enable Cignal channels</label><label class="panel-toggle"><input type="checkbox" id="liveConverge">Enable Converge channels</label><small>Cignal and Converge are disabled by default on Windows.</small>';}
player.append(live);
const about=section('About','Version, attribution, and update information.');
for(const el of [...settings.children]){if(el.matches('.eyebrow,h2,.settings-section,.actions,#settings-status'))continue;if(el.tagName==='HR'||el.classList?.contains('tmdb-logo')||el.id==='version'||(el.tagName==='P'&&/TMDB|fullscreen|library|version/i.test(el.textContent)))about.append(el);}
const actions=q('#settings-status')?.previousElementSibling;if(actions?.classList.contains('actions'))settings.append(actions);const status=q('#settings-status');if(status)settings.append(status);
for(const box of [general,home,appearance,experience,playback,player,about])settings.insertBefore(box,actions||status||null);
})();