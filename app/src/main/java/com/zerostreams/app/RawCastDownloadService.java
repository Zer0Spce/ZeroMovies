package com.zerostreams.app;
import android.app.*;import android.content.*;import android.os.*;
public final class RawCastDownloadService extends Service {
 private final Handler handler=new Handler(Looper.getMainLooper());private final Runnable check=()->{DirectDownloads manager=DirectDownloads.get(this);if(manager.hasWork())handler.postDelayed(this::poll,1000);else stopSelf();};void poll(){check.run();}
 @Override public int onStartCommand(Intent intent,int flags,int id){String channel="zeroplay-direct-downloads";if(Build.VERSION.SDK_INT>=26)getSystemService(NotificationManager.class).createNotificationChannel(new NotificationChannel(channel,"ZeroPlay downloads",NotificationManager.IMPORTANCE_LOW));PendingIntent open=PendingIntent.getActivity(this,0,new Intent(this,MainActivity.class).putExtra("downloads",true),PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);Notification.Builder builder=Build.VERSION.SDK_INT>=26?new Notification.Builder(this,channel):new Notification.Builder(this);startForeground(1701,builder.setSmallIcon(android.R.drawable.stat_sys_download).setContentTitle("ZeroPlay downloads").setContentText("Open Downloads to manage your queue").setContentIntent(open).setOngoing(true).build());DirectDownloads.get(this).pump();handler.removeCallbacksAndMessages(null);handler.postDelayed(this::poll,1000);return START_NOT_STICKY;}
 @Override public IBinder onBind(Intent intent){return null;}
 @Override public void onDestroy(){handler.removeCallbacksAndMessages(null);super.onDestroy();}
 @Override public void onTimeout(int startId,int type){DirectDownloads.get(this).pauseAll();stopSelf();}
}
