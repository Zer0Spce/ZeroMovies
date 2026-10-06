package com.zerostreams.app;
/** Back consumes a submenu only when that submenu was actually dismissed. */
final class PlayerBackState {
    boolean pressBack(boolean menuHandled){return !menuHandled;}
    void userActivity(){}
}
