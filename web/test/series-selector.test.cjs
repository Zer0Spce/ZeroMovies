const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'..','public','app.js'),'utf8');
test('series details keep season and episode selectors separate from Watch Now',()=>{
  assert.match(source,/class=\\?"episode-picker/);
  assert.match(source,/id=\\?"season/);
  assert.match(source,/id=\\?"episode/);
  assert.doesNotMatch(source,/data-action=\\?"play-episode/);
});
test('Watch Now uses the selected season and episode for TV details',()=>{
  assert.match(source,/item\?\.type==='tv'/);
  assert.match(source,/Number\(\$\('#season'\)\?\.value\)/);
  assert.match(source,/Number\(\$\('#episode'\)\?\.value\)/);
  assert.match(source,/ep=\{season,episode\}/);
});
