'use strict';
const shell=document.getElementById('player-shell');
const title=document.getElementById('title');
const seek=document.getElementById('seek');
const currentLabel=document.getElementById('current');
const remainingLabel=document.getElementById('remaining');
const play=document.getElementById('play');
const centerPlay=document.getElementById('center-play');
const mute=document.getElementById('mute');
const volume=document.getElementById('volume');
const speed=document.getElementById('speed');
const speedLabel=document.getElementById('speed-label');
const speedMenu=document.getElementById('speed-menu');
const subtitle=document.getElementById('subtitle');
const subtitleMenu=document.getElementById('subtitle-menu');
const subtitleTracks=document.getElementById('subtitle-tracks');
const toast=document.getElementById('toast');
let state={position:0,duration:0,paused:false,volume:100,muted:false,speed:1,panscan:0,tracks:[]};
let dragging=false,idleTimer,toastTimer;
const api=window.zeroOfflineMpv;

function fmt(seconds){seconds=Math.max(0,Number(seconds)||0);const total=Math.floor(seconds),h=Math.floor(total/3600),m=Math.floor((total%3600)/60),s=total%60;return h?`${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`:`${m}:${String(s).padStart(2,'0')}`;}
function showToast(text){if(!text)return;toast.textContent=text;toast.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.hidden=true,1800);}
function wake(){shell.classList.remove('idle');clearTimeout(idleTimer);idleTimer=setTimeout(()=>{if(!dragging&&!speedMenu.matches(':hover')&&!subtitleMenu.matches(':hover'))shell.classList.add('idle');},2600);}
function command(action,value){wake();return api.command(action,value).catch(()=>false);}
function renderTracks(){
  const tracks=Array.isArray(state.tracks)?state.tracks:[];
  const subs=tracks.filter(t=>t&&t.type==='sub');
  subtitleTracks.innerHTML=subs.map(t=>`<button type="button" data-sid="${String(t.id).replace(/"/g,'')}">${t.selected?'✓ ':''}${(t.title||t.lang||('Subtitle '+t.id)).replace(/[<>]/g,'')}</button>`).join('');
  subtitle.classList.toggle('active',subs.some(t=>t.selected));
}
function render(next={}){
  state={...state,...next};
  if(next.title)title.textContent=next.title;
  shell.classList.toggle('playing',!state.paused);
  shell.classList.toggle('error-state',Boolean(next.error));
  if(!dragging&&state.duration>0)seek.value=String(Math.round((state.position/state.duration)*1000));
  currentLabel.textContent=fmt(state.position);
  remainingLabel.textContent='-'+fmt(Math.max(0,state.duration-state.position));
  volume.value=String(Math.max(0,Math.min(100,state.muted?0:state.volume)));
  mute.classList.toggle('active',state.muted||state.volume===0);
  speedLabel.textContent=(Number(state.speed||1).toFixed(2).replace(/\.00$/,'').replace(/0$/,''))+'×';
  document.getElementById('fit').classList.toggle('active',Number(state.panscan)>0);
  if(next.tracks)renderTracks();
  if(next.toast)showToast(next.toast);
  if(next.error)showToast(next.error);
}

play.addEventListener('click',()=>command('toggle'));
centerPlay.addEventListener('click',()=>command('toggle'));
document.getElementById('back10').addEventListener('click',()=>command('seek-relative',-10));
document.getElementById('forward10').addEventListener('click',()=>command('seek-relative',10));
mute.addEventListener('click',()=>command('mute'));
volume.addEventListener('input',()=>command('volume',Number(volume.value)));
seek.addEventListener('pointerdown',()=>{dragging=true;wake();});
seek.addEventListener('pointerup',()=>{dragging=false;command('seek-percent',(Number(seek.value)/1000)*100);});
seek.addEventListener('pointercancel',()=>{dragging=false;wake();});
seek.addEventListener('input',()=>{if(state.duration>0){const p=(Number(seek.value)/1000)*state.duration;currentLabel.textContent=fmt(p);remainingLabel.textContent='-'+fmt(Math.max(0,state.duration-p));}});
document.getElementById('fit').addEventListener('click',()=>command('fit'));
document.getElementById('full').addEventListener('click',()=>{wake();api.fullscreen();});
document.getElementById('back').addEventListener('click',()=>api.close());

const speeds=[0.5,0.75,1,1.25,1.5,1.75,2];
speedMenu.innerHTML=speeds.map(v=>`<button type="button" data-speed="${v}">${v}×</button>`).join('');
speed.addEventListener('click',event=>{event.stopPropagation();speedMenu.hidden=!speedMenu.hidden;subtitleMenu.hidden=true;wake();});
speedMenu.addEventListener('click',event=>{const button=event.target.closest('[data-speed]');if(!button)return;command('speed',Number(button.dataset.speed));speedMenu.hidden=true;});
subtitle.addEventListener('click',event=>{event.stopPropagation();subtitleMenu.hidden=!subtitleMenu.hidden;speedMenu.hidden=true;wake();});
subtitleMenu.addEventListener('click',async event=>{
  const sid=event.target.closest('[data-sid]');if(sid){await command('subtitle-track',sid.dataset.sid);subtitleMenu.hidden=true;return;}
  const action=event.target.closest('[data-sub]')?.dataset.sub;if(action==='toggle'){await command('subtitle-toggle');subtitleMenu.hidden=true;}if(action==='load'){await api.chooseSubtitle();subtitleMenu.hidden=true;}
});
document.addEventListener('click',event=>{if(!event.target.closest('#speed')&&!event.target.closest('#speed-menu'))speedMenu.hidden=true;if(!event.target.closest('#subtitle')&&!event.target.closest('#subtitle-menu'))subtitleMenu.hidden=true;});

for(const event of ['mousemove','pointermove','pointerdown','wheel','touchstart'])document.addEventListener(event,wake,{passive:true});
document.addEventListener('keydown',event=>{
  wake();
  if(event.code==='Space'&&!/^(INPUT|BUTTON|SELECT)$/.test(event.target?.tagName||'')){event.preventDefault();command('toggle');}
  else if(event.key==='ArrowRight'){event.preventDefault();command('seek-relative',10);}
  else if(event.key==='ArrowLeft'){event.preventDefault();command('seek-relative',-10);}
  else if(event.key==='ArrowUp'){event.preventDefault();command('volume',Math.min(100,(state.volume||0)+5));}
  else if(event.key==='ArrowDown'){event.preventDefault();command('volume',Math.max(0,(state.volume||0)-5));}
  else if(event.key==='f'||event.key==='F'||event.key==='F11'){event.preventDefault();api.fullscreen();}
  else if(event.key==='Escape'){event.preventDefault();if(state.fullscreen)api.fullscreen();else api.close();}
  else if(event.key==='m'||event.key==='M'){event.preventDefault();command('mute');}
});
document.addEventListener('dblclick',event=>{if(!event.target.closest('button,input,.popup'))api.fullscreen();});

api.onState(render);
wake();
