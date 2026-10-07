from pathlib import Path
p=Path('app/src/main/java/com/zerostreams/app/MainActivity.java')
s=p.read_text()
changes=[
('void settings(){stopPreview();LinearLayout panel=column();panel.setPadding(dp(20),dp(12),dp(20),dp(12));panel.addView(text("TMDB API key (v3) · online title search",14,INK));',
 'void settings(){stopPreview();LinearLayout panel=column();panel.setPadding(dp(BuildConfig.TV?28:20),dp(18),dp(BuildConfig.TV?28:20),dp(20));settingsHeading(panel,"GENERAL","Content & account");panel.addView(text("TMDB API key (v3)",14,INK));'),
('space(panel,12);Button panels=button("Homepage panels",this::homePanelSettings);',
 'space(panel,18);settingsHeading(panel,"HOME","Homepage customization");Button panels=button("Homepage panels",this::homePanelSettings);'),
('space(panel,12);panel.addView(text("Appearance · UI layout",16,INK));',
 'space(panel,20);settingsHeading(panel,"APPEARANCE","Layout & theme");panel.addView(text("UI layout",14,INK));'),
('space(panel,12);panel.addView(text("Appearance · Theme",16,INK));',
 'space(panel,12);panel.addView(text("Theme",14,INK));'),
('space(panel,16);panel.addView(text("UI Animations & Previews",16,INK));',
 'space(panel,20);settingsHeading(panel,"EXPERIENCE","Animations & previews");'),
('space(panel,16);Switch rawcastPlayback=new Switch(this);',
 'space(panel,20);settingsHeading(panel,"PLAYBACK & DOWNLOADS","Sources, subtitles & downloads");Switch rawcastPlayback=new Switch(this);'),
('space(panel,12);Switch ads=new Switch(this);',
 'space(panel,20);settingsHeading(panel,"PLAYER","Playback preferences");Switch ads=new Switch(this);'),
('panel.addView(text("Movie and series data by TMDB. Playback: VidStuck and VidSrc.sh.\\nZeroPlay · "+BuildConfig.VERSION_NAME,13,MUTED));',
 'space(panel,20);settingsHeading(panel,"ABOUT","ZeroPlay");panel.addView(text("Movie and series data by TMDB. Playback: VidStuck and VidSrc.sh.\\nZeroPlay · "+BuildConfig.VERSION_NAME,13,MUTED));')
]
for old,new in changes:
    n=s.count(old)
    if n!=1: raise SystemExit(f'guard failed {n}: {old[:90]}')
    s=s.replace(old,new,1)
anchor='    void homeWatchlist(int token){'
helper='''    void settingsHeading(LinearLayout panel,String title,String subtitle){\n        TextView label=text(title,11,ACCENT);bold(label);label.setLetterSpacing(.12f);panel.addView(label);\n        TextView sub=text(subtitle,BuildConfig.TV?15:14,INK);bold(sub);sub.setPadding(0,dp(3),0,dp(8));panel.addView(sub);\n        View divider=new View(this);divider.setBackgroundColor(alphaColor(MUTED,55));panel.addView(divider,new LinearLayout.LayoutParams(-1,dp(1)));space(panel,10);\n    }\n'''
if helper not in s:
    if s.count(anchor)!=1: raise SystemExit('helper anchor failed')
    s=s.replace(anchor,helper+anchor,1)
p.write_text(s)
