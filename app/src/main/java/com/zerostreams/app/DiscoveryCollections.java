package com.zerostreams.app;
final class DiscoveryCollections {
    static final int[] IDS={-101,-102,-103,-104,-105,-106,-107,-108,-109,-110,-111,-112,-113};
    static final String[] NAMES={
        "Japanese titles","Korean titles","Filipino titles","French titles","Spanish titles","Hindi titles",
        "Chinese titles","Thai titles","Indonesian titles","Portuguese titles","German titles","Italian titles","Turkish titles"
    };
    static final String[] LANGUAGES={"ja","ko","tl","fr","es","hi","zh","th","id","pt","de","it","tr"};
    static String language(int id){for(int i=0;i<IDS.length;i++)if(IDS[i]==id)return LANGUAGES[i];throw new IllegalArgumentException("Unknown collection");}
}
