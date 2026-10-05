package com.zerostreams.app;

import java.text.Normalizer;
import java.util.Locale;

final class TitleSearch {
    static String normalize(String value) {
        return Normalizer.normalize(value,Normalizer.Form.NFD).replaceAll("\\p{M}+", "")
            .toLowerCase(Locale.ROOT).replaceAll("[^\\p{L}\\p{N}]+", " ").trim();
    }
    static boolean matches(String title,String query) {
        String normalized=normalize(title);
        for(String word:normalize(query).split("\\s+"))if(!normalized.contains(word))return false;
        return true;
    }
}
