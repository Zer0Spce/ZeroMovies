const {JSDOM}=require('jsdom'),fs=require('node:fs'),assert=require('node:assert/strict');
const source=fs.readFileSync(process.env.ZERO_GUARD_PATH||'android-next/player-guard.js','utf8');
const mouseBackSource=fs.readFileSync(process.env.ZERO_MOUSE_BACK_PATH||'app/src/main/assets/mouse-back.js','utf8');
function page(html){const dom=new JSDOM(html,{runScripts:'outside-only',url:'https://vidstuck.xyz/embed/movie/299534'}),w=dom.window;w.__zeroTv=true;w.__zeroBlockAds=true;w.HTMLElement.prototype.getBoundingClientRect=function(){const left=Number(this.dataset.x)||0,top=Number(this.dataset.y)||0,width=Number(this.dataset.w)||100,height=Number(this.dataset.h)||40;return {left,top,width,height,right:left+width,bottom:top+height};};w.HTMLElement.prototype.scrollIntoView=function(){};w.eval(source);w.document.dispatchEvent(new w.Event('DOMContentLoaded'));return dom;}
async function run(){
  let dom=page('<video></video><div class="plyr__controls" data-y="650" data-w="1024" data-h="70"><button id="play" data-x="100" data-y="660">Play</button><button id="volume" data-x="300" data-y="660">Volume</button><button id="subtitles" data-x="500" data-y="660">Subtitles</button></div>');const w=dom.window;let seeks=0,clicks=0;w.document.addEventListener('keydown',event=>{if(event.key==='ArrowLeft')seeks++;});w.document.getElementById('play').onclick=()=>clicks++;
  w.__zeroTvNavigate('right');assert.equal(w.document.activeElement.id,'play');w.__zeroTvNavigate('right');assert.equal(w.document.activeElement.id,'volume');
  const left=new w.KeyboardEvent('keydown',{key:'ArrowLeft',bubbles:true,cancelable:true});w.document.dispatchEvent(left);assert.equal(w.document.activeElement.id,'play');assert.equal(seeks,0,'Left must navigate focus without reaching provider seek hotkeys');assert.equal(left.defaultPrevented,true);assert.equal(clicks,0,'Arrow movement must not activate playback');
  w.__zeroTvNavigate('ok');assert.equal(clicks,1);dom.window.close();
  dom=page('<button id="top" data-x="400" data-y="100">Top</button><button id="down" data-x="410" data-y="300">Down</button><button id="side" data-x="50" data-y="280">Side</button>');dom.window.__zeroTvNavigate('down');assert.equal(dom.window.document.activeElement.id,'top');dom.window.__zeroTvNavigate('down');assert.equal(dom.window.document.activeElement.id,'down','Down should choose the nearest control below, not a sideways/list-order item');dom.window.__zeroTvNavigate('down');assert.equal(dom.window.document.activeElement.id,'down','Navigation must not wrap at the bottom');dom.window.close();
  dom=page('<button id="back" aria-label="Go back">Back</button><button id="play" data-x="200">Play</button>');let exits=0;dom.window.ZeroPlayer={postMessage:value=>{assert.equal(value,'back');exits++;}};dom.window.document.getElementById('back').click();assert.equal(exits,1,'The player Back button should exit via the narrow native action');dom.window.close();
  dom=page('<iframe id="frame" data-w="1024" data-h="768"></iframe>');let forwarded;const frame=dom.window.document.querySelector('iframe');frame.contentWindow.postMessage=data=>forwarded=data;dom.window.__zeroTvNavigate('left');assert.equal(forwarded.type,'zerostreams-tv-nav');assert.equal(forwarded.direction,'left');assert.equal(dom.window.document.activeElement,frame);dom.window.close();
  dom=page('<video></video><div id="component"></div>');const root=dom.window.document.getElementById('component').attachShadow({mode:'open'});root.innerHTML='<img id="painted" data-w="1024" data-h="768">';dom.window.__zeroDismissQrAd();assert.equal(root.getElementById('painted').style.display,'none','Native-confirmed painted QR advertisements inside open shadow DOM should be removed');assert.equal(dom.window.document.querySelector('video').style.display,'');dom.window.close();
  dom=page('<video></video><div class="plyr__controls" style="opacity:0;visibility:hidden;pointer-events:none;display:none" data-y="650" data-h="70"><button data-x="100">Play</button><button data-x="300">Volume</button></div>');const wake=dom.window,bar=wake.document.querySelector('.plyr__controls');wake.document.documentElement.classList.add("zero-player-idle");bar.style.opacity="0";assert.equal(wake.document.documentElement.classList.contains('zero-player-idle'),true);wake.__zeroTvNavigate('right');assert.equal(wake.document.documentElement.classList.contains('zero-player-idle'),false);assert.equal(wake.getComputedStyle(bar).opacity,'1');assert.equal(wake.getComputedStyle(bar).visibility,'visible');assert.notEqual(wake.getComputedStyle(bar).display,'none');assert.equal(wake.document.activeElement.textContent,'Play');wake.document.documentElement.classList.add("zero-player-idle");bar.style.opacity="0";assert.equal(bar.style.opacity,'0');wake.__zeroTvNavigate('ok');assert.equal(wake.getComputedStyle(bar).opacity,'1');dom.window.close();

  assert.match(mouseBackSource,/__zeroTvBackStep/,'TV Back bridge must expose a staged provider Back request');
  assert.match(mouseBackSource,/return 'menu'/,'Back stage must distinguish an open provider function/menu');
  assert.match(mouseBackSource,/return 'controls'/,'Back stage must distinguish visible player controls');
  assert.match(mouseBackSource,/return 'exit'/,'Back stage must explicitly report when playback should exit');
  assert.match(mouseBackSource,/zerostreams-tv-back-query/,'Back staging must recurse into embedded provider frames');
  assert.match(mouseBackSource,/event\.stopImmediatePropagation\(\)/,'The first D-pad press after script-detected idle must be consumed as wake-only');

  const activityPath=process.env.ZERO_TV_ACTIVITY||'app/src/main/java/com/zerostreams/app/BrowserPlayerActivity.java';
  const activity=fs.readFileSync(activityPath,'utf8');
  const mouse=fs.readFileSync('app/src/main/java/com/zerostreams/app/TvMouse.java','utf8');
  assert.match(activity,/sendTvNavigation\(direction,0\)/,'TV Activity must route D-pad through the focus navigator');
  assert.doesNotMatch(activity,/nativeTvFallback/,'Raw Android D-pad fallback must stay removed because providers treat LEFT\/RIGHT as seek');
  assert.match(activity,/querySelectorAll\('iframe'\)/,'Embed navigation must discover visible provider iframes');
  assert.match(activity,/zerostreams-tv-nav/,'Embed navigation must forward D-pad commands into the provider iframe instead of raw Android seek keys');
  assert.match(activity,/consumeDpadWake/,'D-pad mode must explicitly detect an idle wake-only press');
  assert.match(activity,/wakeProviderWithHover/,'D-pad wake must send native WebView pointer activity');
  assert.match(activity,/dispatchGenericMotionEvent/,'D-pad wake must use a native hover event so provider controls really reappear');
  assert.match(activity,/dpadWakeKey/,'The matching key-up after a wake-only press must also be consumed');
  assert.match(activity,/__zeroTvBackStep/,'TV Back must use the popup → controls → exit stage bridge');
  assert.match(activity,/"menu"\.equals\(stage\)/,'Native Back must preserve the provider popup stage');
  assert.match(activity,/"controls"\.equals\(stage\)/,'Native Back must preserve the controls-hide stage');
  assert.doesNotMatch(activity,/putBoolean\("playerMouse",true\)/,'Opening a movie must not overwrite the Settings-selected player mode');
  assert.doesNotMatch(mouse,/KEYCODE_MENU/,'Player mode switching must be Settings-only, not a Menu-button toggle');
  assert.match(mouse,/getBoolean\("playerMouse",true\)/,'Mouse remains the default when no player-mode preference exists');

  console.log('TV focus navigation and QR checks passed');
  console.log('Android TV D-pad idle wake uses a real native hover and consumes the wake key');
  console.log('Android TV Back preserves provider popup → controls → exit as separate stages');
  console.log('Mouse/D-pad mode is selected only from Settings');
}
run().catch(error=>{console.error(error);process.exitCode=1;});
