from pathlib import Path

# Fix #5. Only movie/series browser player + MainActivity focus guard/settings.
# Live TV / Live Sports / PPV sources are deliberately excluded.

# MainActivity: TV player control preference + prevent held Down from escaping content into sidebar.
p=Path('app/src/main/java/com/zerostreams/app/MainActivity.java')
s=p.read_text()
old='''space(panel,12);Switch mouse=new Switch(this);mouse.setText("Optional mouse mode while playing on TV");mouse.setTextColor(INK);mouse.setChecked(prefs.getBoolean("playerMouse",true));if(BuildConfig.TV)panel.addView(mouse);'''
new='''space(panel,12);Spinner tvPlayerControl=new Spinner(this);tvPlayerControl.setAdapter(spinnerAdapter(new String[]{"Mouse control · arrows move pointer, OK clicks","Navigation control · D-pad moves between player buttons"}));tvPlayerControl.setSelection(prefs.getBoolean("playerMouse",true)?0:1);if(BuildConfig.TV){panel.addView(text("Android TV movie player controls",14,INK));panel.addView(tvPlayerControl);panel.addView(text("Mouse remains the default. Press Menu during movie playback to switch modes instantly.",12,MUTED));}'''
if old not in s and new not in s: raise SystemExit('player control settings anchor missing')
if new not in s:s=s.replace(old,new,1)
old='''.putBoolean("playerMouse",mouse.isChecked()).putFloat("audioBoost"'''
new='''.putBoolean("playerMouse",!BuildConfig.TV||tvPlayerControl.getSelectedItemPosition()==0).putFloat("audioBoost"'''
if old not in s and new not in s: raise SystemExit('player control save anchor missing')
if new not in s:s=s.replace(old,new,1)
anchor='''    @Override public void onWindowFocusChanged(boolean focused){'''
helper='''    @Override public boolean dispatchKeyEvent(KeyEvent event){
        if(BuildConfig.TV&&event.getKeyCode()==KeyEvent.KEYCODE_DPAD_DOWN&&event.getAction()==KeyEvent.ACTION_DOWN&&event.getRepeatCount()>0){
            View current=getCurrentFocus();
            if(current!=null&&content!=null&&!descendant(sidebar,current)){
                View next=FocusFinder.getInstance().findNextFocus((ViewGroup)getWindow().getDecorView(),current,View.FOCUS_DOWN);
                if(next!=null&&sidebar!=null&&descendant(sidebar,next)){
                    View contentNext=FocusFinder.getInstance().findNextFocus(content,current,View.FOCUS_DOWN);
                    if(contentNext!=null&&contentNext!=current){contentNext.requestFocus();return true;}
                    return true;
                }
            }
        }
        return super.dispatchKeyEvent(event);
    }
'''
if helper not in s:
    if anchor not in s: raise SystemExit('dispatchKeyEvent anchor missing')
    s=s.replace(anchor,helper+anchor,1)
p.write_text(s)

# BrowserPlayerActivity: throttle held D-pad only when mouse mode is OFF.
p=Path('app/src/main/java/com/zerostreams/app/BrowserPlayerActivity.java')
s=p.read_text()
old='''    private long lastPlayerGesture;\n''';new='''    private long lastPlayerGesture;\n    private long lastTvNavAt;\n'''
if old not in s and new not in s: raise SystemExit('player field anchor missing')
if new not in s:s=s.replace(old,new,1)
old='''        if(mouse!=null&&mouse.handle(event))return true;\n        if(tvPlayer){String direction=null;switch(event.getKeyCode()){'''
new='''        if(mouse!=null&&mouse.handle(event))return true;\n        if(tvPlayer){String direction=null;switch(event.getKeyCode()){'''
if old not in s: raise SystemExit('player dispatch anchor missing')
# Leave anchor itself unchanged, inject throttle just before JS nav invocation.
old2='''        }if(direction!=null){boolean activate=direction.equals("ok");if((activate&&event.getAction()==KeyEvent.ACTION_UP)||(!activate&&event.getAction()==KeyEvent.ACTION_DOWN))web.evaluateJavascript("if(window.__zeroTvNavigate)window.__zeroTvNavigate('"+direction+"');",null);return true;}}'''
new2='''        }if(direction!=null){boolean activate=direction.equals("ok");if(!activate&&event.getAction()==KeyEvent.ACTION_DOWN){long now=android.os.SystemClock.elapsedRealtime();if(event.getRepeatCount()>0&&now-lastTvNavAt<165)return true;lastTvNavAt=now;}if((activate&&event.getAction()==KeyEvent.ACTION_UP)||(!activate&&event.getAction()==KeyEvent.ACTION_DOWN))web.evaluateJavascript("if(window.__zeroTvNavigate)window.__zeroTvNavigate('"+direction+"');",null);return true;}}'''
if old2 not in s and new2 not in s: raise SystemExit('player nav invocation anchor missing')
if new2 not in s:s=s.replace(old2,new2,1)
p.write_text(s)

# player-guard: replace list wraparound with spatial nearest-neighbor navigation.
p=Path('app/src/main/assets/player-guard.js')
s=p.read_text()
old='''        if(window.parent!==window){window.parent.postMessage({type:'zerostreams-tv-nav-edge',direction},'*');return;}
        const index=nodes.indexOf(current),step=(direction==='left'||direction==='up')?-1:1;focus(nodes[(index+step+nodes.length)%nodes.length]);
'''
new='''        if(window.parent!==window){window.parent.postMessage({type:'zerostreams-tv-nav-edge',direction},'*');return;}
        const origin=current.getBoundingClientRect(),ox=(origin.left+origin.right)/2,oy=(origin.top+origin.bottom)/2;
        const horizontal=direction==='left'||direction==='right',sign=(direction==='left'||direction==='up')?-1:1;
        let best=null,bestScore=Infinity;
        for(const node of nodes){if(node===current)continue;const r=node.getBoundingClientRect(),x=(r.left+r.right)/2,y=(r.top+r.bottom)/2,primary=horizontal?(x-ox)*sign:(y-oy)*sign;if(primary<=3)continue;const cross=Math.abs(horizontal?y-oy:x-ox);const overlap=horizontal?Math.max(0,Math.min(origin.bottom,r.bottom)-Math.max(origin.top,r.top)):Math.max(0,Math.min(origin.right,r.right)-Math.max(origin.left,r.left));const score=primary+cross*(overlap>0?.35:1.35);if(score<bestScore){bestScore=score;best=node;}}
        if(best){focus(best);return;}
        // No wraparound. Embedded frames may ask their parent to continue, otherwise stay put.
        if(window.parent!==window)window.parent.postMessage({type:'zerostreams-tv-nav-edge',direction},'*');
'''
if old not in s and new not in s: raise SystemExit('spatial nav anchor missing')
if new not in s:s=s.replace(old,new,1)
p.write_text(s)

# Strengthen TV navigation regression test with vertical spatial navigation and no wraparound.
p=Path('tests/tv-navigation.test.cjs')
s=p.read_text()
anchor='''  dom=page('<button id="back" aria-label="Go back">Back</button><button id="play" data-x="200">Play</button>');'''
insert='''  dom=page('<button id="top" data-x="400" data-y="100">Top</button><button id="down" data-x="410" data-y="300">Down</button><button id="side" data-x="50" data-y="280">Side</button>');dom.window.__zeroTvNavigate('down');assert.equal(dom.window.document.activeElement.id,'top');dom.window.__zeroTvNavigate('down');assert.equal(dom.window.document.activeElement.id,'down','Down should choose the nearest control below, not a sideways/list-order item');dom.window.__zeroTvNavigate('down');assert.equal(dom.window.document.activeElement.id,'down','Navigation must not wrap at the bottom');dom.window.close();\n'''
if insert not in s:
    if anchor not in s: raise SystemExit('test anchor missing')
    s=s.replace(anchor,insert+anchor,1)
p.write_text(s)
