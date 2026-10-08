package com.zerostreams.app;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.DialogInterface;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.graphics.drawable.GradientDrawable;
import android.view.Window;
import android.view.WindowManager;
import android.widget.Button;
import java.util.Map;
import java.util.WeakHashMap;

/** Small reusable confirmation dialog for leaving playback or the app. */
final class ExitConfirmation {
    private static final Map<Activity,AlertDialog> ACTIVE=new WeakHashMap<>();
    private ExitConfirmation(){}

    static void show(Activity activity,String title,String message,Runnable onExit){
        if(activity==null||activity.isFinishing()||activity.isDestroyed())return;
        AlertDialog current=ACTIVE.get(activity);
        if(current!=null&&current.isShowing()){current.getButton(DialogInterface.BUTTON_NEGATIVE).requestFocus();return;}

        AlertDialog dialog=new AlertDialog.Builder(activity)
            .setTitle(title)
            .setMessage(message)
            .setPositiveButton("Yes, exit",(d,w)->onExit.run())
            .setNegativeButton("No",null)
            .create();
        ACTIVE.put(activity,dialog);
        dialog.setOnDismissListener(d->ACTIVE.remove(activity));
        dialog.setOnShowListener(d->{
            SharedPreferences prefs=activity.getSharedPreferences("zero",Activity.MODE_PRIVATE);
            boolean light="light".equals(prefs.getString("theme","dark"));
            int surface=light?Color.rgb(250,251,253):Color.rgb(20,22,30);
            int ink=light?Color.rgb(26,33,46):Color.rgb(244,245,250);
            int accent=light?Color.rgb(10,113,94):Color.rgb(101,230,204);
            int danger=Color.rgb(194,63,75);
            float density=activity.getResources().getDisplayMetrics().density;

            Window window=dialog.getWindow();
            if(window!=null){
                GradientDrawable bg=new GradientDrawable();
                bg.setColor(surface);
                bg.setCornerRadius(18*density);
                bg.setStroke(Math.max(1,(int)density),light?0x22000000:0x22FFFFFF);
                window.setBackgroundDrawable(bg);
                window.addFlags(WindowManager.LayoutParams.FLAG_DIM_BEHIND);
                WindowManager.LayoutParams attrs=window.getAttributes();
                attrs.dimAmount=.72f;
                window.setAttributes(attrs);
                int screen=activity.getResources().getDisplayMetrics().widthPixels;
                int max=(int)((BuildConfig.TV?480:380)*density);
                window.setLayout(Math.min((int)(screen*.88f),max),WindowManager.LayoutParams.WRAP_CONTENT);
            }

            Button yes=dialog.getButton(DialogInterface.BUTTON_POSITIVE);
            Button no=dialog.getButton(DialogInterface.BUTTON_NEGATIVE);
            styleButton(yes,danger,ink,density);
            styleButton(no,accent,light?Color.rgb(10,70,60):Color.rgb(6,24,22),density);
            if(BuildConfig.TV){
                yes.setFocusable(true);no.setFocusable(true);
                yes.setMinHeight((int)(46*density));no.setMinHeight((int)(46*density));
                no.requestFocus();
            }
        });
        dialog.show();
    }

    private static void styleButton(Button button,int color,int text,float density){
        if(button==null)return;
        button.setAllCaps(false);
        button.setTextColor(text);
        button.setPadding((int)(18*density),(int)(8*density),(int)(18*density),(int)(8*density));
        GradientDrawable normal=shape(color,0,density);
        button.setBackground(normal);
        button.setOnFocusChangeListener((v,focused)->v.setBackground(shape(color,focused?Color.WHITE:0,density)));
    }

    private static GradientDrawable shape(int color,int border,float density){
        GradientDrawable d=new GradientDrawable();
        d.setColor(color);
        d.setCornerRadius(10*density);
        if(border!=0)d.setStroke(Math.max(2,(int)(2*density)),border);
        return d;
    }
}
