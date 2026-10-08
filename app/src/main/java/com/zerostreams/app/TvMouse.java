package com.zerostreams.app;

import android.app.Activity;
import android.graphics.*;
import android.os.*;
import android.view.*;
import android.webkit.WebView;
import android.widget.*;

/** Player-only virtual mouse: continuous movement, acceleration and frame-synced painting. */
final class TvMouse extends View implements Choreographer.FrameCallback {
    private final WebView web;private final Activity activity;private final Runnable wake;
    private final Handler handler=new Handler(Looper.getMainLooper());private final Paint paint=new Paint(Paint.ANTI_ALIAS_FLAG);
    private boolean enabled,running,left,right,up,down;private float x=-1,y=-1;private long lastFrame,heldAt,lastHover,lastWake;
    private final Runnable hide=()->setVisibility(GONE);
    TvMouse(Activity activity,WebView web,FrameLayout parent,Runnable wake){super(activity);this.activity=activity;this.web=web;this.wake=wake;setImportantForAccessibility(IMPORTANT_FOR_ACCESSIBILITY_NO);setFocusable(false);setClickable(false);parent.addView(this,new FrameLayout.LayoutParams(-1,-1));setVisibility(GONE);
        enabled=activity.getSharedPreferences("zero",Activity.MODE_PRIVATE).getBoolean("playerMouse",true);
    }
    boolean isMouseEnabled(){return enabled;}
    boolean wakeNow(){if(!enabled)return false;if(x<0){x=Math.max(2,web.getWidth()/2f);y=Math.max(2,web.getHeight()/2f);}setVisibility(VISIBLE);invalidate();handler.removeCallbacks(hide);handler.postDelayed(hide,5000);long now=SystemClock.uptimeMillis();MotionEvent hover=MotionEvent.obtain(now,now,MotionEvent.ACTION_HOVER_MOVE,x,y,0);hover.setSource(InputDevice.SOURCE_MOUSE);web.dispatchGenericMotionEvent(hover);hover.recycle();lastHover=now;lastWake=now;wake.run();return true;}
    boolean handle(KeyEvent event){int key=event.getKeyCode();if(key==KeyEvent.KEYCODE_MENU){if(event.getAction()==KeyEvent.ACTION_DOWN&&event.getRepeatCount()==0){enabled=!enabled;activity.getSharedPreferences("zero",Activity.MODE_PRIVATE).edit().putBoolean("playerMouse",enabled).apply();stop();Toast.makeText(activity,enabled?"Player mouse on · arrows move, OK selects":"Player mouse off · use D-pad focus",Toast.LENGTH_SHORT).show();if(enabled)wakeNow();}return true;}if(!enabled)return false;
        if(key==KeyEvent.KEYCODE_DPAD_CENTER||key==KeyEvent.KEYCODE_ENTER){if(event.getAction()==KeyEvent.ACTION_DOWN)wakeNow();if(event.getAction()==KeyEvent.ACTION_UP)click();return true;}
        if(key!=KeyEvent.KEYCODE_DPAD_LEFT&&key!=KeyEvent.KEYCODE_DPAD_RIGHT&&key!=KeyEvent.KEYCODE_DPAD_UP&&key!=KeyEvent.KEYCODE_DPAD_DOWN)return false;
        boolean pressed=event.getAction()==KeyEvent.ACTION_DOWN;if(pressed)wakeNow();if(key==KeyEvent.KEYCODE_DPAD_LEFT)left=pressed;if(key==KeyEvent.KEYCODE_DPAD_RIGHT)right=pressed;if(key==KeyEvent.KEYCODE_DPAD_UP)up=pressed;if(key==KeyEvent.KEYCODE_DPAD_DOWN)down=pressed;
        if(pressed&&!running){running=true;heldAt=SystemClock.uptimeMillis();lastFrame=0;Choreographer.getInstance().postFrameCallback(this);}return true;
    }
    @Override public void doFrame(long frame){if(!running||!enabled)return;long now=SystemClock.uptimeMillis();if(x<0){x=web.getWidth()/2f;y=web.getHeight()/2f;}float elapsed=lastFrame==0?.016f:Math.min(.04f,(frame-lastFrame)/1_000_000_000f);lastFrame=frame;float density=getResources().getDisplayMetrics().density;float speed=(260+Math.min(700,(now-heldAt)*.6f))*density;float dx=(right?1:0)-(left?1:0),dy=(down?1:0)-(up?1:0);if(dx!=0&&dy!=0){dx*=.707f;dy*=.707f;}
        x=Math.max(2,Math.min(web.getWidth()-2,x+dx*speed*elapsed));y=Math.max(2,Math.min(web.getHeight()-2,y+dy*speed*elapsed));setVisibility(VISIBLE);invalidate();handler.removeCallbacks(hide);handler.postDelayed(hide,5000);
        if(now-lastHover>32){lastHover=now;MotionEvent hover=MotionEvent.obtain(now,now,MotionEvent.ACTION_HOVER_MOVE,x,y,0);hover.setSource(InputDevice.SOURCE_MOUSE);web.dispatchGenericMotionEvent(hover);hover.recycle();}if(now-lastWake>700){lastWake=now;wake.run();}
        if(left||right||up||down)Choreographer.getInstance().postFrameCallback(this);else running=false;
    }
    private void click(){if(!enabled)return;if(x<0){x=web.getWidth()/2f;y=web.getHeight()/2f;}wake.run();long now=SystemClock.uptimeMillis();MotionEvent press=MotionEvent.obtain(now,now,MotionEvent.ACTION_DOWN,x,y,0),release=MotionEvent.obtain(now,now+25,MotionEvent.ACTION_UP,x,y,0);web.dispatchTouchEvent(press);web.dispatchTouchEvent(release);press.recycle();release.recycle();setVisibility(VISIBLE);invalidate();handler.removeCallbacks(hide);handler.postDelayed(hide,5000);}
    @Override protected void onDraw(Canvas canvas){super.onDraw(canvas);if(!enabled)return;float radius=7*getResources().getDisplayMetrics().density;paint.setStyle(Paint.Style.FILL);paint.setColor(0xCC111111);canvas.drawCircle(web.getLeft()+x,web.getTop()+y,radius+2,paint);paint.setColor(Color.WHITE);canvas.drawCircle(web.getLeft()+x,web.getTop()+y,radius,paint);paint.setColor(0xFF65E6CC);canvas.drawCircle(web.getLeft()+x,web.getTop()+y,radius/2,paint);}
    void stop(){running=false;left=right=up=down=false;Choreographer.getInstance().removeFrameCallback(this);handler.removeCallbacksAndMessages(null);setVisibility(GONE);}
}
