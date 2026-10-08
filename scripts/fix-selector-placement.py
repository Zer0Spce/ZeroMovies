from pathlib import Path

app = Path('windows/ui/app.js')
source = app.read_text(encoding='utf-8')
hero = '</div></div>${episodePicker}<p>${escape(item.overview'
details = '</div></div><p>${escape(genres)}'
if hero not in source:
    raise SystemExit('Stray hero episodePicker reference not found')
if details not in source:
    raise SystemExit('Windows detail placement hook not found')
source = source.replace(hero, '</div></div><p>${escape(item.overview', 1)
source = source.replace(details, '</div></div>${episodePicker}<p>${escape(genres)}', 1)
if source.count('${episodePicker}') != 1:
    raise SystemExit('episodePicker must appear exactly once after repair')
app.write_text(source, encoding='utf-8')

test = Path('windows/test/series-selector.test.cjs')
test.write_text("""const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'..','ui','app.js'),'utf8');
test('Windows series selector is only rendered in title details',()=>{
  assert.equal((source.match(/\\$\\{episodePicker\\}/g)||[]).length,1);
  assert.match(source,/const episodePicker=item\.type==='tv'/);
  assert.match(source,/\\$\\{episodePicker\\}<p>\\$\\{escape\\(genres\\)\\}/);
  const hero=source.slice(source.indexOf('function hero(){'),source.indexOf('function watchlistHome(){'));
  assert.doesNotMatch(hero,/episodePicker/);
});
test('Windows Watch Now consumes selected season and episode',()=>{
  assert.match(source,/item\?\.type==='tv'/);
  assert.match(source,/Number\(\$\('#season'\)\?\.value\)/);
  assert.match(source,/Number\(\$\('#episode'\)\?\.value\)/);
  assert.doesNotMatch(source,/data-action=\\?\"play-episode/);
});
""", encoding='utf-8')

Path('scripts/fix-selector-placement.py').unlink()
Path('.github/workflows/run-selector-placement-fix.yml').unlink()
