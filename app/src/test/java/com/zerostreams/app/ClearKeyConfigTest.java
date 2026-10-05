package com.zerostreams.app;
import org.junit.Test;
import org.json.*;
import java.nio.charset.StandardCharsets;
import static org.junit.Assert.*;

public class ClearKeyConfigTest {
    @Test public void mapsHexPairsToStandardUnpaddedBase64Url() throws Exception {
        JSONObject response=json("00000000000000000000000000000000:ffffffffffffffffffffffffffffffff");JSONObject key=response.getJSONArray("keys").getJSONObject(0);
        assertEquals("AAAAAAAAAAAAAAAAAAAAAA",key.getString("kid"));assertEquals("_____________________w",key.getString("k"));assertEquals("oct",key.getString("kty"));assertEquals("temporary",response.getString("type"));
    }
    @Test public void handlesJsonKeyMapsAndStandardJwkResponses() throws Exception {
        assertEquals(1,json("{\"00000000000000000000000000000000\":\"ffffffffffffffffffffffffffffffff\"}").getJSONArray("keys").length());
        assertEquals("AAAAAAAAAAAAAAAAAAAAAA",json("{\"keys\":[{\"kid\":\"AAAAAAAAAAAAAAAAAAAAAA==\",\"k\":\"_____________________w\"}]}").getJSONArray("keys").getJSONObject(0).getString("kid"));
    }
    @Test(expected=JSONException.class) public void rejectsMalformedKeys() throws Exception {json("bad:bad");}
    private static JSONObject json(String input) throws Exception {return new JSONObject(new String(ClearKeyConfig.response(input),StandardCharsets.UTF_8));}
    @org.junit.Test public void normalizesStandardBase64Jwk() throws Exception {
        String response=new String(ClearKeyConfig.response("{\"keys\":[{\"kid\":\"+////////////////////w\",\"k\":\"+////////////////////w\"}]}"),java.nio.charset.StandardCharsets.UTF_8);
        org.junit.Assert.assertTrue(response.contains("-____________________w"));
    }
}
