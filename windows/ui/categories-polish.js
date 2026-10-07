'use strict';
(()=>{
  if(!document.querySelector('link[data-zero-card-presentation]')){const link=document.createElement('link');link.rel='stylesheet';link.href='card-presentation.css';link.dataset.zeroCardPresentation='1';document.head.appendChild(link);}
  const style=document.createElement('style');style.textContent=`
  .genre-grid{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:12px!important;margin:20px 0 34px!important}
  .genre-grid>button,.zero-category-extra{position:relative!important;height:140px!important;min-height:140px!important;overflow:hidden!important;isolation:isolate!important;border-radius:10px!important;border:2px solid transparent!important;padding:3px!important;text-align:left!important;background:var(--surface)!important;box-shadow:none!important;transform:none!important}
  .genre-grid>button .genre-art,.zero-category-extra .genre-art{position:absolute!important;inset:-8px!important;width:calc(100% + 16px)!important;height:calc(100% + 16px)!important;max-width:none!important;object-fit:cover!important;z-index:0!important;opacity:.96!important;filter:blur(3px) saturate(1.04)!important;transform:scale(1.045)!important;pointer-events:none!important;will-change:filter,transform!important}
  .genre-grid>button::before,.zero-category-extra::before{display:none!important}
  .genre-grid>button::after,.zero-category-extra::after{content:""!important;position:absolute!important;inset:0!important;z-index:1!important;background:linear-gradient(180deg,rgba(16,24,36,.12) 0%,rgba(12,16,25,.90) 100%)!important;pointer-events:none!important}
  .genre-grid .genre-caption,.zero-category-extra .genre-caption{position:absolute!important;left:14px!important;right:14px!important;bottom:14px!important;z-index:2!important;display:block!important;margin:0!important;color:#fff!important;font-size:19px!important;line-height:1.1!important;font-weight:800!important;letter-spacing:0!important;text-shadow:0 2px 10px rgba(0,0,0,.75)!important}
  .genre-grid .genre-caption>span,.zero-category-extra .genre-caption>span{display:block!important;margin-top:5px!important;color:#b8d5ce!important;font-size:12px!important;line-height:1.1!important;font-weight:600!important;letter-spacing:0!important;opacity:1!important}
  .genre-grid>button:hover,.zero-category-extra:hover{transform:none!important;border-color:var(--mint)!important;background:var(--surface)!important}
  .genre-grid>button:focus-visible,.zero-category-extra:focus-visible{outline:none!important;border-color:var(--mint)!important;transform:none!important;box-shadow:0 0 0 2px color-mix(in srgb,var(--mint) 22%,transparent)!important}
  [data-theme="light"] .genre-grid>button::after,[data-theme="light"] .zero-category-extra::after{background:linear-gradient(180deg,rgba(16,24,36,.08) 0%,rgba(12,16,25,.78) 100%)!important}
  @media(max-width:1050px){.genre-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}}
  @media(max-width:650px){.genre-grid{grid-template-columns:1fr!important}.genre-grid>button,.zero-category-extra{height:120px!important;min-height:120px!important}.genre-grid .genre-caption,.zero-category-extra .genre-caption{font-size:16px!important}}
  `;document.head.appendChild(style);

  const languageByName={
    'japanese titles':'ja','korean titles':'ko','filipino titles':'tl','french titles':'fr','spanish titles':'es','hindi titles':'hi',
    'chinese titles':'zh','thai titles':'th','indonesian titles':'id','portuguese titles':'pt','german titles':'de','italian titles':'it','turkish titles':'tr'
  };
  const tmdbArt=(row,size)=>{const path=row?.backdrop_path||row?.poster_path;return /^\/[A-Za-z\d_.-]+$/.test(path||'')?'https://image.tmdb.org/t/p/'+size+path:'';};
  function activeType(){return document.querySelector('[data-genre-type].selected')?.dataset.genreType||'movie';}
  function cardHash(value){let hash=0;for(const char of String(value||''))hash=(hash*31+char.charCodeAt(0))>>>0;return hash;}
  function attachArt(card,src){if(!src||card.querySelector('.genre-art'))return false;const img=document.createElement('img');img.className='genre-art';img.loading='lazy';img.decoding='async';img.alt='';img.src=src;card.prepend(img);return true;}
  async function repairArtwork(card){
    if(!card?.isConnected||card.querySelector('.genre-art')||card.dataset.zeroArtworkTried==='1'||!window.zero?.api)return;
    card.dataset.zeroArtworkTried='1';const type=activeType(),id=Number(card.dataset.genre),name=String(card.dataset.name||card.querySelector('.genre-caption')?.firstChild?.textContent||'').trim().toLowerCase(),language=languageByName[name];
    const base={sort_by:'popularity.desc'};if(language)base.with_original_language=language;else if(id===-16){base.with_genres=16;base.with_original_language='ja';}else if(Number.isSafeInteger(id)&&id>0)base.with_genres=id;
    try{
      for(const page of [1,2,3]){
        const data=await window.zero.api('/discover/'+type,{...base,page});if(!card.isConnected||card.querySelector('.genre-art'))return;
        const rows=(data?.results||[]).filter(row=>tmdbArt(row,'w780'));if(rows.length){const pick=rows[cardHash(name)%rows.length];if(attachArt(card,tmdbArt(pick,'w780')))return;}
      }
      const fallback=await window.zero.api(type==='tv'?'/tv/popular':'/movie/popular',{page:1});if(!card.isConnected||card.querySelector('.genre-art'))return;const rows=(fallback?.results||[]).filter(row=>tmdbArt(row,'w780'));if(rows.length){const pick=rows[cardHash(name)%rows.length];attachArt(card,tmdbArt(pick,'w780'));}
    }catch{}
  }
  function scheduleArtwork(card){if(card.querySelector('.genre-art')||card.dataset.zeroArtworkScheduled==='1')return;card.dataset.zeroArtworkScheduled='1';setTimeout(()=>{delete card.dataset.zeroArtworkScheduled;if(!card.querySelector('.genre-art'))repairArtwork(card);},900);}
  function polish(){
    const flix=document.querySelector('#ui-layout option[value="flix"]');if(flix&&flix.textContent!=='Flix UI - Beta')flix.textContent='Flix UI - Beta';
    document.querySelectorAll('.genre-grid>button,.zero-category-extra').forEach(card=>{card.classList.add('zero-category-card');const caption=card.querySelector('.genre-caption');if(caption&&!caption.querySelector(':scope > span')){const hint=document.createElement('span');hint.textContent='Explore →';caption.appendChild(hint);}scheduleArtwork(card);});
  }
  new MutationObserver(polish).observe(document.body,{childList:true,subtree:true});polish();
  for(const [src,tag] of [['filmography-page.js','zero-filmography'],['omdb-ratings.js','zero-omdb']])if(!document.querySelector('script[data-'+tag+']')){const script=document.createElement('script');script.src=src;script.setAttribute('data-'+tag,'1');document.head.appendChild(script);}
})();
