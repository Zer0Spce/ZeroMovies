from pathlib import Path

path = Path('app/src/main/java/com/zerostreams/app/MainActivity.java')
text = path.read_text(encoding='utf-8')
replacements = {
    'dp(classicLayout()?(BuildConfig.TV?150:132):(BuildConfig.TV?260:220))': 'dp((classicLayout()||googleLayout())?(BuildConfig.TV?150:132):(BuildConfig.TV?260:220))',
    'int columns=BuildConfig.TV?(classicLayout()?5:3):(getResources().getConfiguration().screenWidthDp>=600?4:2);': 'int columns=BuildConfig.TV?((classicLayout()||googleLayout())?5:3):(getResources().getConfiguration().screenWidthDp>=600?4:2);',
    'new PosterFrame(this,classicLayout()?1.5f:9f/16f)': 'new PosterFrame(this,(classicLayout()||googleLayout())?1.5f:9f/16f)',
    'String tileArt=classicLayout()?item.poster:item.raw.optString("backdrop",item.poster);': 'String tileArt=(classicLayout()||googleLayout())?item.poster:item.raw.optString("backdrop",item.poster);',
}
for old, new in replacements.items():
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'Expected exactly one match for {old!r}, found {count}')
    text = text.replace(old, new, 1)
path.write_text(text, encoding='utf-8')
print('Patched Modern UI to use vertical TMDB posters like Native UI')
