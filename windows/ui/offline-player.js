'use strict';
const video=document.getElementById('video');
const stage=document.getElementById('stage');
const title=document.getElementById('title');
const status=document.getElementById('status');
const play=document.getElementById('play');
const mute=document.getElementById('mute');
const volume=document.getElementById('volume');
const seek=document.getElementById('seek');
const timeLabel=document.getElementById('time');
const subtitleButton=document.getElementById('subtitle');
const subtitleOverlay=document.getElementById('subtitle-overlay');
const speedButton=document.getElementById('speed');
const speedLabel=document.getElementById('speed-label');
const speedMenu=document.getElementById('speed-menu');
let cues=[],cueIndex=-1,dragging=false,idleTimer,fill=false;

function wake(){document.body.classList.remove('hidden-ui');clearTimeout(idleTimer);if(!video.paused)idleTimer=setTimeout(()=>document.body.classList.add('hidden-ui'),4200);}
function format(seconds){seconds=Number(seconds);if(!Number.isFinite(seconds)||seconds<0)seconds=0;const total=Math.floor(seconds),h=Math.floor(total/3600),m=Math.floor(total%3600/60),s=total%60;return h?`${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`:`${m}:${String(s).padStart(2,'0')}`;}
function parseTime(value){const parts=String(value||'').trim().replace(',','.').split(':').map(Number);if(parts.some(Number.isNaN))return null;if(parts.length===3)return parts[0]*3600+parts[1]*60+parts[2];if(parts.length===2)return parts[0]*60+parts[1];return null;}
function cleanCaption(text){return String(text||'').replace(/<br\s*\/?>/gi,'\n').replace(/<\/?(?:c(?:\.[^>]*)?|v|lang|ruby|rt|b|i|u)[^>]*>/gi,'').replace(/\{[^}]*\}/g,'').trim();}
function parseVtt(vtt){const lines=String(vtt||'').replace(/^\uFEFF/,'').replace(/\r/g,'').split('\n');const out=[];let i=0;if(lines[0]?.trim().startsWith('WEBVTT'))i++;while(i<lines.length){while(i<lines.length&&!lines[i].trim())i++;if(i>=lines.length)break;if(!lines[i].includes('-->'))i++;if(i>=lines.length||!lines[i].includes('-->'))continue;const timing=lines[i++].split('-->');const start=parseTime(timing[0]),end=parseTime((timing[1]||'').trim().split(/\s+/)[0]);const text=[];while(i<lines.length&&lines[i].trim())text.push(lines[i++]);const caption=cleanCaption(text.join('\n'));if(start!=null&&end!=null&&end>start&&caption)out.push({start,end,text:caption});}return out.sort((a,b)=>a.start-b.start);}
function useTrack(row,announce=true){const parsed=parseVtt(row?.vtt);if(!parsed.length)throw Error('Subtitle file did not contain usable cues.');cues=parsed;cueIndex=-1;subtitleOverlay.textContent='';subtitleButton.classList.add('active');subtitleButton.title='Subtitles · '+(row.label||'Loaded');if(announce)status.textContent='✓ Subtitles loaded · '+(row.label||parsed.length+' cues');renderSubtitle(true);wake();}
function renderSubtitle(force=false){if(!cues.length){subtitleOverlay.textContent='';return;}const now=video.currentTime||0;if(!force&&cueIndex>=0){const current=cues[cueIndex];if(now>=current.start&&now<current.end)return;}let next=-1;for(let i=Math.max(0,cueIndex-1);i<cues.length;i++){const cue=cues[i];if(now<cue.start)break;if(now>=cue.start&&now<cue.end){next=i;break;}}cueIndex=next;subtitleOverlay.textContent=next>=0?cues[next].text:'';}
function updateTime(){const duration=video.duration||0,current=video.currentTime||0;if(!dragging&&duration>0)seek.value=String(Math.round(current/duration*1000));timeLabel.textContent=`${format(current)} / ${format(duration)}`;renderSubtitle();}
function setPlaying(){document.body.classList.toggle('playing',!video.paused);play.setAttribute('aria-label',video.paused?'Play':'Pause');wake();}
function setMuted(){document.body.classList.toggle('muted',video.muted||video.volume===0);mute.setAttribute('aria-label',video.muted?'Unmute':'Mute');volume.value=String(video.muted?0:video.volume);}
function togglePlay(){video.paused?video.play().catch(()=>{}):video.pause();}

play.addEventListener('click',togglePlay);
video.addEventListener('click',togglePlay);
video.addEventListener('dblclick',()=>window.offline.fullscreen());
video.addEventListener('play',setPlaying);video.addEventListener('pause',setPlaying);video.addEventListener('timeupdate',updateTime);video.addEventListener('durationchange',updateTime);video.addEventListener('volumechange',setMuted);
video.addEventListener('loadedmetadata',()=>{status.textContent='✓ Ready · '+format(video.duration);updateTime();wake();});
video.addEventListener('error',()=>{status.textContent='This file uses a codec the Windows media engine cannot decode.';wake();});

mute.addEventListener('click',()=>{video.muted=!video.muted;setMuted();wake();});
volume.addEventListener('input',()=>{video.muted=false;video.volume=Number(volume.value);setMuted();wake();});
seek.addEventListener('pointerdown',()=>dragging=true);seek.addEventListener('pointerup',()=>dragging=false);seek.addEventListener('input',()=>{const duration=video.duration||0;if(duration>0){video.currentTime=duration*(Number(seek.value)/1000);updateTime();}wake();});

document.getElementById('back').addEventListener('click',()=>window.offline.close());
document.getElementById('full').addEventListener('click',()=>window.offline.fullscreen());
document.getElementById('fit').addEventListener('click',()=>{fill=!fill;stage.classList.toggle('fill',fill);document.getElementById('fit').title=fill?'Fill screen':'Fit video';wake();});
subtitleButton.addEventListener('click',async()=>{try{status.textContent='Choose an SRT, VTT, ASS or SSA subtitle…';const row=await window.offline.loadSubtitle();if(!row){status.textContent='Subtitle selection cancelled';wake();return;}useTrack(row,true);}catch(error){status.textContent=error.message||'Could not load subtitles';wake();}});

const rates=[0.75,1,1.25,1.5,2];speedMenu.innerHTML=rates.map(rate=>`<button type="button" data-rate="${rate}">${rate}×</button>`).join('');
function syncRate(){speedLabel.textContent=(Number(video.playbackRate).toFixed(2).replace(/\.00$/,'').replace(/0$/,''))+'×';for(const button of speedMenu.querySelectorAll('button'))button.classList.toggle('active',Number(button.dataset.rate)===video.playbackRate);}
speedButton.addEventListener('click',event=>{event.stopPropagation();speedMenu.hidden=!speedMenu.hidden;syncRate();wake();});
speedMenu.addEventListener('click',event=>{const button=event.target.closest('[data-rate]');if(!button)return;video.playbackRate=Number(button.dataset.rate);speedMenu.hidden=true;syncRate();wake();});
document.addEventListener('click',event=>{if(!speedMenu.hidden&&!event.target.closest('#speed-menu')&&!event.target.closest('#speed'))speedMenu.hidden=true;});

for(const event of ['mousemove','pointerdown','keydown'])document.addEventListener(event,wake,{passive:true});
document.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();window.offline.close();return;}if(event.key==='F11'){event.preventDefault();window.offline.fullscreen();return;}if(event.code==='Space'&&event.target===document.body){event.preventDefault();togglePlay();return;}if(event.key==='ArrowRight'){event.preventDefault();video.currentTime=Math.min(video.duration||Infinity,(video.currentTime||0)+10);updateTime();return;}if(event.key==='ArrowLeft'){event.preventDefault();video.currentTime=Math.max(0,(video.currentTime||0)-10);updateTime();return;}if(event.key==='ArrowUp'){event.preventDefault();video.muted=false;video.volume=Math.min(1,video.volume+.05);return;}if(event.key==='ArrowDown'){event.preventDefault();video.volume=Math.max(0,video.volume-.05);return;}});

(async()=>{try{const context=await window.offline.context();title.textContent=context.title||'Downloaded video';video.src=context.url;const found=context.subtitles||[];if(found.length){try{useTrack(found[0],false);status.textContent='✓ Auto-loaded subtitles · '+(found[0].label||'local subtitle');}catch{status.textContent='Local subtitle found but could not be parsed';}}await video.play().catch(()=>{});setPlaying();setMuted();syncRate();wake();}catch(error){status.textContent=error.message||'Could not open downloaded video';wake();}})();
