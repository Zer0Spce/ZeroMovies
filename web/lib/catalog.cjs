function endpoint(path){return typeof path==='string'&&(/^\/(trending\/all\/week|movie\/(popular|top_rated|now_playing|upcoming)|tv\/popular|search\/multi|watch\/providers\/(movie|tv)|discover\/(movie|tv))$/.test(path)||/^\/(movie|tv)\/[1-9]\d{0,9}(\/season\/\d{1,4})?$/.test(path));}
function query(params){
  if(!params||!endpoint(params.path))throw Error('Unsupported catalog route');
  const allowed=new Set(['query','page','append_to_response','watch_region','with_watch_providers','with_watch_monetization_types','sort_by']);const out=new URLSearchParams({include_adult:'false'});
  for(const [name,value]of Object.entries(params)){
    if(name==='path')continue;if(!allowed.has(name)||typeof value!=='string'||value.length>200)throw Error('Unsupported parameter');
    if(name==='page'&&!/^[1-9]\d{0,2}$/.test(value)||name==='page'&&Number(value)>500)throw Error('Invalid page');
    if(name==='append_to_response'&&value!=='credits,videos,recommendations')throw Error('Invalid details request');
    if(name==='watch_region'&&!['PH','US','GB','CA','AU','IN','JP'].includes(value))throw Error('Invalid region');
    if(name==='with_watch_providers'&&!/^[1-9]\d{0,7}$/.test(value))throw Error('Invalid provider');
    if(name==='with_watch_monetization_types'&&value!=='flatrate')throw Error('Invalid availability');
    if(name==='sort_by'&&value!=='popularity.desc')throw Error('Invalid sorting');
    out.set(name,value);
  }return out;
}
module.exports={endpoint,query};
