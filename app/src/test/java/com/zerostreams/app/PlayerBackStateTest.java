package com.zerostreams.app;
import org.junit.Test;
import static org.junit.Assert.*;
public class PlayerBackStateTest {
    @Test public void secondBackExitsEvenWithoutFrameAcknowledgement(){PlayerBackState state=new PlayerBackState();assertFalse(state.pressBack());assertTrue(state.pressBack());}
    @Test public void remoteActivityStartsANewHideThenExitSequence(){PlayerBackState state=new PlayerBackState();assertFalse(state.pressBack());state.userActivity();assertFalse(state.pressBack());assertTrue(state.pressBack());}
}
