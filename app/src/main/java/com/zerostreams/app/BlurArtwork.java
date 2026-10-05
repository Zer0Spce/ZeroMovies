package com.zerostreams.app;

import android.content.Context;
import android.graphics.Bitmap;
import android.widget.ImageView;

/** Bounded software blur for consistent backdrops on older phones and TVs. */
final class BlurArtwork extends ImageView {
    BlurArtwork(Context context){super(context);setScaleType(ScaleType.CENTER_CROP);}
    @Override public void setImageBitmap(Bitmap original){
        if(original==null){super.setImageBitmap(null);return;}
        int width=128,height=Math.max(1,Math.min(128,Math.round(128f*original.getHeight()/original.getWidth())));
        Bitmap small=Bitmap.createScaledBitmap(original,width,height,true);
        int[] source=new int[width*height],horizontal=new int[source.length],result=new int[source.length];
        small.getPixels(source,0,width,0,0,width,height);
        for(int y=0;y<height;y++)for(int x=0;x<width;x++)horizontal[y*width+x]=average(source,width,height,x,y,true);
        for(int y=0;y<height;y++)for(int x=0;x<width;x++)result[y*width+x]=average(horizontal,width,height,x,y,false);
        super.setImageBitmap(Bitmap.createBitmap(result,width,height,Bitmap.Config.ARGB_8888));
        if(small!=original)small.recycle();
    }
    private static int average(int[] pixels,int width,int height,int x,int y,boolean horizontal){
        int red=0,green=0,blue=0;
        for(int offset=-3;offset<=3;offset++){
            int xx=horizontal?Math.max(0,Math.min(width-1,x+offset)):x;
            int yy=horizontal?y:Math.max(0,Math.min(height-1,y+offset));
            int color=pixels[yy*width+xx];red+=(color>>16)&255;green+=(color>>8)&255;blue+=color&255;
        }
        return 0xff000000|((red/7)<<16)|((green/7)<<8)|(blue/7);
    }
}
