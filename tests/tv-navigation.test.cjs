const {JSDOM}=require('jsdom');
const fs=require('node:fs');
const assert=require('node:assert/strict');

const controller=fs.readFileSync('app/src/main/assets/tv-player-input.js','utf8');

function page(html){
  const dom=new JSDOM(html,{runScripts:'outside-only',url:'https://vidstuck.xyz/embed/movie/299534'});
  const w=dom.window;
  w.__zeroTv=true;
  w.HTMLElement.prototype.getBoundingClientRect=function(){
    const left=Number(this.dataset.x)||0,top=Number(this.dataset.y)||0,width=Number(this.dataset.w)||100,height=Number(this.dataset.h)||40;
    return {left,top,width,height,right:left+width,bottom:top+height};
  };
  w.HTMLElement.prototype.scrollIntoView=function(){};
  w.eval(controller);
  return dom;
}

const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));

async function run(){
  let dom=page('<video></video><div class="plyr__controls" data-y="650" data-w="1024" data-h="70"><button id="play" aria-label="Play" data-x="100" data-y="660">Play</button><button id="volume" aria-label="Volume" data-x="300" data-y="660">Volume</button><button id="subs" aria-label="Subtitles" data-x="500" data-y="660">Subtitles</button></div>');
  let w=dom.window;
  w.__zeroTvNavigate('right');
  assert.equal(w.document.activeElement.id,'play','First D-pad press should visibly focus the initial player control');
  assert.equal(w.document.getElementById('play').style.getPropertyValue('outline'),'2px solid #65e6cc','TV focus should use the slimmer clean teal ring');
  assert.equal(w.document.getElementById('play').style.getPropertyValue('outline-offset'),'2px');
  w.__zeroTvNavigate('right');
  assert.equal(w.document.activeElement.id,'volume','Second Right should move to the next real control');
  assert.match(w.document.getElementById('volume').style.getPropertyValue('box-shadow'),/101\s*,\s*230\s*,\s*204/,'Focused player control needs a clean teal glow');
  let clicks=0;w.document.getElementById('volume').onclick=()=>clicks++;
  w.__zeroTvNavigate('ok');assert.equal(clicks,1,'OK should activate only the highlighted control');
  dom.window.close();

  dom=page('<video></video><div class="plyr__controls" style="opacity:0;visibility:hidden;display:none" data-y="650" data-w="1024" data-h="70"><button id="play" aria-label="Play" data-x="100" data-y="660">Play</button><button id="volume" aria-label="Volume" data-x="300" data-y="660">Volume</button></div>');
  w=dom.window;
  const bar=w.document.querySelector('.plyr__controls');
  w.document.documentElement.classList.add('zero-player-idle');
  w.__zeroTvWake();
  assert.equal(w.getComputedStyle(bar).visibility,'visible','D-pad wake must restore provider controls');
  assert.notEqual(w.getComputedStyle(bar).display,'none','Wake must restore a display-none provider control bar');
  await wait(220);
  assert.equal(w.getComputedStyle(bar).visibility,'visible','Wake reinforcement must survive provider render ticks');
  w.__zeroTvNavigate('right');
  assert.equal(w.document.activeElement.id,'play','Navigation must resume after the controls are awake');
  dom.window.close();

  dom=page('<video></video><div id="host"></div>');
  w=dom.window;
  const shadow=w.document.getElementById('host').attachShadow({mode:'open'});
  shadow.innerHTML='<div class="plyr__controls" data-y="650" data-w="800" data-h="70"><button id="quality" aria-label="Quality" data-x="200" data-y="660">1080p</button><button id="sub" aria-label="Subtitles" data-x="400" data-y="660">CC</button></div>';
  w.__zeroTvNavigate('right');
  const quality=shadow.getElementById('quality');
  assert.equal(quality.style.getPropertyValue('outline'),'2px solid #65e6cc','Shadow-DOM controls must get the same slim focus ring');
  dom.window.close();

  dom=page('<video></video><button id="settings" aria-label="Settings" aria-expanded="true">Settings</button><div role="menu" data-w="240" data-h="180"><button>1080p</button></div>');
  w=dom.window;
  let closed=0;w.document.getElementById('settings').onclick=()=>{closed++;w.document.getElementById('settings').setAttribute('aria-expanded','false');w.document.querySelector('[role="menu"]').style.display='none';};
  w.__zeroTvBackRequest(1);await wait(20);
  assert.equal(w.__zeroBackResult.stage,'menu','Back must close a provider settings/quality menu before doing anything else');
  assert.equal(closed,1);
  dom.window.close();

  dom=page('<video></video><div class="plyr__controls" data-y="650" data-w="1024" data-h="70"><button aria-label="Play">Play</button></div>');
  w=dom.window;
  w.__zeroTvBackRequest(2);await wait(20);
  assert.equal(w.__zeroBackResult.stage,'controls','Back with visible player controls must hide controls, not exit the movie');
  w.__zeroTvBackRequest(3);await wait(20);
  assert.equal(w.__zeroBackResult.stage,'exit','Only Back after controls are already hidden may exit playback');
  dom.window.close();

  const activity=fs.readFileSync('app/src/main/java/com/zerostreams/app/BrowserPlayerActivity.java','utf8');
  const mouse=fs.readFileSync('app/src/main/java/com/zerostreams/app/TvMouse.java','utf8');
  assert.match(activity,/tv-player-input\.js/,'TV player must load the single input controller');
  assert.match(activity,/if\(window\.__zeroTvNavigate\)window\.__zeroTvNavigate/,'Native D-pad must route once through the top-level controller');
  assert.match(activity,/wakeDpadControls\(\)/,'D-pad mode must have a dedicated provider wake path');
  assert.match(activity,/ACTION_HOVER_MOVE/,'D-pad wake must restore the proven native WebView hover pulse');
  assert.match(activity,/dispatchGenericMotionEvent/,'D-pad wake must reach the provider as native hover activity');
  assert.doesNotMatch(activity,/consumeDpadWake/,'Timer-based D-pad wake interception must stay removed');
  assert.doesNotMatch(activity,/querySelectorAll\('iframe'\).*zerostreams-tv-nav/s,'Native Android must not guess the largest provider iframe');
  assert.doesNotMatch(activity,/mouse-back\.js/,'The obsolete competing Back/input script must not be injected');
  assert.match(activity,/__zeroTvBackRequest/,'Back must keep using the clean staged controller');
  assert.doesNotMatch(activity,/putBoolean\("playerMouse",true\)/,'Opening a movie must not overwrite the Settings-selected mode');
  assert.doesNotMatch(mouse,/KEYCODE_MENU/,'Mouse/D-pad switching must remain Settings-only');
  assert.match(mouse,/getBoolean\("playerMouse",true\)/,'Mouse remains the default if no preference exists');

  console.log('Android TV D-pad navigation remains intact');
  console.log('Hidden controls wake through native hover plus JS reinforcement');
  console.log('Slim focus ring and staged Back checks passed');
  console.log('Mouse mode implementation remains untouched');
}
run().catch(error=>{console.error(error);process.exitCode=1;});
