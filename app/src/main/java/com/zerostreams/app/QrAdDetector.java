package com.zerostreams.app;

import com.google.zxing.*;
import com.google.zxing.common.HybridBinarizer;
import java.net.URI;
import java.util.*;

/** Reads only a rendered QR destination; never visits it or responds to verification. */
final class QrAdDetector {
    static boolean isAdUrl(String value){
        try{URI uri=new URI(value);String host=uri.getHost(),path=uri.getPath(),query=uri.getRawQuery();if(!"https".equalsIgnoreCase(uri.getScheme())||host==null)return false;
            host=host.toLowerCase(Locale.ROOT);
            if(AdBlockRules.blocks(host))return true;
            // Fingerprint of the advertising destination decoded from the user's photo.
            return host.endsWith(".cyou")&&path!=null&&path.matches("/ri/[0-9]+")&&query!=null&&query.matches("(?:.*&)?uuid=[a-fA-F0-9-]{16,80}(?:&.*)?");
        }catch(Exception e){return false;}
    }
    static String decode(int[] pixels,int width,int height){
        int white=0,total=0;for(int i=0;i<pixels.length;i+=97){int color=pixels[i];total++;if(((color>>16)&255)>230&&((color>>8)&255)>230&&(color&255)>230)white++;}
        if(total==0||white<total*.35)return "";
        MultiFormatReader reader=new MultiFormatReader();Map<DecodeHintType,Object> hints=new EnumMap<>(DecodeHintType.class);hints.put(DecodeHintType.POSSIBLE_FORMATS,Collections.singletonList(BarcodeFormat.QR_CODE));hints.put(DecodeHintType.TRY_HARDER,true);
        try{return reader.decode(new BinaryBitmap(new HybridBinarizer(new RGBLuminanceSource(width,height,pixels))),hints).getText();}catch(NotFoundException e){return "";}finally{reader.reset();}
    }
}
