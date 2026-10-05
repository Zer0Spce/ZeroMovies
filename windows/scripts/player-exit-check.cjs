const {JSDOM}=require('jsdom'),fs=require('node:fs'),assert=require('node:assert/strict');
const dom=new JSDOM('<button aria-label="Go back" id="back">Back</button><button id="play">Play</button>',{url:'https://vidstuck.xyz/embed/movie/299534',runScripts:'outside-only'}),w=dom.window;let exits=0,plays=0;
w.document.getElementById('play').onclick=()=>plays++;w.addEventListener('message',e=>{if(e.data?.type==='zeromovies-player-exit')exits++;});w.eval(fs.readFileSync('assets/player-exit.js','utf8'));w.document.getElementById('back').click();w.document.getElementById('play').click();
setTimeout(()=>{try{assert.equal(exits,1);assert.equal(plays,1);console.log('Embedded labelled Back exits; playback controls remain functional');}finally{w.close();}},40);
