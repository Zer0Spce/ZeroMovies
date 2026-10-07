package com.zerostreams.app;

import android.graphics.*;
import android.os.*;
import android.view.*;
import android.widget.ImageView;
import org.json.*;
import java.util.*;
import java.util.concurrent.*;

/** Final category artwork pass plus deterministic Android TV focus navigation. */
public class CategoryMainActivity extends ReleaseMainActivity {
    private final ExecutorService categoryIo=Executors.newSingleThreadExecutor();
    private final Handler categoryUi=new Handler(Looper.getMainLooper());
    private final Set<String> categoryArtworkUsed=Collections.synchronizedSet(new HashSet<>());

    @Override void genrePicture(String type,int id,ImageView image,int token){
        image.setAlpha(.94f);if(Build.VERSION.SDK_INT>=31)image.setRenderEffect(RenderEffect.createBlurEffect(dp(1.1f),dp(1.1f),Shader.TileMode.CLAMP));
        final String key=tmdbKey();if(key.isEmpty()){super.genrePicture(type,id,image,token);return;}
        categoryIo.execute(()->{try{
            JSONObject page=id==-16?ContentApi.animeData(key,type,1):id<=-101?ContentApi.categoryData(key,type,id,1):ContentApi.genreData(key,type,id,1);JSONArray rows=page.optJSONArray("results");String chosen="";
            if(rows!=null)for(int pass=0;pass<2&&chosen.isEmpty();pass++)for(int i=0;i<rows.length();i++){JSONObject row=rows.optJSONObject(i);if(row==null)continue;String path=row.optString("backdrop_path");if(path.isEmpty())path=row.optString("poster_path");String url=ContentApi.image(path,"w780");if(url.isEmpty())continue;if(pass==0&&categoryArtworkUsed.contains(url))continue;chosen=url;break;}
            final String art=chosen;if(!art.isEmpty())categoryArtworkUsed.add(art);categoryUi.post(()->{if(isDestroyed()||!image.isAttachedToWindow())return;if(art.isEmpty())CategoryMainActivity.super.genrePicture(type,id,image,token);else picture(art,image,token);});
        }catch(Exception ignored){categoryUi.post(()->{if(!isDestroyed()&&image.isAttachedToWindow())CategoryMainActivity.super.genrePicture(type,id,image,token);});}});
    }

    @Override public boolean dispatchKeyEvent(KeyEvent event){
        if(BuildConfig.TV&&event.getAction()==KeyEvent.ACTION_DOWN&&event.getRepeatCount()==0){
            int direction=focusDirection(event.getKeyCode());
            if(direction!=0){
                View current=getCurrentFocus();
                if(current==null){
                    View first=firstFocusable();
                    if(first!=null){first.requestFocus();ensureVisible(first);return true;}
                }else{
                    View target=spatialTarget(current,direction);
                    if(target!=null&&target!=current){target.requestFocus();ensureVisible(target);return true;}
                }
            }
        }
        return super.dispatchKeyEvent(event);
    }

    private int focusDirection(int key){
        if(key==KeyEvent.KEYCODE_DPAD_LEFT)return View.FOCUS_LEFT;
        if(key==KeyEvent.KEYCODE_DPAD_RIGHT)return View.FOCUS_RIGHT;
        if(key==KeyEvent.KEYCODE_DPAD_UP)return View.FOCUS_UP;
        if(key==KeyEvent.KEYCODE_DPAD_DOWN)return View.FOCUS_DOWN;
        return 0;
    }

    private View firstFocusable(){
        View root=getWindow().getDecorView();
        ArrayList<View> nodes=root.getFocusables(View.FOCUS_FORWARD);
        for(View node:nodes)if(validFocus(node))return node;
        return null;
    }

    private View spatialTarget(View current,int direction){
        Rect from=new Rect();if(!current.getGlobalVisibleRect(from))return null;
        float fx=(from.left+from.right)/2f,fy=(from.top+from.bottom)/2f;
        View best=null;double bestScore=Double.MAX_VALUE;
        ArrayList<View> nodes=getWindow().getDecorView().getFocusables(View.FOCUS_FORWARD);
        for(View node:nodes){
            if(node==current||!validFocus(node))continue;
            Rect to=new Rect();if(!node.getGlobalVisibleRect(to))continue;
            float tx=(to.left+to.right)/2f,ty=(to.top+to.bottom)/2f,dx=tx-fx,dy=ty-fy;
            float primary,cross;
            if(direction==View.FOCUS_LEFT){if(dx>=-1)continue;primary=-dx;cross=Math.abs(dy);}
            else if(direction==View.FOCUS_RIGHT){if(dx<=1)continue;primary=dx;cross=Math.abs(dy);}
            else if(direction==View.FOCUS_UP){if(dy>=-1)continue;primary=-dy;cross=Math.abs(dx);}
            else {if(dy<=1)continue;primary=dy;cross=Math.abs(dx);}
            // Strongly prefer the nearest row/column while still allowing sidebar/header transitions.
            double alignment=cross/Math.max(1f,primary);
            double score=primary+(cross*2.35)+(alignment*alignment*180.0);
            if(score<bestScore){bestScore=score;best=node;}
        }
        return best;
    }

    private boolean validFocus(View node){
        return node!=null&&node.isShown()&&node.isEnabled()&&node.isFocusable()&&node.getAlpha()>.05f&&node.getWidth()>1&&node.getHeight()>1;
    }

    private void ensureVisible(View view){
        view.post(()->{
            Rect rect=new Rect(0,0,view.getWidth(),view.getHeight());
            ViewParent parent=view.getParent();
            while(parent instanceof View){((View)parent).requestRectangleOnScreen(rect,false);parent=parent.getParent();}
        });
    }

    @Override protected void onDestroy(){categoryUi.removeCallbacksAndMessages(null);categoryIo.shutdownNow();super.onDestroy();}
}
