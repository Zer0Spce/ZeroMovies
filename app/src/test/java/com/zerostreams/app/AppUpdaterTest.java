package com.zerostreams.app;
import org.junit.Test;
import static org.junit.Assert.*;
public class AppUpdaterTest {
    @Test public void comparesReleaseVersionsCorrectly(){
        assertTrue(AppUpdater.newer("v2.0","1.9.0"));
        assertTrue(AppUpdater.newer("1.9.1","1.9"));
        assertFalse(AppUpdater.newer("1.9","1.9.0"));
        assertFalse(AppUpdater.newer("1.8.2","1.9.0"));
        assertTrue(AppUpdater.newer("2.0.0-beta","1.9.9"));
    }
}
