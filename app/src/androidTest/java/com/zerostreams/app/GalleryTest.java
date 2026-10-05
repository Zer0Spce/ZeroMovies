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
 void capture(String name)throws Exception{Bitmap image=InstrumentationRegistry.getInstrumentation().getUiAutomation().takeScreenshot();Assert.assertNotNull(image);File folder=new File(InstrumentationRegistry.getInstrumentation().getTargetContext().getFilesDir(),"screenshots");folder.mkdirs();try(FileOutputStream output=new FileOutputStream(new File(folder,name+".png"))){image.compress(Bitmap.CompressFormat.PNG,100,output);}image.recycle();}
 @Test public void captureFeaturesAndVerifyNavigation()throws Exception{Intent intent=new Intent(InstrumentationRegistry.getInstrumentation().getTargetContext(),MainActivity.class);try(ActivityScenario<MainActivity> scenario=ActivityScenario.launch(intent)){Thread.sleep(16000);scenario.onActivity(a->Assert.assertFalse(a.getWindow().getDecorView().findViewById(android.R.id.content)==null));capture("home");scenario.onActivity(a->a.open("Categories"));Thread.sleep(10000);capture("categories");scenario.onActivity(a->a.open("Live Sports"));Thread.sleep(10000);capture("live-sports");scenario.onActivity(a->a.settings());Thread.sleep(1000);capture("settings");}}
}
