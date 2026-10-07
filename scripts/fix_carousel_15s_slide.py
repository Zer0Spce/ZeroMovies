from pathlib import Path

path = Path('app/src/main/java/com/zerostreams/app/MainActivity.java')
text = path.read_text(encoding='utf-8')

old = '''        LinearLayout indicators=new LinearLayout(this);List<Button> dots=new ArrayList<>();Runnable[] paint=new Runnable[1];
        Button previous=button("‹",()->{heroIndex=(heroIndex+picks.size()-1)%picks.size();paint[0].run();});indicators.addView(previous,new LinearLayout.LayoutParams(dp(36),dp(30)));
        for(int i=0;i<picks.size();i++){final int index=i;Button dot=button("•",()->{heroIndex=index;paint[0].run();});dot.setContentDescription("Featured title "+(i+1)+": "+picks.get(i).title);dots.add(dot);indicators.addView(dot,new LinearLayout.LayoutParams(dp(30),dp(30)));}
        indicators.addView(button("›",()->{heroIndex=(heroIndex+1)%picks.size();paint[0].run();}),new LinearLayout.LayoutParams(dp(36),dp(30)));info.addView(indicators);
'''
new = '''        LinearLayout indicators=new LinearLayout(this);List<Button> dots=new ArrayList<>();Runnable[] paint=new Runnable[1];Runnable[] slideNext=new Runnable[1];Runnable[] slidePrevious=new Runnable[1];
        Button previous=button("‹",()->slidePrevious[0].run());indicators.addView(previous,new LinearLayout.LayoutParams(dp(36),dp(30)));
        for(int i=0;i<picks.size();i++){final int index=i;Button dot=button("•",()->{if(index==heroIndex)return;heroIndex=index;paint[0].run();});dot.setContentDescription("Featured title "+(i+1)+": "+picks.get(i).title);dots.add(dot);indicators.addView(dot,new LinearLayout.LayoutParams(dp(30),dp(30)));}
        indicators.addView(button("›",()->slideNext[0].run()),new LinearLayout.LayoutParams(dp(36),dp(30)));info.addView(indicators);
'''
if old not in text:
    raise SystemExit('indicator block not found')
text = text.replace(old, new, 1)

old2 = '''        paint[0]=()->{Catalog.Item item=picks.get(heroIndex);atmosphere(item,token);title.setText(item.title);facts.setText(meta(item));description.setText(item.description);String url=item.raw.optString("backdrop");if(url.isEmpty())url=item.poster;if(!url.isEmpty())picture(url,art,token);homepagePreview(item,hero);play.setText(prefs.getLong("position:"+item.id,0)>1000&&prefs.getInt("percent:"+item.id,0)<95?"Resume":"Watch now");for(int i=0;i<dots.size();i++){dots.get(i).setText(i==heroIndex?"━":"•");dots.get(i).setTextColor(i==heroIndex?ACCENT:MUTED);}};
        paint[0].run();float[] touch=new float[2];hero.setOnTouchListener((v,event)->{if(event.getActionMasked()==MotionEvent.ACTION_DOWN){touch[0]=event.getX();touch[1]=event.getY();return true;}if(event.getActionMasked()==MotionEvent.ACTION_UP){float dx=event.getX()-touch[0],dy=event.getY()-touch[1];if(Math.abs(dx)>dp(60)&&Math.abs(dx)>Math.abs(dy)*2){heroIndex=(heroIndex+(dx<0?1:picks.size()-1))%picks.size();paint[0].run();return true;}v.performClick();}return false;});
        content.addView(hero,new LinearLayout.LayoutParams(-1,googleLayout()?dp(BuildConfig.TV?570:470):dp(440)));space(content,googleLayout()?8:24);
        heroTick=new Runnable(){public void run(){if(!foreground||token!=renderVersion||!category.equals("Home"))return;if(!hero.hasFocus()&&!detailsOpen&&scroll.getScrollY()<hero.getHeight()/2){heroIndex=(heroIndex+1)%picks.size();paint[0].run();}ui.postDelayed(this,8000);}};ui.postDelayed(heroTick,8000);
'''
new2 = '''        paint[0]=()->{Catalog.Item item=picks.get(heroIndex);atmosphere(item,token);title.setText(item.title);facts.setText(meta(item));description.setText(item.description);String url=item.raw.optString("backdrop");if(url.isEmpty())url=item.poster;if(!url.isEmpty())picture(url,art,token);homepagePreview(item,hero);play.setText(prefs.getLong("position:"+item.id,0)>1000&&prefs.getInt("percent:"+item.id,0)<95?"Resume":"Watch now");for(int i=0;i<dots.size();i++){dots.get(i).setText(i==heroIndex?"━":"•");dots.get(i).setTextColor(i==heroIndex?ACCENT:MUTED);}};
        slideNext[0]=()->{if(!prefs.getBoolean("uiAnimations",true)){heroIndex=(heroIndex+1)%picks.size();paint[0].run();return;}float distance=Math.max(dp(120),hero.getWidth()*.16f);hero.animate().cancel();hero.animate().translationX(-distance).alpha(.35f).setDuration(220).withEndAction(()->{heroIndex=(heroIndex+1)%picks.size();paint[0].run();hero.setTranslationX(distance);hero.setAlpha(.35f);hero.animate().translationX(0f).alpha(1f).setDuration(300).start();}).start();};
        slidePrevious[0]=()->{if(!prefs.getBoolean("uiAnimations",true)){heroIndex=(heroIndex+picks.size()-1)%picks.size();paint[0].run();return;}float distance=Math.max(dp(120),hero.getWidth()*.16f);hero.animate().cancel();hero.animate().translationX(distance).alpha(.35f).setDuration(220).withEndAction(()->{heroIndex=(heroIndex+picks.size()-1)%picks.size();paint[0].run();hero.setTranslationX(-distance);hero.setAlpha(.35f);hero.animate().translationX(0f).alpha(1f).setDuration(300).start();}).start();};
        paint[0].run();float[] touch=new float[2];hero.setOnTouchListener((v,event)->{if(event.getActionMasked()==MotionEvent.ACTION_DOWN){touch[0]=event.getX();touch[1]=event.getY();return true;}if(event.getActionMasked()==MotionEvent.ACTION_UP){float dx=event.getX()-touch[0],dy=event.getY()-touch[1];if(Math.abs(dx)>dp(60)&&Math.abs(dx)>Math.abs(dy)*2){if(dx<0)slideNext[0].run();else slidePrevious[0].run();return true;}v.performClick();}return false;});
        content.addView(hero,new LinearLayout.LayoutParams(-1,googleLayout()?dp(BuildConfig.TV?570:470):dp(440)));space(content,googleLayout()?8:24);
        heroTick=new Runnable(){public void run(){if(!foreground||token!=renderVersion||!category.equals("Home"))return;if(!hero.hasFocus()&&!detailsOpen&&scroll.getScrollY()<hero.getHeight()/2)slideNext[0].run();ui.postDelayed(this,15000);}};ui.postDelayed(heroTick,15000);
'''
if old2 not in text:
    raise SystemExit('carousel paint/timer block not found')
text = text.replace(old2, new2, 1)

path.write_text(text, encoding='utf-8')
print('Patched #17 carousel: 15s auto-advance + right-to-left slide')
