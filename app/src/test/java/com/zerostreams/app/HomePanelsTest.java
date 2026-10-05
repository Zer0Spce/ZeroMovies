package com.zerostreams.app;
import org.junit.Test;import static org.junit.Assert.*;import java.util.*;
public class HomePanelsTest {@Test public void existingPanelsStayOnAndCategoriesAreOptIn(){Set<String> enabled=HomePanels.defaults();assertEquals(11,enabled.size());assertTrue(enabled.containsAll(Arrays.asList("featured","continue","watchlist","providers","popular","series")));assertFalse(enabled.contains("anime"));assertFalse(enabled.contains("action"));assertEquals(16,HomePanels.genre("anime"));}}
