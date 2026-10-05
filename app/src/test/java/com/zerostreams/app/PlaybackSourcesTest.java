package com.zerostreams.app;
import org.junit.Test;
import static org.junit.Assert.*;
public class PlaybackSourcesTest {
    @Test public void allSourcesUseTmdbMovieAndEpisodeIds(){
        for(String provider:PlaybackSources.IDS){String movie=PlaybackSources.url("299534","movie",1,1,provider),tv=PlaybackSources.url("1399","tv",0,2,provider);assertTrue(PlaybackSources.trusted(movie));assertTrue(movie.contains("299534"));assertTrue(tv.contains("1399"));if(provider.equals("superembed")){assertTrue(tv.contains("tmdb=1"));assertTrue(tv.contains("s=0&e=2"));}else assertTrue(tv.contains("/tv/1399/0/2"));}
        assertTrue(PlaybackSources.url("299534","movie",1,1,"vidstuck").contains("branding=ZeroMovies"));
    }
    @Test public void originsAreExactAndUnknownSourcesFallBack(){assertFalse(PlaybackSources.trusted("https://vidsrc.sh.attacker.example/embed/movie/1"));assertFalse(PlaybackSources.trusted("http://vidsrc.sh/embed/movie/1"));assertFalse(PlaybackSources.trusted("https://vidsrc.sh:8443/embed/movie/1"));assertTrue(PlaybackSources.trusted("https://streamingnow.mov/?play=test"));assertEquals(0,PlaybackSources.index("unknown"));}
    @Test(expected=IllegalArgumentException.class) public void rejectsMalformedIds(){PlaybackSources.url("../private","movie",1,1,"vidsrc-to");}
}
