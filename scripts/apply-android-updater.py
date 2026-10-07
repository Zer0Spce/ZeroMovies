from pathlib import Path
p=Path('app/src/main/java/com/zerostreams/app/MainActivity.java')
s=p.read_text()
repls=[
('    private SharedPreferences prefs;\n','    private SharedPreferences prefs;private AppUpdater updater;\n'),
('super.onCreate(state);applyPalette(prefs.getString("theme","dark"));','super.onCreate(state);updater=new AppUpdater(this,prefs);applyPalette(prefs.getString("theme","dark"));'),
('header.addView(surpriseButton,sp);Button theme=button(lightTheme?"☾":"☀",this::toggleTheme);', 'header.addView(surpriseButton,sp);Button updaterButton=button(BuildConfig.TV?"⇩ Update":"⇩",()->updater.check(true));updaterButton.setContentDescription("Check for ZeroPlay updates");updaterButton.setTextSize(BuildConfig.TV?13:19);updaterButton.setPadding(BuildConfig.TV?dp(10):0,0,BuildConfig.TV?dp(10):0,0);LinearLayout.LayoutParams up=new LinearLayout.LayoutParams(BuildConfig.TV?-2:dp(44),dp(40));up.setMargins(dp(8),0,0,0);header.addView(updaterButton,up);Button theme=button(lightTheme?"☾":"☀",this::toggleTheme);'),
('ready=true;load();if(BuildConfig.TV)(navigation.containsKey(category)?navigation.get(category):navigation.get(category.equals("Genre")?"Categories":"Home")).requestFocus();','ready=true;load();ui.postDelayed(()->updater.check(false),1800);if(BuildConfig.TV)(navigation.containsKey(category)?navigation.get(category):navigation.get(category.equals("Genre")?"Categories":"Home")).requestFocus();')
]
for old,new in repls:
    count=s.count(old)
    if count!=1: raise SystemExit(f'guard failed: expected one anchor, found {count}: {old[:80]}')
    s=s.replace(old,new,1)
p.write_text(s)
