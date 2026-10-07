from pathlib import Path

path = Path('app/src/main/java/com/zerostreams/app/MainActivity.java')
text = path.read_text(encoding='utf-8')

replacements = {
    'names.put("dark","Default")': 'names.put("dark","Zero Dark")',
    'names.put("light","Light")': 'names.put("light","Zero Light")',
    'names.put("ocean","Palette 10 · Blue & Green")': 'names.put("ocean","Ocean")',
    'names.put("orchid","Palette 4 · Blue, Purple & Pink")': 'names.put("orchid","Orchid")',
    'names.put("sunset","Palette 5 · Blue, Yellow & Orange")': 'names.put("sunset","Sunset")',
    'return names.containsKey(id)?names.get(id):"Default"': 'return names.containsKey(id)?names.get(id):"Zero Dark"',
    'String[] labels={"Default","Light","Palette 10 · Blue & Green","Palette 4 · Blue, Purple & Pink","Palette 5 · Blue, Yellow & Orange","Midnight Blue","Ember Glow","Forest Moss","Rose Noir","Amethyst","Cyber Mint","Cobalt Sky","Golden Hour","Coral Night","Aurora","Slate Ice","Mocha"};': 'String[] labels={"Zero Dark","Zero Light","Ocean","Orchid","Sunset","Midnight Blue","Ember Glow","Forest Moss","Rose Noir","Amethyst","Cyber Mint","Cobalt Sky","Golden Hour","Coral Night","Aurora","Slate Ice","Mocha"};'
}

for old, new in replacements.items():
    if old not in text:
        raise SystemExit(f'Missing expected source text: {old}')
    text = text.replace(old, new, 1)

path.write_text(text, encoding='utf-8')
print('Theme names cleaned')
