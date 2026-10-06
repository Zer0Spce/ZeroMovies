package com.zerostreams.app;
/** Small monochrome rail glyphs, independent of emoji fonts and TV firmware. */
final class LayoutIcon extends android.graphics.drawable.Drawable {
 final android.graphics.Paint paint=new android.graphics.Paint(android.graphics.Paint.ANTI_ALIAS_FLAG);final String name;final int size;
 LayoutIcon(android.content.Context context,String name,int color){this.name=name;size=Math.round(24*context.getResources().getDisplayMetrics().density);paint.setColor(color);paint.setStyle(android.graphics.Paint.Style.STROKE);paint.setStrokeWidth(1.7f);paint.setStrokeCap(android.graphics.Paint.Cap.ROUND);paint.setStrokeJoin(android.graphics.Paint.Join.ROUND);}
 public int getIntrinsicWidth(){return size;}public int getIntrinsicHeight(){return size;}public void setAlpha(int alpha){paint.setAlpha(alpha);}public void setColorFilter(android.graphics.ColorFilter filter){paint.setColorFilter(filter);}public int getOpacity(){return android.graphics.PixelFormat.TRANSLUCENT;}
 public void draw(android.graphics.Canvas c){c.save();c.translate(getBounds().left,getBounds().top);c.scale(getBounds().width()/24f,getBounds().height()/24f);
 if(name.equals("Home")){android.graphics.Path p=new android.graphics.Path();p.moveTo(3,11);p.lineTo(12,3);p.lineTo(21,11);p.moveTo(5,10);p.lineTo(5,21);p.lineTo(19,21);p.lineTo(19,10);p.moveTo(10,21);p.lineTo(10,14);p.lineTo(14,14);p.lineTo(14,21);c.drawPath(p,paint);}
 else if(name.equals("Search")){c.drawCircle(10,10,6,paint);c.drawLine(15,15,21,21,paint);}
 else if(name.equals("Downloads")){c.drawLine(12,3,12,16,paint);c.drawLine(7,11,12,16,paint);c.drawLine(12,16,17,11,paint);c.drawLine(4,20,20,20,paint);}
 else if(name.equals("Settings")){c.drawCircle(12,12,7,paint);c.drawCircle(12,12,2.5f,paint);for(int i=0;i<8;i++){double a=i*Math.PI/4;c.drawLine(12+(float)Math.cos(a)*8,12+(float)Math.sin(a)*8,12+(float)Math.cos(a)*10,12+(float)Math.sin(a)*10,paint);}}
 else if(name.equals("Categories")){for(int x:new int[]{4,14})for(int y:new int[]{4,14})c.drawRoundRect(x,y,x+6,y+6,1,1,paint);}
 else if(name.equals("Library")){c.drawRoundRect(4,4,20,21,2,2,paint);c.drawLine(8,4,8,21,paint);c.drawLine(12,9,17,9,paint);c.drawLine(12,13,17,13,paint);}
 else if(name.equals("Live Sports")){c.drawCircle(12,12,9,paint);c.drawLine(3,12,21,12,paint);c.drawOval(8,3,16,21,paint);}
 else{c.drawRoundRect(3,5,21,18,2,2,paint);if(name.equals("Movies")){c.drawLine(3,9,21,9,paint);c.drawLine(8,5,8,9,paint);c.drawLine(16,5,16,9,paint);}else{android.graphics.Path p=new android.graphics.Path();p.moveTo(10,9);p.lineTo(16,12);p.lineTo(10,15);p.close();c.drawPath(p,paint);c.drawLine(8,21,16,21,paint);}}
 c.restore();}
}
