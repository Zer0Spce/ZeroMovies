package com.zerostreams.app;
import org.junit.Test;
import static org.junit.Assert.*;
public class PlayerBackStateTest {
 @Test public void backWithoutMenuExitsOnFirstPress(){assertTrue(new PlayerBackState().pressBack(false));}
 @Test public void backDismissesMenuThenExits(){PlayerBackState state=new PlayerBackState();assertFalse(state.pressBack(true));assertTrue(state.pressBack(false));}
}
