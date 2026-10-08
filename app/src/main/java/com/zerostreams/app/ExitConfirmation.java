package com.zerostreams.app;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.view.Gravity;
import android.view.Window;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;
import java.util.Map;
import java.util.WeakHashMap;

/** Small reusable confirmation dialog for leaving playback or the app. */
final class ExitConfirmation {
    private static final Map<Activity,AlertDialog> ACTIVE=new WeakHashMap<>();
    private ExitConfirmation(){}

    static void show(Activity activity,String title,String message,Runnable onExit){
        if(activity==null||activity.isFinishing()||activity.isDestroyed())return;
        AlertDialog current=ACTIVE.get(activity);
        if(current!=null&&current.isShowing())return;

        SharedPreferences prefs=activity.getSharedPreferences("zero",Activity.MODE_PRIVATE);
        boolean light="light".equals(prefs.getString("theme","dark"));
        int surface=light?Color.rgb(250,251,253):Color.rgb(20,22,30);
        int ink=light?Color.rgb(26,33,46):Color.rgb(244,245,250);
        int muted=light?Color.rgb(91,101,117):Color.rgb(181,187,203);
        int accent=light?Color.rgb(10,113,94):Color.rgb(101,230,204);
        int danger=Color.rgb(194,63,75);
        float density=activity.getResources().getDisplayMetrics().density;
        int pad=(int)(22*density);

        LinearLayout box=new LinearLayout(activity);box.setOrientation(LinearLayout.VERTICAL);box.setPadding(pad,pad,pad,pad);
        TextView eyebrow=text(activity,"ZEROPLAY",11,accent);eyebrow.setLetterSpacing(.14f);box.addView(eyebrow);
        TextView heading=text(activity,title,BuildConfig.TV?24:22,ink);heading.setTypeface(null,Typeface.BOLD);heading.setPadding(0,(int)(5*density),0,(int)(8*density));box.addView(heading);
        TextView body=text(activity,message,BuildConfig.TV?15:14,muted);body.setLineSpacing(0,1.12f);body.setPadding(0,0,0,(int)(20*density));box.addView(body);

        LinearLayout actions=new LinearLayout(activity);actions.setGravity(Gravity.END|Gravity.CENTER_VERTICAL);
        Button no=new Button(activity);no.setText("No, keep watching");styleButton(no,light?Color.rgb(229,234,240):Color.rgb(42,46,58),ink,density);
        Button yes=new Button(activity);yes.setText("Yes, exit");styleButton(yes,danger,Color.WHITE,density);
        LinearLayout.LayoutParams bp=new LinearLayout.LayoutParams(-2,(int)((BuildConfig.TV?48:44)*density));bp.setMargins((int)(8*density),0,0,0);
        actions.addView(no,new LinearLayout.LayoutParams(-2,(int)((BuildConfig.TV?48:44)*density)));actions.addView(yes,bp);box.addView(actions);

        AlertDialog dialog=new AlertDialog.Builder(activity).setView(box).create();
        ACTIVE.put(activity,dialog);
        no.setOnClickListener(v->dialog.dismiss());
        yes.setOnClickListener(v->{dialog.dismiss();onExit.run();});
        dialog.setOnDismissListener(d->ACTIVE.remove(activity));
        dialog.setOnShowListener(d->{
            Window window=dialog.getWindow();
            if(window!=null){
                GradientDrawable bg=shape(surface,light?0x22000000:0x22FFFFFF,density,18);
                window.setBackgroundDrawable(bg);
                window.addFlags(WindowManager.LayoutParams.FLAG_DIM_BEHIND);
                WindowManager.LayoutParams attrs=window.getAttributes();attrs.dimAmount=.76f;window.setAttributes(attrs);
                int screen=activity.getResources().getDisplayMetrics().widthPixels;
                int max=(int)((BuildConfig.TV?520:410)*density);
                window.setLayout(Math.min((int)(screen*.90f),max),WindowManager.LayoutParams.WRAP_CONTENT);
            }
            if(BuildConfig.TV){no.setFocusable(true);yes.setFocusable(true);no.requestFocus();}
        });
        dialog.show();
    }

    private static TextView text(Activity activity,String value,int size,int color){TextView t=new TextView(activity);t.setText(value);t.setTextSize(size);t.setTextColor(color);return t;}

    private static void styleButton(Button button,int color,int text,float density){
        button.setAllCaps(false);button.setTextColor(text);button.setTextSize(BuildConfig.TV?15:14);button.setMinWidth(0);button.setMinimumWidth(0);
        button.setPadding((int)(18*density),(int)(7*density),(int)(18*density),(int)(7*density));
        button.setBackground(shape(color,0,density,11));
        button.setOnFocusChangeListener((v,focused)->v.setBackground(shape(color,focused?Color.WHITE:0,density,11)));
    }

    private static GradientDrawable shape(int color,int border,float density,int radius){
        GradientDrawable d=new GradientDrawable();d.setColor(color);d.setCornerRadius(radius*density);
        if(border!=0)d.setStroke(Math.max(1,(int)(2*density)),border);return d;
    }
}
