const test=require('node:test'),assert=require('node:assert/strict'),{themes}=require('../themes.cjs');
function luminance(hex){const c=hex.slice(1).match(/../g).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return c[0]*.2126+c[1]*.7152+c[2]*.0722;}
function contrast(a,b){const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
test('All themes keep primary and secondary text readable across surfaces',()=>{for(const theme of Object.values(themes))for(const surface of ['bg','surface','sidebar','card','button','selected','dialog'])for(const text of ['ink','muted'])assert.ok(contrast(theme[text],theme[surface])>=4.5,theme.name+' '+text+' on '+surface);});
test('All themes have readable accent-button text and visible focus',()=>{for(const theme of Object.values(themes)){assert.ok(contrast(theme.bg,theme.accent)>=4.5,theme.name+' accent text');assert.ok(contrast(theme.focus,theme.button)>=3,theme.name+' focus');}});
