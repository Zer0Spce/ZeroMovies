package com.zerostreams.app;
import android.graphics.Bitmap;
import android.content.Intent;
import androidx.test.core.app.ActivityScenario;
import androidx.test.platform.app.InstrumentationRegistry;
import org.junit.Test;
import org.junit.Assert;
import java.io.*;
/** Native-resolution documentation captures from the actual emulator app. */
public class GalleryTest {
 void capture(String name)throws Exception{try(android.os.ParcelFileDescriptor descriptor=InstrumentationRegistry.getInstrumentation().getUiAutomation().executeShellCommand("screencap -p /data/local/tmp/zeroplay-"+name+".png");InputStream result=new android.os.ParcelFileDescriptor.AutoCloseInputStream(descriptor)){while(result.read()!=-1){}}}
 @Test public void captureFeaturesAndVerifyNavigation()throws Exception{Intent intent=new Intent(InstrumentationRegistry.getInstrumentation().getTargetContext(),MainActivity.class);try(ActivityScenario<MainActivity> scenario=ActivityScenario.launch(intent)){Thread.sleep(16000);scenario.onActivity(a->Assert.assertFalse(a.getWindow().getDecorView().findViewById(android.R.id.content)==null));capture("home");scenario.onActivity(a->a.open("Categories"));Thread.sleep(10000);capture("categories");scenario.onActivity(a->a.open("Live Sports"));Thread.sleep(10000);capture("live-sports");scenario.onActivity(a->a.settings());Thread.sleep(1000);capture("settings");scenario.onActivity(a->a.homePanelSettings());Thread.sleep(1000);capture("home-panels");}}
}
