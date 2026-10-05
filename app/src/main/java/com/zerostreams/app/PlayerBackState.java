package com.zerostreams.app;

/** App-owned two-step Back; an embedded frame cannot prevent the second exit. */
final class PlayerBackState {
    private boolean controlsDismissed;
    boolean pressBack(){if(controlsDismissed)return true;controlsDismissed=true;return false;}
    void userActivity(){controlsDismissed=false;}
}
