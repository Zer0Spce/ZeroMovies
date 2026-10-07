from pathlib import Path

p=Path('windows/ui/app.js')
s=p.read_text()
def rep(old,new,label):
    global s
    if old not in s:
        raise SystemExit(f'{label}: expected source not found')
    s=s.replace(old,new,1)

rep("let state,category='Home',libraryTab='Continue watching',page=1,request=0,detailRequest=0,heroIndex=0,heroTimer,heroPaused=false,providerType='movie',providerId,providerName,homeData={},activeDetail;",
    "let state,category='Home',libraryTab='Continue watching',page=1,request=0,detailRequest=0,heroIndex=0,heroTimer,heroPaused=false,providerType='movie',providerId,providerName,homeData={},activeDetail,surpriseDetail=false;",
    'surprise state')
rep('const categoryLanguages={"-101": "ja", "-102": "ko", "-103": "tl", "-104": "fr", "-105": "es", "-106": "hi"};',
    'const categoryLanguages={"-101":"ja","-102":"ko","-103":"tl","-104":"fr","-105":"es","-106":"hi","-107":"zh","-108":"th","-109":"id","-110":"pt","-111":"de","-112":"it","-113":"tr"};const categoryArtworkUsed=new Set();',
    'expanded languages')
rep("async function surpriseMovie(){const button=$('[data-action=\"surprise\"]'),token=request;button.disabled=true;try{const item=await window.zero.surprise();if(token!==request)return;titles.set(key(item),item);await details(item);}catch(error){toast(error.message);}finally{button.disabled=false;}}",
    "async function surpriseMovie(){const button=$('[data-action=\"surprise\"]'),token=request;button.disabled=true;try{const item=await window.zero.surprise();if(token!==request)return;titles.set(key(item),item);surpriseDetail=true;await details(item);}catch(error){toast(error.message);}finally{button.disabled=false;}}",
    'surprise details')
rep('async function renderCategories(){const token=++request;busy();try{',
    'async function renderCategories(){const token=++request;categoryArtworkUsed.clear();busy();try{',
    'category art reset')
rep('{id:-106,name:"Hindi titles"}',
    '{id:-106,name:"Hindi titles"},{id:-107,name:"Chinese titles"},{id:-108,name:"Thai titles"},{id:-109,name:"Indonesian titles"},{id:-110,name:"Portuguese titles"},{id:-111,name:"German titles"},{id:-112,name:"Italian titles"},{id:-113,name:"Turkish titles"}',
    'category expansion')
rep("<button data-share=\"${key(item)}\">TMDB page</button></div>${item.type==='tv'?",
    "<button data-share=\"${key(item)}\">TMDB page</button>${surpriseDetail?'<button class=\"surprise-again\" data-action=\"surprise-again\">🎲 Surprise me again</button>':''}</div>${item.type==='tv'?",
    'surprise again button')
rep("cast.map(person=>`<div class=\"cast-person\"><img loading=\"lazy\" src=\"${escape(art(person.profile_path))}\" alt=\"\"><span>${escape(person.name)}</span></div>`).join('')",
    "cast.map(person=>`<button class=\"cast-person\" data-person=\"${Number(person.id)}\" data-person-name=\"${escape(person.name)}\" aria-label=\"Show titles starring ${escape(person.name)}\"><img loading=\"lazy\" src=\"${escape(art(person.profile_path))}\" alt=\"\"><span>${escape(person.name)}</span></button>`).join('')",
    'cast buttons')
needle='async function loadEpisodes(item,token,resume){'
person="""async function personCredits(id,name){const token=++detailRequest;$('#detail-body').innerHTML='<div class=\"settings-body\"><h2>'+escape(name)+'</h2><p>Loading filmography…</p></div>';try{const data=await api('/person/'+id+'/combined_credits');if(token!==detailRequest||!$('#detail').open)return;const seen=new Set(),credits=list({results:data.cast||[]}).filter(item=>{const k=key(item);if(seen.has(k))return false;seen.add(k);return true;}).sort((a,b)=>(b.popularity||0)-(a.popularity||0)).slice(0,32);$('#detail-body').innerHTML='<div class=\"settings-body person-credits\"><div class=\"section-head\"><div><span class=\"eyebrow\">CAST FILMOGRAPHY</span><h2>'+escape(name)+'</h2></div><button data-action=\"person-back\">← Back to title</button></div>'+(credits.length?'<div class=\"grid\">'+credits.map(item=>card(item)).join('')+'</div>':'<p>No movie or series credits were returned.</p>')+'</div>';}catch(error){if(token===detailRequest)$('#detail-body').innerHTML='<div class=\"settings-body\"><h2>'+escape(name)+'</h2><p>'+escape(error.message)+'</p><button data-action=\"person-back\">← Back to title</button></div>';}}
"""
if needle not in s:
    raise SystemExit('person credits insertion point missing')
s=s.replace(needle,person+needle,1)
rep("if(target.dataset.detail){const item=titles.get(target.dataset.detail);if(item)await details(item);return;}",
    "if(target.dataset.person){await personCredits(Number(target.dataset.person),target.dataset.personName||'Cast member');return;}\n  if(target.dataset.detail){surpriseDetail=false;const item=titles.get(target.dataset.detail);if(item)await details(item);return;}",
    'person click handler')
rep("else if(action==='close'){$('#detail').close();++detailRequest;if(category==='Home')await renderHome();else observePaging();}",
    "else if(action==='close'){surpriseDetail=false;$('#detail').close();++detailRequest;if(category==='Home')await renderHome();else observePaging();}\n  else if(action==='person-back'){if(activeDetail)await details(activeDetail);}\n  else if(action==='surprise-again')await surpriseMovie();",
    'temporary actions')
old="async function genreArtwork(node,type,id,token){try{const data=await api('/discover/'+type,{...(id<=-101?{with_original_language:categoryLanguages[id]}:{with_genres:Math.abs(id)}),...(id===-16?{with_original_language:'ja'}:{}),page:1,sort_by:'popularity.desc'});if(token!==request||!node.isConnected)return;const example=(data.results||[]).find(r=>art(r.backdrop_path,'w1280')||art(r.poster_path,'w500'));if(!example)return;const img=document.createElement('img');img.className='genre-art';img.loading='lazy';img.alt='';img.src=art(example.backdrop_path,'w1280')||art(example.poster_path,'w500');node.prepend(img);}catch{}}"
new="async function genreArtwork(node,type,id,token){try{const data=await api('/discover/'+type,{...(id<=-101?{with_original_language:categoryLanguages[id]}:{with_genres:Math.abs(id)}),...(id===-16?{with_original_language:'ja'}:{}),page:1,sort_by:'popularity.desc'});if(token!==request||!node.isConnected)return;const rows=(data.results||[]).filter(r=>art(r.backdrop_path,'w1280')||art(r.poster_path,'w500'));const example=rows.find(r=>{const u=art(r.backdrop_path,'w1280')||art(r.poster_path,'w500');return u&&!categoryArtworkUsed.has(u);})||rows[0];if(!example)return;const src=art(example.backdrop_path,'w1280')||art(example.poster_path,'w500');categoryArtworkUsed.add(src);const img=document.createElement('img');img.className='genre-art';img.loading='lazy';img.alt='';img.src=src;node.prepend(img);}catch{}}"
rep(old,new,'unique category art')
p.write_text(s)

p=Path('windows/core.cjs')
s=p.read_text()
old="function endpoint(path){return typeof path==='string'&&(/^\\/(trending\\/all\\/week|movie\\/(popular|top_rated|now_playing|upcoming)|tv\\/popular|search\\/multi|watch\\/providers\\/(movie|tv)|discover\\/(movie|tv)|genre\\/(movie|tv)\\/list)$/.test(path)||/^\\/(movie|tv)\\/[1-9]\\d{0,9}(\\/season\\/\\d{1,4})?$/.test(path));}"
new="function endpoint(path){return typeof path==='string'&&(/^\\/(trending\\/all\\/week|movie\\/(popular|top_rated|now_playing|upcoming)|tv\\/popular|search\\/multi|watch\\/providers\\/(movie|tv)|discover\\/(movie|tv)|genre\\/(movie|tv)\\/list)$/.test(path)||/^\\/(movie|tv)\\/[1-9]\\d{0,9}(\\/season\\/\\d{1,4})?$/.test(path)||/^\\/person\\/[1-9]\\d{0,9}\\/combined_credits$/.test(path));}"
if old not in s:
    raise SystemExit('core endpoint source missing')
p.write_text(s.replace(old,new,1))

p=Path('windows/ui/index.html')
s=p.read_text()
old='<main><header><div><span id="eyebrow">WELCOME TO YOUR SCREEN</span>'
new='<main><header><div class="header-wordmark" aria-label="ZeroPlay"><span>Zero</span><b>Play</b></div><div><span id="eyebrow">WELCOME TO YOUR SCREEN</span>'
if old not in s:
    raise SystemExit('header insertion source missing')
p.write_text(s.replace(old,new,1))

p=Path('windows/ui/style.css')
s=p.read_text().replace('.brand{color:white;', '.brand{color:var(--ink);',1)
s += '''\n/* Audited 2.0 fixes 19-22 */
.cast-person{border:0;background:transparent;padding:4px;color:var(--muted);border-radius:12px}.cast-person:hover,.cast-person:focus-visible{background:color-mix(in srgb,var(--surface) 88%,transparent);color:var(--ink);transform:translateY(-2px)}
.genre-grid button{position:relative;overflow:hidden;min-height:150px;padding:0;border-radius:18px;background:var(--surface);isolation:isolate}.genre-grid .genre-art{position:absolute;inset:-8px;width:calc(100% + 16px);height:calc(100% + 16px);object-fit:cover;filter:blur(2.5px) saturate(.9);opacity:.68;z-index:-2;transform:scale(1.04)}.genre-grid button:after{content:"";position:absolute;inset:0;background:linear-gradient(0deg,color-mix(in srgb,var(--bg) 94%,transparent),color-mix(in srgb,var(--bg) 10%,transparent));z-index:-1}.genre-caption{position:absolute!important;left:18px;right:18px;bottom:16px;margin:0!important;font-size:22px!important;font-weight:800!important;color:var(--mint)!important;text-shadow:0 2px 12px #000}.genre-caption span{font-size:11px!important;font-weight:700!important;color:var(--ink)!important;margin-top:5px!important}.person-credits{min-width:min(980px,86vw)}.surprise-again{border-color:color-mix(in srgb,var(--mint) 55%,transparent)}
.header-wordmark{display:none;flex:0 0 auto!important;font-size:18px;font-weight:800;letter-spacing:.04em;white-space:nowrap}.header-wordmark span{color:var(--ink)}.header-wordmark b{color:var(--mint)}
:root[data-layout="youtube"] .header-wordmark{display:block}:root[data-layout="youtube"] main>header:before{content:none!important}
'''
p.write_text(s)
