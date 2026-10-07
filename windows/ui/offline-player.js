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
const controls=document.getElementById('controls');
const topbar=document.getElementById('topbar');
let cues=[],cueIndex=-1,dragging=false,idleTimer,fill=false;
const CUE_TIME=/^\s*((?:\d{1,2}:)?\d{2}:\d{2}(?:[.,]\d{1,3})?)\s*-->\s*((?:\d{1,2}:)?\d{2}:\d{2}(?:[.,]\d{1,3})?)(?:\s+.*)?\s*$/;

function wake(){
  document.body.classList.remove('hidden-ui');
  document.documentElement.style.cursor='';
  if(controls)controls.style.pointerEvents='auto';
  if(topbar)topbar.style.pointerEvents='auto';
  clearTimeout(idleTimer);
  if(!video.paused&&!dragging&&!speedMenu.matches(':hover'))idleTimer=setTimeout(()=>document.body.classList.add('hidden-ui'),4200);
}
function format(seconds){seconds=Number(seconds);if(!Number.isFinite(seconds)||seconds<0)seconds=0;const total=Math.floor(seconds),h=Math.floor(total/3600),m=Math.floor(total%3600/60),s=total%60;return h?`${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`:`${m}:${String(s).padStart(2,'0')}`;}
function parseTime(value){const parts=String(value||'').trim().replace(',','.').split(':').map(Number);if(parts.some(Number.isNaN))return null;if(parts.length===3)return parts[0]*3600+parts[1]*60+parts[2];if(parts.length===2)return parts[0]*60+parts[1];return null;}
function cleanCaption(text){return String(text||'').replace(/<br\s*\/?>/gi,'\n').replace(/<\/?(?:c(?:\.[^>]*)?|v|lang|ruby|rt|b|i|u)[^>]*>/gi,'').replace(/\{[^}]*\}/g,'').trim();}
function parseVtt(vtt){
  const lines=String(vtt||'').replace(/^\uFEFF/,'').replace(/\r/g,'').split('\n'),out=[];let i=0;
  while(i<lines.length){
    const line=(lines[i]||'').trim();
    if(!line||line.startsWith('WEBVTT')||line.startsWith('NOTE')||line.startsWith('STYLE')||line.startsWith('REGION')){i++;continue;}
    if(/^\d+$/.test(line)&&CUE_TIME.test(lines[i+1]||'')){i++;continue;}
    const match=(lines[i]||'').match(CUE_TIME);if(!match){i++;continue;}
    const start=parseTime(match[1]),end=parseTime(match[2]);i++;const text=[];
    while(i<lines.length){
      if(CUE_TIME.test(lines[i]||''))break;
      if(/^\s*\d+\s*$/.test(lines[i]||'')&&CUE_TIME.test(lines[i+1]||'')){i++;break;}
      if(!(lines[i]||'').trim()){
        let next=i+1;while(next<lines.length&&!(lines[next]||'').trim())next++;
        if(CUE_TIME.test(lines[next]||'')||(/^\s*\d+\s*$/.test(lines[next]||'')&&CUE_TIME.test(lines[next+1]||''))){i=next;break;}
      }
      text.push(lines[i]);i++;
    }
    const caption=cleanCaption(text.join('\n'));if(start!=null&&end!=null&&end>start&&caption)out.push({start,end,text:caption});
  }
  return out.sort((a,b)=>a.start-b.start);
}
function useTrack(row,announce=true){const parsed=parseVtt(row?.vtt);if(!parsed.length)throw Error('Subtitle file did not contain usable cues.');cues=parsed;cueIndex=-1;subtitleOverlay.textContent='';subtitleButton.classList.add('active');subtitleButton.title='Subtitles · '+(row.label||'Loaded');if(announce)status.textContent='✓ Subtitles loaded · '+(row.label||'local subtitle')+' · '+parsed.length+' cues';renderSubtitle(true);wake();}
function renderSubtitle(force=false){if(!cues.length){subtitleOverlay.textContent='';return;}const now=video.currentTime||0;if(!force&&cueIndex>=0){const current=cues[cueIndex];if(now>=current.start&&now<current.end)return;}let next=-1;let startAt=cueIndex>=0?Math.max(0,cueIndex-2):0;for(let i=startAt;i<cues.length;i++){const cue=cues[i];if(now<cue.start)break;if(now>=cue.start&&now<cue.end){next=i;break;}}cueIndex=next;subtitleOverlay.textContent=next>=0?cues[next].text:'';}
function updateTime(){const duration=video.duration||0,current=video.currentTime||0;if(!dragging&&duration>0)seek.value=String(Math.round(current/duration*1000));timeLabel.textContent=`${format(current)} / ${format(duration)}`;renderSubtitle();}
function setPlaying(){document.body.classList.toggle('playing',!video.paused);play.setAttribute('aria-label',video.paused?'Play':'Pause');wake();}
function setMuted(){document.body.classList.toggle('muted',video.muted||video.volume===0);mute.setAttribute('aria-label',video.muted?'Unmute':'Mute');volume.value=String(video.muted?0:video.volume);}
function togglePlay(){video.paused?video.play().catch(()=>{}):video.pause();}

play.addEventListener('click',togglePlay);
video.addEventListener('click',togglePlay);
video.addEventListener('dblclick',()=>window.offline.fullscreen());
video.addEventListener('play',setPlaying);video.addEventListener('pause',setPlaying);video.addEventListener('timeupdate',updateTime);video.addEventListener('durationchange',updateTime);video.addEventListener('seeking',()=>{cueIndex=-1;renderSubtitle(true);});video.addEventListener('seeked',()=>{cueIndex=-1;renderSubtitle(true);});video.addEventListener('volumechange',setMuted);
video.addEventListener('loadedmetadata',()=>{status.textContent='✓ Ready · '+format(video.duration);updateTime();wake();});
video.addEventListener('error',()=>{status.textContent='This file uses a codec the Windows media engine cannot decode.';wake();});

mute.addEventListener('click',()=>{video.muted=!video.muted;setMuted();wake();});
volume.addEventListener('input',()=>{video.muted=false;video.volume=Number(volume.value);setMuted();wake();});
seek.addEventListener('pointerdown',()=>{dragging=true;wake();});seek.addEventListener('pointerup',()=>{dragging=false;wake();});seek.addEventListener('pointercancel',()=>{dragging=false;wake();});seek.addEventListener('input',()=>{const duration=video.duration||0;if(duration>0){video.currentTime=duration*(Number(seek.value)/1000);cueIndex=-1;updateTime();}wake();});

document.getElementById('back').addEventListener('click',()=>window.offline.close());
document.getElementById('full').addEventListener('click',()=>{wake();window.offline.fullscreen();setTimeout(wake,120);});
document.getElementById('fit').addEventListener('click',()=>{fill=!fill;stage.classList.toggle('fill',fill);document.getElementById('fit').title=fill?'Fill screen':'Fit video';wake();});
subtitleButton.addEventListener('click',async()=>{try{status.textContent='Choose an SRT, VTT, ASS or SSA subtitle…';const row=await window.offline.loadSubtitle();if(!row){status.textContent='Subtitle selection cancelled';wake();return;}useTrack(row,true);}catch(error){status.textContent=error.message||'Could not load subtitles';wake();}});

const rates=[0.75,1,1.25,1.5,2];speedMenu.innerHTML=rates.map(rate=>`<button type="button" data-rate="${rate}">${rate}×</button>`).join('');
function syncRate(){speedLabel.textContent=(Number(video.playbackRate).toFixed(2).replace(/\.00$/,'').replace(/0$/,''))+'×';for(const button of speedMenu.querySelectorAll('button'))button.classList.toggle('active',Number(button.dataset.rate)===video.playbackRate);}
speedButton.addEventListener('click',event=>{event.stopPropagation();speedMenu.hidden=!speedMenu.hidden;syncRate();wake();});
speedMenu.addEventListener('click',event=>{const button=event.target.closest('[data-rate]');if(!button)return;video.playbackRate=Number(button.dataset.rate);speedMenu.hidden=true;syncRate();wake();});
document.addEventListener('click',event=>{if(!speedMenu.hidden&&!event.target.closest('#speed-menu')&&!event.target.closest('#speed'))speedMenu.hidden=true;});

function globalWake(){wake();}
for(const event of ['mousemove','pointermove','pointerdown','wheel','touchstart'])document.addEventListener(event,globalWake,{capture:true,passive:true});
document.addEventListener('keydown',globalWake,{capture:true});
window.addEventListener('focus',globalWake);window.addEventListener('pageshow',globalWake);document.addEventListener('visibilitychange',()=>{if(!document.hidden)wake();});document.addEventListener('fullscreenchange',wake);
for(const node of [controls,topbar])if(node){node.addEventListener('mouseenter',wake);node.addEventListener('focusin',wake);node.addEventListener('pointerdown',wake,{capture:true});}

document.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();window.offline.close();return;}if(event.key==='F11'){event.preventDefault();window.offline.fullscreen();setTimeout(wake,120);return;}if(event.code==='Space'&&!/^(INPUT|BUTTON|SELECT)$/.test(event.target?.tagName||'')){event.preventDefault();togglePlay();return;}if(event.key==='ArrowRight'&&!/^(INPUT|BUTTON|SELECT)$/.test(event.target?.tagName||'')){event.preventDefault();video.currentTime=Math.min(video.duration||Infinity,(video.currentTime||0)+10);cueIndex=-1;updateTime();return;}if(event.key==='ArrowLeft'&&!/^(INPUT|BUTTON|SELECT)$/.test(event.target?.tagName||'')){event.preventDefault();video.currentTime=Math.max(0,(video.currentTime||0)-10);cueIndex=-1;updateTime();return;}if(event.key==='ArrowUp'&&!/^(INPUT|BUTTON|SELECT)$/.test(event.target?.tagName||'')){event.preventDefault();video.muted=false;video.volume=Math.min(1,video.volume+.05);return;}if(event.key==='ArrowDown'&&!/^(INPUT|BUTTON|SELECT)$/.test(event.target?.tagName||'')){event.preventDefault();video.volume=Math.max(0,video.volume-.05);return;}});

(async()=>{try{const context=await window.offline.context();title.textContent=context.title||'Downloaded video';video.src=context.url;const found=context.subtitles||[];if(found.length){try{useTrack(found[0],false);status.textContent='✓ Auto-loaded subtitles · '+(found[0].label||'local subtitle')+' · '+cues.length+' cues';}catch{status.textContent='Local subtitle found but could not be parsed';}}await video.play().catch(()=>{});setPlaying();setMuted();syncRate();wake();}catch(error){status.textContent=error.message||'Could not open downloaded video';wake();}})();
