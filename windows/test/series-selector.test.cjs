const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'..','ui','app.js'),'utf8');
test('Windows series selector is only rendered in title details',()=>{
  assert.equal((source.match(/\$\{episodePicker\}/g)||[]).length,1);
  assert.match(source,/const episodePicker=item\.type==='tv'/);
  assert.match(source,/\$\{episodePicker\}<p>\$\{escape\(genres\)\}/);
  const hero=source.slice(source.indexOf('function hero(){'),source.indexOf('function watchlistHome(){'));
  assert.doesNotMatch(hero,/episodePicker/);
});
test('Windows Watch Now consumes selected season and episode',()=>{
  assert.match(source,/item\?\.type==='tv'/);
  assert.match(source,/Number\(\$\('#season'\)\?\.value\)/);
  assert.match(source,/Number\(\$\('#episode'\)\?\.value\)/);
  assert.doesNotMatch(source,/data-action=\?"play-episode/);
});
