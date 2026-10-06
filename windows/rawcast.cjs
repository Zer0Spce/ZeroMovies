'use strict';
// RawCast is intentionally isolated from catalog, trailers and playback providers.
const BASE='https://api.rawcast.space/v1';
class RawCast {
  constructor(getKey,fetcher=fetch,onUsage=()=>{}){this.getKey=getKey;this.fetch=fetcher;this.onUsage=onUsage;this.cache=new Map();this.pending=new Map();this.usage=null;this.generation=0;}
  hasKey(){return !!this.getKey();}
  clear(){this.generation++;this.cache.clear();this.pending.clear();this.usage=null;}
  async request(route){const key=this.getKey();if(!key)throw Object.assign(Error('RawCast API key required. Add your own key in Settings → RawCast API.'),{code:'KEY_REQUIRED'});let response;try{response=await this.fetch(BASE+route,{headers:{'X-API-Key':key,Accept:'application/json'},signal:AbortSignal.timeout(30000),redirect:'error'});}catch{throw Error('RawCast connection failed. Try again.');}
    if(key!==this.getKey())throw Error('RawCast configuration changed. Try again.');
    const limit=Number(response.headers.get('X-RateLimit-Limit')),remaining=Number(response.headers.get('X-RateLimit-Remaining')),reset=Number(response.headers.get('X-RateLimit-Reset'));
    if(response.headers.has('X-RateLimit-Limit')&&response.headers.has('X-RateLimit-Remaining')&&Number.isFinite(limit)&&limit>0&&Number.isFinite(remaining)&&remaining>=0){this.usage={limit,remaining,used:Math.max(0,limit-remaining),percent:Math.max(0,Math.min(100,(limit-remaining)/limit*100)),...(reset>0?{reset:reset*1000}:{}),at:Date.now()};this.onUsage(this.usage);}
    let data={};try{data=await response.json();}catch{if(response.ok)throw Error('RawCast returned an unreadable response. Try again.');}
    if(!response.ok){const messages={401:'RawCast API key rejected.',403:'RawCast API key is unavailable or your account requires verification.',404:'Unavailable for Download.',429:'RawCast rate or monthly request limit reached. Try again later.',502:'RawCast could not resolve this download. Try again later.'};throw Object.assign(Error(messages[response.status]||'RawCast request failed. Try again.'),{status:response.status,retryAfter:Math.min(3600,Number(response.headers.get('Retry-After'))||0)});}
    return data;
  }
  async resolve(item,episode={},quality='1080p',fresh=false){if(!['movie','tv'].includes(item?.type)||!Number.isSafeInteger(item.id)||item.id<1)throw Error('Invalid download title');const season=Number(episode.season),number=Number(episode.episode);if(item.type==='tv'&&(!Number.isSafeInteger(season)||season<0||!Number.isSafeInteger(number)||number<1))throw Error('Select a season and episode first.');if(!['1080p','720p','480p','360p'].includes(quality))throw Error('Invalid download quality');const id=[item.type,item.id,season,number,quality].join(':');if(!fresh&&this.cache.get(id)?.until>Date.now())return this.cache.get(id).value;if(this.pending.has(id))return this.pending.get(id);
    const epoch=this.generation;const task=(async()=>{let data;try{data=await this.request('/download/'+item.type+'/'+item.id+(item.type==='tv'?'/'+season+'/'+number:'')+'?quality='+quality+'&redirect=false');}catch(e){if(e.status===404){this.cache.set(id,{until:Date.now()+300000,value:null});return null;}throw e;}
      // Only the documented direct-file contract is accepted. HLS is never a download.
      const url=data.downloadUrl||data.url;let parsed;try{parsed=new URL(url);}catch{return null;}if(!['mp4','mkv','webm','mov','m4v','ts','mpeg','mpg','flv','avi'].includes(String(data.format).toLowerCase())||parsed.protocol!=='https:'||parsed.username||parsed.password||/\.m3u8(?:$|\?)/i.test(url))return null;
      if(epoch!==this.generation)throw Error('RawCast configuration changed. Try again.');const value={url:parsed.href,format:String(data.format).toLowerCase(),quality:data.quality||quality};this.cache.set(id,{until:Date.now()+120000,value});return value;})();this.pending.set(id,task);try{return await task;}finally{if(this.pending.get(id)===task)this.pending.delete(id);}
  }
  // No account endpoint is documented for API-key auth. A tiny documented metadata
  // request refreshes authoritative quota headers when the provider supplies them.
  async refreshUsage(){await this.request('/meta/movie/550?lang=en-US');return this.usage;}
  async test(){await this.request('/meta/movie/550?lang=en-US');return {status:'Connected',usage:this.usage};}
}
module.exports={RawCast};
