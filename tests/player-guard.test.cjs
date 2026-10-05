const {JSDOM} = require('jsdom');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const guard = fs.readFileSync(process.env.ZERO_GUARD_PATH || 'qr-ad-filter.js', 'utf8');
const creative = '<h2>Confirm you\'re not a robot</h2><canvas width="420" height="420"></canvas><span style="border-radius:50%">21</span>';
function page(html, tv = false, gain = 1, setup = () => {}) {
  const dom = new JSDOM(html, {runScripts: 'outside-only', url: 'https://vidstuck.xyz/embed/movie/299534'});
  const w = dom.window;
  w.HTMLElement.prototype.getBoundingClientRect = function () {
    return this.dataset.large ? {width:1024,height:768,bottom:768} : {width:Number(this.getAttribute('width'))||0,height:Number(this.getAttribute('height'))||0,bottom:0};
  };
  w.__zeroBlockAds = true; w.__zeroTv = tv; w.__zeroGain = gain;
  setup(w);
  w.eval(guard);
  w.document.dispatchEvent(new w.Event('DOMContentLoaded'));
  return dom;
}
async function run() {
  let dom = page('<video id="movie"></video><div id="ad" data-large="1" style="background:white">'+creative+'</div><div class="plyr__controls"><button>Play</button></div>');
  assert.equal(dom.window.document.getElementById('ad').style.display, 'none');
  assert.ok(dom.window.document.getElementById('movie'));
  assert.equal(dom.window.document.querySelector('.plyr__controls').style.display, '');
  dom.window.close();
  dom = page('<video></video><div id="css-ad" data-large="1" style="position:fixed;background:white">Painted QR creative</div>');
  dom.window.__zeroDismissQrAd();
  assert.equal(dom.window.document.getElementById('css-ad').style.display,'none');
  dom.window.close();
  let graphs = 0, gainValue;
  const audioSetup = src => w => {
    const video = w.document.querySelector('video');
    Object.defineProperty(video, 'paused', {value:false});
    Object.defineProperty(video, 'currentSrc', {value:src});
    const node = () => ({connect(){}});
    w.AudioContext = class {
      constructor(){this.state='running';this.destination={};}
      resume(){return Promise.resolve();}
      createMediaElementSource(){graphs++;return node();}
      createGain(){const n=node();n.gain={set value(v){gainValue=v;}};return n;}
      createDynamicsCompressor(){const n=node();for(const key of ['threshold','knee','ratio','attack','release'])n[key]={value:0};return n;}
    };
  };
  dom = page('<video></video>', false, 2, audioSetup('https://cdn.other.example/movie.mp4'));
  await Promise.resolve();
  assert.equal(graphs,0,'Non-CORS streams must retain their original audio path');
  dom.window.close();
  dom = page('<video></video>', false, 2, audioSetup('blob:https://vidstuck.xyz/video'));
  await Promise.resolve();
  assert.equal(graphs,1);
  assert.equal(gainValue,2);
  dom.window.close();
  dom = page('<div id="check" data-large="1" style="background:white"><h2>Confirm you\'re not a robot</h2><input type="checkbox"></div>');
  assert.equal(dom.window.document.getElementById('check').style.display, '');
  dom.window.close();
  dom = page('<div id="check" data-large="1" style="background:white">'+creative+'<iframe src="https://challenges.cloudflare.com/turnstile"></iframe></div>');
  assert.equal(dom.window.document.getElementById('check').style.display, '');
  dom.window.close();
  dom = page('<iframe id="ad" src="https://unswung.gurlleviter.cyou/ad"></iframe><iframe id="player" src="https://vidstuck.xyz/embed/movie/299534"></iframe>');
  assert.equal(dom.window.document.getElementById('ad').style.display, 'none');
  assert.equal(dom.window.document.getElementById('player').style.display, '');
  dom.window.close();
  dom = page('<video></video>');
  dom.window.document.body.insertAdjacentHTML('beforeend','<div id="late" data-large="1" style="background:white">'+creative+'</div>');
  await new Promise(resolve => setTimeout(resolve, 500));
  assert.equal(dom.window.document.getElementById('late').style.display, 'none');
  dom.window.close();
  dom = page('<video id="movie"></video><div id="painted" data-large="1" style="background:white"><img width="420" height="420" alt="advertisement"></div>');
  dom.window.__zeroDismissQrAd();
  assert.equal(dom.window.document.getElementById('painted').style.display,'none','Native-confirmed QR ads can be painted images without DOM text');
  assert.ok(dom.window.document.getElementById('movie'));
  dom.window.close();
  dom = page('<div id="challenge" data-large="1" style="background:white"><img width="420" height="420"><iframe src="https://challenges.cloudflare.com/turnstile"></iframe></div>');
  dom.window.__zeroDismissQrAd();
  assert.equal(dom.window.document.getElementById('challenge').style.display,'');
  dom.window.close();
  dom = page('<video></video><div class="plyr__controls"><button>Pause</button></div>', true);
  const w = dom.window;
  let idle;
  const original = w.setTimeout;
  w.setTimeout = (fn,ms) => ms === 3000 ? (idle=fn,123) : original(fn,ms);
  w.__zeroRemoteActivity(); idle();
  assert.ok(w.document.documentElement.classList.contains('zero-player-idle'));
  assert.equal(w.getComputedStyle(w.document.querySelector('.plyr__controls')).visibility, 'hidden');
  w.__zeroRemoteActivity();
  assert.ok(!w.document.documentElement.classList.contains('zero-player-idle'));
  dom.window.close();
  for (const tv of [true,false]) {
    dom=page('<video id="movie"></video><nav width="900" height="50"><button>Episodes</button></nav><div class="plyr__controls" width="900" height="60"><button>Pause</button></div>',tv);
    const player=dom.window;
    player.__zeroBackRequest(1);
    await new Promise(resolve=>setTimeout(resolve,10));
    assert.deepEqual(JSON.parse(JSON.stringify(player.__zeroBackResult)),{token:1,handled:true});
    assert.equal(player.getComputedStyle(player.document.querySelector('nav')).visibility,'hidden');
    assert.equal(player.getComputedStyle(player.document.querySelector('video')).visibility,'visible');
    player.__zeroBackRequest(2);
    await new Promise(resolve=>setTimeout(resolve,10));
    assert.equal(player.__zeroBackResult.handled,false,'Second Back can return after controls are hidden');
    player.__zeroRemoteActivity();
    assert.equal(player.getComputedStyle(player.document.querySelector('nav')).visibility,'visible');
    dom.window.close();
  }
  dom=page('<iframe></iframe>');
  dom.window.__zeroBackRequest(3);
  await new Promise(resolve=>setTimeout(resolve,700));
  assert.equal(dom.window.__zeroBackResult.handled,true,'Unknown child state must keep playback open');
  dom.window.close();
  dom=page('<iframe id="child"></iframe>');
  const frame=dom.window.document.querySelector('iframe');
  frame.contentWindow.postMessage=data=>{
    if(data.type==='zerostreams-hide-controls')dom.window.dispatchEvent(new dom.window.MessageEvent('message',{
      source:frame.contentWindow,data:{type:'zerostreams-controls-hidden',request:data.request,handled:false}
    }));
  };
  dom.window.__zeroBackRequest(4);
  await new Promise(resolve=>setTimeout(resolve,10));
  assert.equal(dom.window.__zeroBackResult.handled,false,'Hidden embedded controls should allow return');
  dom.window.close();
  dom=page('<video id="movie"></video><img id="full-ad" data-large="1">');
  dom.window.__zeroDismissQrAd();
  assert.equal(dom.window.document.getElementById('full-ad').style.display,'none','Native-confirmed full-screen artwork needs no white wrapper');
  assert.equal(dom.window.document.getElementById('movie').style.display,'');
  dom.window.close();
  let frameDismissed=false;
  dom=page('<img data-large="1">',false,1,w=>{
    Object.defineProperty(w,'parent',{value:{postMessage:data=>{if(data.type==='zerostreams-timed-qr-ad')frameDismissed=true;}}});
  });
  dom.window.__zeroDismissQrAd();
  assert.equal(frameDismissed,true,'Native-confirmed ad-only child artwork should dismiss the whole frame');
  dom.window.close();
  console.log('QR ad removal, CAPTCHA preservation, playback preservation, late ads, remote activity and audio boost checks passed');
}
run().catch(error => { console.error(error); process.exitCode=1; });

