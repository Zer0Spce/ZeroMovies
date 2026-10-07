from pathlib import Path
import runpy

runpy.run_path('scripts/apply-1.9-palettes.py',run_name='__main__')

def read(p): return Path(p).read_text(encoding='utf-8')
def write(p,s): Path(p).write_text(s,encoding='utf-8')
def rep(s,a,b,label):
    n=s.count(a)
    if n!=1: raise RuntimeError(f'{label}: expected one match, got {n}')
    return s.replace(a,b,1)

# Tighten selected surfaces so every added palette passes the existing 4.5:1 text-contrast test.
p='windows/themes.cjs'; s=read(p)
for old,new,label in [
    ("selected:'#27583d'","selected:'#204833'",'Forest Moss contrast'),
    ("selected:'#155e59'","selected:'#104944'",'Cyber Mint contrast'),
    ("selected:'#304c62'","selected:'#283e50'",'Slate Ice contrast')]:
    s=rep(s,old,new,label)
write(p,s)

# Windows easter egg: premium gold mode rather than rainbow/orchid mode.
p='windows/ui/app.js'; s=read(p)
s=rep(s,"document.documentElement.dataset.theme=document.documentElement.dataset.egg==='true'?'orchid':state.settings.theme||'dark';","document.documentElement.dataset.theme=state.settings.theme||'dark';",'Windows egg theme isolation')
write(p,s)

p='windows/ui/experience.js'; s=read(p)
old="function setEgg(value){egg=value;root.dataset.egg=String(egg);if(egg)root.dataset.theme='orchid';let exit=document.querySelector('#egg-exit');if(egg&&!exit){exit=document.createElement('button');exit.id='egg-exit';exit.textContent='Exit Easter Egg';exit.onclick=()=>setEgg(false);document.body.append(exit);}if(!egg){exit?.remove();presses=0;applyTheme();}}"
new="function goldenSparkles(on){let layer=document.querySelector('#egg-sparkles');if(!on){layer?.remove();return;}if(layer)return;layer=document.createElement('div');layer.id='egg-sparkles';layer.setAttribute('aria-hidden','true');for(let i=0;i<24;i++){const star=document.createElement('span');star.className='egg-sparkle';star.textContent=i%4===0?'✦':i%3===0?'⋆':'✧';star.style.setProperty('--x',((i*37+11)%96)+'vw');star.style.setProperty('--y',((i*53+7)%92)+'vh');star.style.setProperty('--delay',(-((i*0.31)%4)).toFixed(2)+'s');star.style.setProperty('--duration',(2.4+(i%6)*0.37).toFixed(2)+'s');star.style.setProperty('--size',(10+(i%5)*4)+'px');layer.append(star);}document.body.append(layer);}function setEgg(value){egg=value;root.dataset.egg=String(egg);goldenSparkles(egg);let exit=document.querySelector('#egg-exit');if(egg&&!exit){exit=document.createElement('button');exit.id='egg-exit';exit.textContent='Exit Golden Mode';exit.onclick=()=>setEgg(false);document.body.append(exit);}if(!egg){exit?.remove();presses=0;}applyTheme();}"
s=rep(s,old,new,'Windows golden egg behavior')
s=rep(s,"if(++presses===10){setEgg(true);toast('Color mode activated');}","if(++presses===10){setEgg(true);toast('Golden mode activated ✦');}",'Windows golden egg toast')
write(p,s)

p='windows/ui/style.css'; s=read(p)
s += r'''

/* 1.9 Golden ZeroPlay easter egg */
[data-egg="true"]{--bg:#100c03!important;--surface:#211807!important;--sidebar:#171005!important;--card:#2b200a!important;--button:#37290d!important;--ink:#fff8dc!important;--muted:#d7c58d!important;--dialog:#211807!important;--mint:#ffd76a!important;--focus:#ffe9a6!important;--selected:#4a3510!important;--highlight:#fff0a8!important}
[data-egg="true"] aside{background:linear-gradient(160deg,#120d03,#2a1d06 48%,#171005)!important;animation:golden-shimmer 3.8s ease-in-out infinite alternate!important;box-shadow:inset -2px 0 0 #ffd76a66,10px 0 45px #b6780018}
[data-egg="true"] .brand,[data-egg="true"] .brand span{background:linear-gradient(100deg,#b77a16,#ffd76a 38%,#fff4b5 52%,#d99a27 74%,#ffd76a);background-size:220% auto;background-clip:text;-webkit-background-clip:text;color:transparent!important;animation:gold-logo 3.2s linear infinite!important;text-shadow:0 0 20px #ffd76a24}
[data-egg="true"] button:focus-visible,[data-egg="true"] .card:focus-visible{border-color:#ffe9a6!important;box-shadow:0 0 0 2px #ffd76a55,0 0 26px #ffd76a44!important}
[data-egg="true"] button.primary{background:linear-gradient(135deg,#b97916,#ffd76a 52%,#f1b93f)!important;color:#1b1202!important;border-color:#ffe9a6!important}
[data-egg="true"] #egg-exit{background:linear-gradient(135deg,#b97916,#ffd76a)!important;color:#1b1202!important;border-color:#fff0a8!important;box-shadow:0 6px 30px #ffd76a35}
#egg-sparkles{position:fixed;inset:0;z-index:55;pointer-events:none;overflow:hidden}.egg-sparkle{position:absolute;left:var(--x);top:var(--y);font-size:var(--size);color:#ffd76a;text-shadow:0 0 7px #fff0a8,0 0 18px #d98d16;opacity:.35;animation:gold-sparkle var(--duration) ease-in-out var(--delay) infinite;transform-origin:center}
@keyframes gold-sparkle{0%,100%{opacity:.16;transform:translateY(5px) scale(.65) rotate(-12deg)}45%{opacity:1;transform:translateY(-8px) scale(1.18) rotate(12deg)}70%{opacity:.48;transform:translateY(-3px) scale(.85) rotate(4deg)}}
@keyframes golden-shimmer{from{box-shadow:inset -2px 0 0 #b9791666,10px 0 38px #b6780012}to{box-shadow:inset -3px 0 0 #ffe9a6aa,12px 0 55px #ffd76a24}}
@keyframes gold-logo{0%{background-position:0% center}100%{background-position:220% center}}
'''
write(p,s)

# Android / Android TV golden mode. The regular Gold theme remains a normal selectable palette;
# goldenegg is hidden and exists only for the 10-click easter egg.
p='app/src/main/java/com/zerostreams/app/MainActivity.java'; s=read(p)
s=rep(s,'palettes.put("mocha",new String[]{"#15100d","#2b211b","#fff8f0","#d3c0b0","#d9a273"});String[] colors=','palettes.put("mocha",new String[]{"#15100d","#2b211b","#fff8f0","#d3c0b0","#d9a273"});palettes.put("goldenegg",new String[]{"#100c03","#211807","#fff8dc","#d7c58d","#ffd76a"});String[] colors=','Hidden Android golden palette')
s=rep(s,'applyPalette(eggMode?"orchid":name);','applyPalette(eggMode?"goldenegg":name);','Android egg palette routing')
s=rep(s,'private boolean eggMode;private android.animation.ValueAnimator eggAnimation;private Button eggExit;','private boolean eggMode;private android.animation.ValueAnimator eggAnimation;private Button eggExit;private final List<TextView> eggSparkles=new ArrayList<>();','Android sparkle state')
old='void easterEgg(){if(eggMode){exitEgg();return;}if(++logoPresses!=10)return;eggMode=true;switchPalette("orchid");eggExit=button("Exit Easter Egg",this::exitEgg);FrameLayout root=(FrameLayout)getWindow().getDecorView().findViewById(android.R.id.content);FrameLayout.LayoutParams layout=new FrameLayout.LayoutParams(-2,dp(44),Gravity.BOTTOM|Gravity.LEFT);layout.setMargins(dp(12),0,0,dp(BuildConfig.TV?12:64));root.addView(eggExit,layout);eggAnimation=android.animation.ValueAnimator.ofFloat(.85f,1f);eggAnimation.setDuration(2600);eggAnimation.setRepeatCount(android.animation.ValueAnimator.INFINITE);eggAnimation.setRepeatMode(android.animation.ValueAnimator.REVERSE);eggAnimation.addUpdateListener(a->{if(SystemClock.elapsedRealtime()-eggPaint<500)return;eggPaint=SystemClock.elapsedRealtime();float f=(float)a.getAnimatedValue();if(eggExit!=null)eggExit.setAlpha(f);ACCENT=(int)new android.animation.ArgbEvaluator().evaluate((f-.85f)/.15f,0xFF9FECFF,0xFFEFB3DC);if(eggLogo!=null)eggLogo.setTextColor(ACCENT);if(sidebar!=null){if(eggSidebar==null){eggSidebar=new GradientDrawable(GradientDrawable.Orientation.TOP_BOTTOM,new int[]{0xFF242150,0xFF351B3E,0xFF102D3F});sidebar.setBackground(eggSidebar);}eggSidebar.setStroke(dp(2),ACCENT);}View focus=getCurrentFocus();if(focus instanceof Button)focus.setBackground(shape(SURFACE,ACCENT));});if(prefs.getBoolean("uiAnimations",true))eggAnimation.start();message("Color mode activated");}\n    void exitEgg(){eggMode=false;logoPresses=0;if(eggAnimation!=null){eggAnimation.cancel();eggAnimation=null;}if(eggExit!=null&&eggExit.getParent() instanceof ViewGroup)((ViewGroup)eggExit.getParent()).removeView(eggExit);eggExit=null;eggSidebar=null;switchPalette(prefs.getString("theme","dark"));if(sidebar!=null)sidebar.setBackground(shape(SURFACE,0));if(eggLogo!=null)eggLogo.setTextColor(INK);}'
new='void addGoldenSparkles(FrameLayout root){for(TextView sparkle:eggSparkles)if(sparkle.getParent() instanceof ViewGroup)((ViewGroup)sparkle.getParent()).removeView(sparkle);eggSparkles.clear();int width=Math.max(dp(320),getResources().getDisplayMetrics().widthPixels),height=Math.max(dp(480),getResources().getDisplayMetrics().heightPixels);String[] glyphs={"✦","✧","⋆"};int[] golds={0xFFFFD76A,0xFFFFE9A6,0xFFE8B43D};for(int i=0;i<18;i++){TextView sparkle=text(glyphs[i%glyphs.length],12+(i%5)*3,golds[i%golds.length]);sparkle.setAlpha(.55f);sparkle.setShadowLayer(dp(5),0,0,0x99FFD76A);FrameLayout.LayoutParams sp=new FrameLayout.LayoutParams(-2,-2,Gravity.TOP|Gravity.LEFT);sp.leftMargin=(i*173+dp(17))%Math.max(1,width-dp(40));sp.topMargin=(i*257+dp(29))%Math.max(1,height-dp(80));root.addView(sparkle,sp);eggSparkles.add(sparkle);}}\n    void easterEgg(){if(eggMode){exitEgg();return;}if(++logoPresses!=10)return;eggMode=true;switchPalette("goldenegg");eggExit=button("Exit Golden Mode",this::exitEgg);FrameLayout root=(FrameLayout)getWindow().getDecorView().findViewById(android.R.id.content);addGoldenSparkles(root);FrameLayout.LayoutParams layout=new FrameLayout.LayoutParams(-2,dp(44),Gravity.BOTTOM|Gravity.LEFT);layout.setMargins(dp(12),0,0,dp(BuildConfig.TV?12:64));root.addView(eggExit,layout);eggAnimation=android.animation.ValueAnimator.ofFloat(0f,1f);eggAnimation.setDuration(3200);eggAnimation.setRepeatCount(android.animation.ValueAnimator.INFINITE);eggAnimation.setRepeatMode(android.animation.ValueAnimator.REVERSE);eggAnimation.addUpdateListener(a->{if(SystemClock.elapsedRealtime()-eggPaint<90)return;eggPaint=SystemClock.elapsedRealtime();float f=(float)a.getAnimatedValue();ACCENT=(int)new android.animation.ArgbEvaluator().evaluate(f,0xFFFFC94D,0xFFFFE9A6);if(eggExit!=null){eggExit.setAlpha(.86f+.14f*f);eggExit.setBackground(shape(0xFFFFD76A,0xFFFFF0A8));eggExit.setTextColor(0xFF1B1202);}if(eggLogo!=null){eggLogo.setTextColor(ACCENT);eggLogo.setShadowLayer(dp(6),0,0,0x66FFD76A);}if(sidebar!=null){if(eggSidebar==null){eggSidebar=new GradientDrawable(GradientDrawable.Orientation.TOP_BOTTOM,new int[]{0xFF120D03,0xFF2A1D06,0xFF171005});sidebar.setBackground(eggSidebar);}eggSidebar.setStroke(dp(2),ACCENT);}long now=SystemClock.elapsedRealtime();for(int i=0;i<eggSparkles.size();i++){TextView sparkle=eggSparkles.get(i);float wave=(float)(.25+.75*Math.abs(Math.sin(now/650.0+i*.73)));sparkle.setAlpha(wave);sparkle.setScaleX(.72f+.38f*wave);sparkle.setScaleY(.72f+.38f*wave);sparkle.setRotation((now/38f+i*19)%360);}View focus=getCurrentFocus();if(focus instanceof Button)focus.setBackground(shape(SURFACE,ACCENT));});if(prefs.getBoolean("uiAnimations",true))eggAnimation.start();else for(TextView sparkle:eggSparkles)sparkle.setAlpha(.75f);message("Golden mode activated ✦");}\n    void exitEgg(){eggMode=false;logoPresses=0;if(eggAnimation!=null){eggAnimation.cancel();eggAnimation=null;}if(eggExit!=null&&eggExit.getParent() instanceof ViewGroup)((ViewGroup)eggExit.getParent()).removeView(eggExit);eggExit=null;for(TextView sparkle:eggSparkles)if(sparkle.getParent() instanceof ViewGroup)((ViewGroup)sparkle.getParent()).removeView(sparkle);eggSparkles.clear();eggSidebar=null;if(eggLogo!=null)eggLogo.setShadowLayer(0,0,0,Color.TRANSPARENT);switchPalette(prefs.getString("theme","dark"));if(sidebar!=null)sidebar.setBackground(shape(SURFACE,0));if(eggLogo!=null)eggLogo.setTextColor(INK);}'
s=rep(s,old,new,'Android golden egg')
write(p,s)

print('Expanded palettes + Golden ZeroPlay easter egg applied')
