from pathlib import Path
import re


def read(path):
    return Path(path).read_text(encoding='utf-8')


def write(path, text):
    Path(path).write_text(text, encoding='utf-8')


def once(path, old, new):
    text=read(path); count=text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected 1 exact match, found {count}: {old[:160]!r}')
    write(path, text.replace(old,new,1))


def regex_once(path, pattern, replacement):
    text=read(path); changed,count=re.subn(pattern,replacement,text,count=1,flags=re.S)
    if count != 1:
        raise SystemExit(f'{path}: expected 1 regex match, found {count}: {pattern[:160]!r}')
    write(path,changed)


main='app/src/main/java/com/zerostreams/app/MainActivity.java'

# Keep the stable internal ids for existing installs, but rename the product-facing layouts.
once(main,
'    ScrollView layoutRailScroll;Button layoutMenu;boolean railExpanded;final Map<Button,String> layoutRailButtons=new LinkedHashMap<>();',
'''    ScrollView layoutRailScroll;Button layoutMenu;boolean railExpanded;final Map<Button,String> layoutRailButtons=new LinkedHashMap<>();
    final Map<Button,String> modernTabs=new LinkedHashMap<>();
    int alphaColor(int color,int alpha){return (color&0x00FFFFFF)|(alpha<<24);}
    GradientDrawable pill(int color,int border){GradientDrawable d=new GradientDrawable();d.setColor(color);d.setCornerRadius(dp(30));if(border!=0)d.setStroke(dp(2),border);paletteShapes.put(d,color);return d;}
    String layoutDisplay(String id){return id.equals("youtube")?"Clean UI · Default":id.equals("google")?"Modern UI":"Classic · Original";}
    String themeDisplay(String id){return id.equals("light")?"Light":id.equals("ocean")?"Palette 10 · Blue & Green":id.equals("orchid")?"Palette 4 · Blue, Purple & Pink":id.equals("sunset")?"Palette 5 · Blue, Yellow & Orange":"Default";}
    interface ChoiceHandler{void choose(String value);}
    void showChoicePicker(String title,String[] ids,String[] labels,String current,ChoiceHandler handler){
        LinearLayout choices=column();choices.setPadding(dp(12),dp(8),dp(12),dp(8));final AlertDialog[] dialog=new AlertDialog[1];final Button[] selected=new Button[1];
        for(int i=0;i<ids.length;i++){final String value=ids[i];final boolean checked=value.equals(current);Button row=button((checked?"✓  ":"   ")+labels[i],()->{handler.choose(value);if(dialog[0]!=null)dialog[0].dismiss();});row.setGravity(Gravity.CENTER_VERTICAL|Gravity.START);row.setTextSize(BuildConfig.TV?17:14);row.setPadding(dp(18),dp(8),dp(18),dp(8));row.setBackground(pill(checked?alphaColor(ACCENT,0x32):alphaColor(SURFACE,0xD8),checked?ACCENT:0));row.setOnFocusChangeListener((v,f)->{row.setTextColor(INK);row.setBackground(pill(f?alphaColor(SURFACE,0xF4):checked?alphaColor(ACCENT,0x32):alphaColor(SURFACE,0xD8),f?ACCENT:checked?ACCENT:0));if(f&&BuildConfig.TV)row.animate().scaleX(1.015f).scaleY(1.015f).setDuration(100).start();else row.animate().scaleX(1f).scaleY(1f).setDuration(100).start();});LinearLayout.LayoutParams rp=new LinearLayout.LayoutParams(-1,dp(BuildConfig.TV?56:50));rp.setMargins(0,0,0,dp(7));choices.addView(row,rp);if(checked)selected[0]=row;}
        dialog[0]=new AlertDialog.Builder(this).setTitle(title).setView(choices).setNegativeButton("Close",null).create();dialog[0].setOnShowListener(d->{dialog[0].getWindow().setBackgroundDrawable(shape(BG,0));if(BuildConfig.TV&&selected[0]!=null)selected[0].post(selected[0]::requestFocus);});dialog[0].show();
    }
    void layoutPicker(Button field){String[] ids={"youtube","google","classic"};String[] labels={"Clean UI · Default","Modern UI","Classic · Original"};showChoicePicker("Choose UI layout",ids,labels,layoutStyle(),value->{if(value.equals(layoutStyle()))return;prefs.edit().putString("uiLayout",value).commit();field.setText(layoutDisplay(value)+"  ▾");stopPreview();if(appearanceDialog!=null)appearanceDialog.dismiss();recreate();});}
    void themePicker(Button field){String[] ids={"dark","light","ocean","orchid","sunset"};String[] labels={"Default","Light","Palette 10 · Blue & Green","Palette 4 · Blue, Purple & Pink","Palette 5 · Blue, Yellow & Orange"};String current=prefs.getString("theme","dark");showChoicePicker("Choose theme",ids,labels,current,value->{if(value.equals(prefs.getString("theme","dark")))return;prefs.edit().putString("theme",value).apply();field.setText(themeDisplay(value)+"  ▾");switchPalette(value);});}
    void styleModernTab(Button b,String tab,boolean focused){boolean active=tab.equals(category)||tab.equals("Categories")&&category.equals("Genre");int fill=active?alphaColor(INK,0xE8):alphaColor(SURFACE,focused?0xC8:0x78);int border=focused?ACCENT:active?alphaColor(INK,0x66):0;b.setTextColor(active?BG:focused?INK:MUTED);b.setBackground(pill(fill,border));}
    void refreshModernTabs(){if(!googleLayout())return;for(Map.Entry<Button,String> entry:modernTabs.entrySet())styleModernTab(entry.getKey(),entry.getValue(),entry.getKey().hasFocus());}
    Button modernTab(String tab,String label){Button b=button(label,()->layoutOpen(tab));b.setContentDescription(layoutLabel(tab));b.setTextSize(BuildConfig.TV?15:13);b.setPadding(dp(18),dp(5),dp(18),dp(5));modernTabs.put(b,tab);navigation.put(tab,b);b.setOnFocusChangeListener((v,f)->styleModernTab(b,tab,f));styleModernTab(b,tab,false);return b;}''')

# Modern navigation: translucent pill bar, Google-TV-style selected tab, plus the controls hidden with the normal TV header.
regex_once(main,
r'    void addGoogleNavigation\(LinearLayout body\)\{.*?\n\n    void focusSearch\(\)',
'''    void addGoogleNavigation(LinearLayout body){
        HorizontalScrollView top=new HorizontalScrollView(this);top.setHorizontalScrollBarEnabled(false);top.setContentDescription("Modern UI top navigation");top.setClipToOutline(true);top.setBackground(pill(alphaColor(SURFACE,0x88),alphaColor(INK,0x22)));top.setElevation(dp(6));
        LinearLayout row=new LinearLayout(this);row.setGravity(Gravity.CENTER_VERTICAL);row.setPadding(dp(12),dp(7),dp(12),dp(7));TextView brand=text("ZEROPLAY",BuildConfig.TV?16:14,INK);bold(brand);brand.setLetterSpacing(.07f);brand.setPadding(dp(10),0,dp(16),0);row.addView(brand,new LinearLayout.LayoutParams(-2,dp(46)));
        for(String tab:new String[]{"Search","Home","LiveTV","Movies","Series","IPTV","Live Sports","Downloads"}){String label=tab.equals("Home")?"For you":tab.equals("Series")?"Shows":layoutLabel(tab);Button b=modernTab(tab,label);LinearLayout.LayoutParams lp=new LinearLayout.LayoutParams(-2,dp(46));lp.setMargins(0,0,dp(7),0);row.addView(b,lp);}
        Button library=modernTab("Library","Library");LinearLayout.LayoutParams libp=new LinearLayout.LayoutParams(-2,dp(46));libp.setMargins(0,0,dp(10),0);row.addView(library,libp);
        if(BuildConfig.TV){Button settings=button("⚙",this::settings);settings.setContentDescription("Settings");settings.setTextSize(20);settings.setBackground(pill(alphaColor(SURFACE,0x78),0));settings.setOnFocusChangeListener((v,f)->settings.setBackground(pill(alphaColor(SURFACE,f?0xD8:0x78),f?ACCENT:0)));row.addView(settings,new LinearLayout.LayoutParams(dp(48),dp(46)));surpriseButton=button("🎲",this::surpriseMovie);surpriseButton.setContentDescription("Surprise me");surpriseButton.setTextSize(18);surpriseButton.setBackground(pill(alphaColor(SURFACE,0x78),0));surpriseButton.setOnFocusChangeListener((v,f)->surpriseButton.setBackground(pill(alphaColor(SURFACE,f?0xD8:0x78),f?ACCENT:0)));row.addView(surpriseButton,new LinearLayout.LayoutParams(dp(48),dp(46)));Button theme=button(lightTheme?"☾":"☀",this::toggleTheme);theme.setContentDescription("Toggle theme");theme.setTextSize(19);theme.setBackground(pill(alphaColor(SURFACE,0x78),0));theme.setOnFocusChangeListener((v,f)->theme.setBackground(pill(alphaColor(SURFACE,f?0xD8:0x78),f?ACCENT:0)));row.addView(theme,new LinearLayout.LayoutParams(dp(48),dp(46)));}
        top.addView(row);LinearLayout.LayoutParams tp=new LinearLayout.LayoutParams(-1,dp(BuildConfig.TV?64:58));tp.setMargins(dp(BuildConfig.TV?24:14),dp(BuildConfig.TV?14:8),dp(BuildConfig.TV?24:14),dp(8));body.addView(top,tp);refreshModernTabs();
    }

    void focusSearch()''')

# Hide the older TV header in Modern UI; its important controls live in the glass top navigation instead.
once(main,'body.addView(header);if(googleLayout())addGoogleNavigation(body);','if(!(googleLayout()&&BuildConfig.TV))body.addView(header);if(googleLayout())addGoogleNavigation(body);')

# Make Modern TV more immersive and keep the search field out of the way until Search is selected.
once(main,'content=column();content.setPadding(dp(BuildConfig.TV?30:20),dp(14),dp(20),dp(28));','content=column();content.setPadding(dp(BuildConfig.TV?(googleLayout()?16:30):20),dp(googleLayout()&&BuildConfig.TV?4:14),dp(googleLayout()&&BuildConfig.TV?16:20),dp(28));')
once(main,'body.addView(searchRow,qp);','body.addView(searchRow,qp);if(googleLayout()&&BuildConfig.TV&&!category.equals("Search"))searchRow.setVisibility(View.GONE);')
once(main,'    void focusSearch(){++surpriseVersion;','    void focusSearch(){if(googleLayout()&&BuildConfig.TV&&search!=null&&search.getParent() instanceof View)((View)search.getParent()).setVisibility(View.VISIBLE);++surpriseVersion;')
once(main,'category=tab;browsePage=1;search.setHint(', 'category=tab;if(googleLayout()&&BuildConfig.TV&&search!=null&&search.getParent() instanceof View)((View)search.getParent()).setVisibility(View.GONE);browsePage=1;search.setHint(')

# More vivid full-screen atmosphere behind Modern TV chrome.
once(main,'tvAtmosphere.setAlpha(googleLayout()?.5f:.35f);scene.addView(tvAtmosphere,new FrameLayout.LayoutParams(-1,-1));View veil=new View(this);veil.setBackgroundColor(tint(0xC8));', 'tvAtmosphere.setAlpha(googleLayout()?.76f:.35f);scene.addView(tvAtmosphere,new FrameLayout.LayoutParams(-1,-1));View veil=new View(this);veil.setBackgroundColor(googleLayout()?tint(0x88):tint(0xC8));')

# Refresh Modern pill selection whenever the active section changes.
once(main,'entry.getValue().setTextColor(active?ACCENT:MUTED);}\n        if(category.equals("Downloads"))', 'entry.getValue().setTextColor(active?ACCENT:MUTED);}refreshModernTabs();\n        if(category.equals("Downloads"))')

# Skip the separate clock strip on Modern TV so the hero starts immediately below the glass nav.
once(main,'    void homeTools(List<Catalog.Item> rows){\n        LinearLayout tools=', '    void homeTools(List<Catalog.Item> rows){\n        if(googleLayout()&&BuildConfig.TV)return;\n        LinearLayout tools=')

# Google-TV-inspired immersive Modern hero: larger backdrop, wider copy, no ranked side panel, tighter transition into rows.
once(main,
'        LinearLayout info=column();info.setPadding(dp(24),dp(24),dp(20),dp(20));FrameLayout.LayoutParams ip=new FrameLayout.LayoutParams(BuildConfig.TV?dp(440):-1,-2,Gravity.START|Gravity.BOTTOM);if(BuildConfig.TV)ip.rightMargin=dp(245);hero.addView(info,ip);\n        TextView eyebrow=text("TRENDING THIS WEEK",11,ACCENT);eyebrow.setLetterSpacing(.12f);info.addView(eyebrow);space(info,10);\n        TextView title=text("",BuildConfig.TV?37:29,INK);bold(title);title.setMaxLines(2);title.setEllipsize(TextUtils.TruncateAt.END);info.addView(title,new LinearLayout.LayoutParams(-1,dp(BuildConfig.TV?90:72)));space(info,8);TextView facts=text("",13,INK);info.addView(facts);space(info,10);\n        TextView description=text("",14,MUTED);description.setMaxLines(BuildConfig.TV?3:3);description.setEllipsize(TextUtils.TruncateAt.END);info.addView(description,new LinearLayout.LayoutParams(-1,dp(54)));space(info,16);',
'''        LinearLayout info=column();info.setPadding(dp(googleLayout()?36:24),dp(googleLayout()?34:24),dp(googleLayout()?30:20),dp(googleLayout()?34:20));FrameLayout.LayoutParams ip=new FrameLayout.LayoutParams(BuildConfig.TV?dp(googleLayout()?620:440):-1,-2,Gravity.START|Gravity.BOTTOM);if(BuildConfig.TV&&!googleLayout())ip.rightMargin=dp(245);hero.addView(info,ip);
        TextView eyebrow=text(googleLayout()?"FEATURED FOR YOU":"TRENDING THIS WEEK",11,googleLayout()?INK:ACCENT);eyebrow.setLetterSpacing(.12f);info.addView(eyebrow);space(info,10);
        TextView title=text("",BuildConfig.TV?(googleLayout()?50:37):googleLayout()?36:29,INK);bold(title);title.setMaxLines(2);title.setEllipsize(TextUtils.TruncateAt.END);info.addView(title,new LinearLayout.LayoutParams(-1,dp(BuildConfig.TV?(googleLayout()?118:90):googleLayout()?88:72)));space(info,8);TextView facts=text("",13,INK);info.addView(facts);space(info,10);
        TextView description=text("",googleLayout()?15:14,MUTED);description.setMaxLines(googleLayout()?2:3);description.setEllipsize(TextUtils.TruncateAt.END);info.addView(description,new LinearLayout.LayoutParams(-1,dp(googleLayout()?48:54)));space(info,16);''')
once(main,'if(BuildConfig.TV){ranks.setPadding(', 'if(BuildConfig.TV&&!googleLayout()){ranks.setPadding(')
once(main,'        content.addView(hero,new LinearLayout.LayoutParams(-1,dp(440)));space(content,24);', '        content.addView(hero,new LinearLayout.LayoutParams(-1,googleLayout()?dp(BuildConfig.TV?570:470):dp(440)));space(content,googleLayout()?8:24);')

# Replace the two problem Android Appearance spinners with remote-friendly visible choice controls.
regex_once(main,
r'panel\.addView\(text\("Appearance · UI layout",16,INK\)\);Spinner uiLayout=.*?space\(panel,16\);panel\.addView\(text\("UI Animations & Previews",16,INK\)\);',
'''panel.addView(text("Appearance · UI layout",16,INK));final Button uiLayout=button(layoutDisplay(layoutStyle())+"  ▾",()->{});uiLayout.setContentDescription("UI layout · "+layoutDisplay(layoutStyle()));uiLayout.setOnClickListener(v->layoutPicker(uiLayout));uiLayout.setGravity(Gravity.CENTER_VERTICAL|Gravity.START);panel.addView(uiLayout,new LinearLayout.LayoutParams(-1,dp(BuildConfig.TV?52:48)));panel.addView(text("Clean UI is the default. Modern UI uses an immersive glass top navigation. Layout is separate from your theme.",12,MUTED));space(panel,12);panel.addView(text("Appearance · Theme",16,INK));final Button theme=button(themeDisplay(prefs.getString("theme","dark"))+"  ▾",()->{});theme.setContentDescription("Theme · "+themeDisplay(prefs.getString("theme","dark")));theme.setOnClickListener(v->themePicker(theme));theme.setGravity(Gravity.CENTER_VERTICAL|Gravity.START);panel.addView(theme,new LinearLayout.LayoutParams(-1,dp(BuildConfig.TV?52:48)));space(panel,16);panel.addView(text("UI Animations & Previews",16,INK));''')

# Windows labels keep the old ids but show the new product names.
once('windows/ui/index.html','<option value="youtube">YouTube TV · Default</option><option value="google">Google TV</option><option value="classic">Classic · Original</option>','<option value="youtube">Clean UI · Default</option><option value="google">Modern UI</option><option value="classic">Classic · Original</option>')

# Append Modern UI overrides rather than destabilizing Classic/Clean CSS.
css='windows/ui/layouts.css'
text=read(css)
marker='/* 1.8.2 Modern UI glass / immersive hero */'
if marker in text:
    raise SystemExit('windows/ui/layouts.css: 1.8.2 override already present')
text += r'''

/* 1.8.2 Modern UI glass / immersive hero */
:root[data-layout="google"] aside{
  position:sticky;top:12px;width:calc(100% - 56px);height:68px;margin:12px 28px 0;
  padding:8px 14px;border:1px solid color-mix(in srgb,var(--ink) 12%,transparent);
  border-radius:34px;background:color-mix(in srgb,var(--surface) 68%,transparent);
  box-shadow:0 12px 38px #0003;backdrop-filter:blur(24px) saturate(1.3);-webkit-backdrop-filter:blur(24px) saturate(1.3);
}
:root[data-layout="google"] aside .brand{margin:0 14px 0 4px;font-size:16px;letter-spacing:.04em}
:root[data-layout="google"] aside button{padding:10px 17px;border:1px solid transparent;background:transparent;color:color-mix(in srgb,var(--ink) 78%,transparent);transition:background .16s,color .16s,border-color .16s,transform .16s,box-shadow .16s}
:root[data-layout="google"] aside button:hover{background:color-mix(in srgb,var(--surface) 82%,transparent)}
:root[data-layout="google"] aside button.active{background:color-mix(in srgb,var(--ink) 90%,transparent);color:var(--bg);border-color:color-mix(in srgb,var(--ink) 28%,transparent);box-shadow:0 8px 24px #0003,inset 0 0 0 1px #ffffff18}
:root[data-layout="google"] aside button:focus-visible{outline:2px solid color-mix(in srgb,var(--ink) 88%,transparent);outline-offset:2px;background:color-mix(in srgb,var(--surface) 90%,transparent);color:var(--ink);transform:scale(1.025)}
:root[data-layout="google"] aside button.active:focus-visible{background:var(--ink);color:var(--bg)}
:root[data-layout="google"] main{margin:0;padding:14px 28px 34px;max-width:none}
:root[data-layout="google"] main>header{margin:0 0 10px;min-height:46px}
:root[data-layout="google"] #ui-atmosphere img{opacity:.28;filter:blur(30px);transform:scale(1.06)}
:root[data-layout="google"] .hero{
  width:calc(100% + 56px);height:clamp(500px,66vh,720px);margin-left:-28px;margin-right:-28px;margin-bottom:0;
  border-radius:0;background:var(--bg);box-shadow:none;
}
:root[data-layout="google"] .hero-art{opacity:.96;object-position:center 28%}
:root[data-layout="google"] .hero-shade{background:linear-gradient(90deg,color-mix(in srgb,var(--bg) 96%,transparent) 0%,color-mix(in srgb,var(--bg) 68%,transparent) 30%,transparent 72%),linear-gradient(0deg,var(--bg) 0%,color-mix(in srgb,var(--bg) 70%,transparent) 16%,transparent 58%)}
:root[data-layout="google"] .hero-content{width:min(760px,64%);padding:64px 52px 92px}
:root[data-layout="google"] .hero h2{font-size:clamp(46px,4.4vw,66px);line-height:1.02;max-height:none;margin:14px 0 12px;font-weight:500;letter-spacing:-.045em}
:root[data-layout="google"] .hero-content>p{height:auto;max-width:690px;font-size:16px;line-height:1.55;-webkit-line-clamp:2}
:root[data-layout="google"] .hero .eyebrow{color:color-mix(in srgb,var(--ink) 78%,transparent)}
:root[data-layout="google"] .hero .actions{margin-top:18px}
:root[data-layout="google"] .hero .actions button:not(.primary){background:color-mix(in srgb,var(--surface) 68%,transparent);backdrop-filter:blur(16px);border-color:#ffffff24}
:root[data-layout="google"] .hero-controls{margin-top:20px}
:root[data-layout="google"] .hero+.row-section{margin-top:-58px;position:relative;z-index:3;padding:0 4px}
:root[data-layout="google"] .row-section{position:relative;z-index:2}
:root[data-layout="google"] .cards{padding-top:7px}
:root[data-layout="google"] .card:focus-visible{outline:3px solid color-mix(in srgb,var(--ink) 88%,transparent);outline-offset:4px;transform:scale(1.025)}
@media(max-width:760px){
  :root[data-layout="google"] aside{top:8px;width:calc(100% - 20px);height:60px;margin:8px 10px 0;padding:6px 9px;border-radius:30px}
  :root[data-layout="google"] main{padding:10px 12px 28px}
  :root[data-layout="google"] .hero{width:calc(100% + 24px);height:500px;margin-left:-12px;margin-right:-12px}
  :root[data-layout="google"] .hero-content{width:100%;padding:42px 24px 62px}
  :root[data-layout="google"] .hero h2{font-size:38px}
  :root[data-layout="google"] .hero+.row-section{margin-top:-28px}
}
'''
write(css,text)

print('Applied ZeroPlay 1.8.2 Clean/Modern UI first-pass patch.')
