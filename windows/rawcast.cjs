'use strict';
// RawCast is invoked only for selected RawCast playback; never catalog or trailers.
const BASE='https://api.rawcast.space/v1';
class RawCast {
  constructor(getKey,fetcher=fetch,onUsage=()=>{}){this.getKey=getKey;this.fetch=fetcher;this.onUsage=onUsage;this.streamCache=new Map();this.usage=null;this.generation=0;}
  hasKey(){return !!this.getKey();}
  clear(){this.generation++;this.streamCache.clear();this.usage=null;}
  async request(route){const key=this.getKey();if(!key)throw Object.assign(Error('RawCast API key required. Add your own key in Settings → RawCast API.'),{code:'KEY_REQUIRED'});let response;try{response=await this.fetch(BASE+route,{headers:{'X-API-Key':key,Accept:'application/json'},signal:AbortSignal.timeout(30000),redirect:'error'});}catch{throw Error('RawCast connection failed. Try again.');}
    if(key!==this.getKey())throw Error('RawCast configuration changed. Try again.');
    const limit=Number(response.headers.get('X-RateLimit-Limit')),remaining=Number(response.headers.get('X-RateLimit-Remaining')),reset=Number(response.headers.get('X-RateLimit-Reset'));
    if(response.headers.has('X-RateLimit-Limit')&&response.headers.has('X-RateLimit-Remaining')&&Number.isFinite(limit)&&limit>0&&Number.isFinite(remaining)&&remaining>=0){this.usage={limit,remaining,used:Math.max(0,limit-remaining),percent:Math.max(0,Math.min(100,(limit-remaining)/limit*100)),...(reset>0?{reset:reset*1000}:{}),at:Date.now()};this.onUsage(this.usage);}
    let data={};try{data=await response.json();}catch{if(response.ok)throw Error('RawCast returned an unreadable response. Try again.');}
    if(!response.ok){const messages={401:'RawCast API key rejected.',403:'RawCast API key is unavailable or your account requires verification.',404:'Unavailable for Download.',429:'RawCast rate or monthly request limit reached. Try again later.',502:'RawCast could not resolve this download. Try again later.'};throw Object.assign(Error(messages[response.status]||'RawCast request failed. Try again.'),{status:response.status,retryAfter:Math.min(3600,Number(response.headers.get('Retry-After'))||0)});}
    return data;
  }
  async stream(item,episode={}){if(!['movie','tv'].includes(item?.type)||!Number.isSafeInteger(item.id)||item.id<1)throw Error('Invalid playback title');const ep=item.type==='tv'?{season:episode.season??1,episode:episode.episode??1}:{};if(item.type==='tv'&&(!Number.isSafeInteger(ep.season)||ep.season<0||ep.season>1000||!Number.isSafeInteger(ep.episode)||ep.episode<1||ep.episode>10000))throw Error('Select a season and episode first.');const route='/sources/'+item.type+'/'+item.id+(item.type==='tv'?'/'+ep.season+'/'+ep.episode:'');const cached=this.streamCache.get(route);if(cached?.until>Date.now())return cached.value;const epoch=this.generation;const data=await this.request(route);for(const server of data.servers||[])for(const stream of server.streams||[]){let url;try{url=new URL(stream.manifestUrl);}catch{continue;}if(url.protocol!=='https:'||url.username||url.password)continue;if(epoch!==this.generation)throw Error('RawCast configuration changed. Try again.');const value={url:url.href,mime:/\.mpd(?:$|\?)/i.test(url.href)||String(stream.type||stream.format||'').toLowerCase().includes('dash')?'application/dash+xml':'application/x-mpegURL'};this.streamCache.set(route,{value,until:Date.now()+120000});return value;}throw Error('RawCast stream unavailable. Choose another source.');}
  // No account endpoint is documented for API-key auth. A tiny documented metadata
  // request refreshes authoritative quota headers when the provider supplies them.
  async refreshUsage(){await this.request('/meta/movie/550?lang=en-US');return this.usage;}
  async test(){await this.request('/meta/movie/550?lang=en-US');return {status:'Connected',usage:this.usage};}
}
module.exports={RawCast};
