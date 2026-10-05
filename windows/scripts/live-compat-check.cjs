const {JSDOM}=require('jsdom'),fs=require('fs'),assert=require('assert/strict');const dom=new JSDOM('',{runScripts:'outside-only'});dom.window.TextDecoder=TextDecoder;dom.window.TextEncoder=TextEncoder;dom.window.eval(fs.readFileSync('ui/dash-compat.js','utf8'));const normalize=dom.window.zeroDashCompat;
const fixture=value=>new TextEncoder().encode(`<MPD xmlns="urn:mpeg:dash:schema:mpd:2011"><Period><AdaptationSet><AudioChannelConfiguration schemeIdUri="urn:mpeg:dash:23003:3:audio_channel_configuration:2011" value="${value}"/></AdaptationSet></Period></MPD>`);
for(const count of ['1','2','6','8','24']){const data=fixture(count);assert.equal(normalize(data),data);}
for(const count of ['1080','0','junk'])assert.ok(!new TextDecoder().decode(normalize(fixture(count))).includes('AudioChannelConfiguration'));
const other=new TextEncoder().encode('<MPD><AudioChannelConfiguration schemeIdUri="urn:dolby" value="1080"/></MPD>');assert.equal(normalize(other),other);
const media=new Uint8Array([1,2,3]);assert.equal(normalize(media),media);dom.window.close();console.log('Invalid ZTE audio count corrected; valid multichannel layouts and other schemes preserved');
