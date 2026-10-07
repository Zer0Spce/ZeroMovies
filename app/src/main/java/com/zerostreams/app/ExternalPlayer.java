package com.zerostreams.app;

import android.app.Activity;
import android.content.*;
import android.net.Uri;
import androidx.core.content.FileProvider;
import java.io.File;

final class ExternalPlayer {
    private ExternalPlayer(){}
    static void open(Activity activity,File file,String mime){
        if(file==null||!file.isFile()){ToastMessage.show(activity,"Video file is missing.");return;}
        try{
            Uri uri=FileProvider.getUriForFile(activity,activity.getPackageName()+".files",file);
            Intent intent=new Intent(Intent.ACTION_VIEW).setDataAndType(uri,mime==null||mime.isEmpty()?"video/*":mime)
                .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            activity.startActivity(Intent.createChooser(intent,"Play with…"));
        }catch(ActivityNotFoundException e){ToastMessage.show(activity,"No external video player is installed.");}
        catch(Exception e){ToastMessage.show(activity,"Could not share this downloaded video.");}
    }
    private static final class ToastMessage {
        static void show(Context context,String text){android.widget.Toast.makeText(context,text,android.widget.Toast.LENGTH_LONG).show();}
    }
}
