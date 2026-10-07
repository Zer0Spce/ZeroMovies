'use strict';
(()=>{
  if(!document.querySelector('link[data-zero-card-presentation]')){const link=document.createElement('link');link.rel='stylesheet';link.href='card-presentation.css';link.dataset.zeroCardPresentation='1';document.head.appendChild(link);}
  const style=document.createElement('style');style.textContent=`
  .genre-grid{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:12px!important;margin:20px 0 34px!important}
  .genre-grid>button,.zero-category-extra{position:relative!important;height:140px!important;min-height:140px!important;overflow:hidden!important;isolation:isolate!important;border-radius:10px!important;border:2px solid transparent!important;padding:3px!important;text-align:left!important;background:var(--surface)!important;box-shadow:none!important;transform:none!important}
  .genre-grid>button .genre-art,.zero-category-extra .genre-art{position:absolute!important;inset:-3px!important;width:calc(100% + 6px)!important;height:calc(100% + 6px)!important;max-width:none!important;object-fit:cover!important;z-index:0!important;opacity:.94!important;filter:blur(1.1px) saturate(1.03)!important;transform:scale(1.025)!important;pointer-events:none!important}
  .genre-grid>button::before,.zero-category-extra::before{display:none!important}
  .genre-grid>button::after,.zero-category-extra::after{content:""!important;position:absolute!important;inset:0!important;z-index:1!important;background:linear-gradient(180deg,rgba(16,24,36,.13) 0%,rgba(12,16,25,.93) 100%)!important;pointer-events:none!important}
  .genre-grid .genre-caption,.zero-category-extra .genre-caption{position:absolute!important;left:14px!important;right:14px!important;bottom:14px!important;z-index:2!important;display:block!important;margin:0!important;color:#fff!important;font-size:19px!important;line-height:1.1!important;font-weight:800!important;letter-spacing:0!important;text-shadow:0 2px 10px rgba(0,0,0,.75)!important}
  .genre-grid .genre-caption>span,.zero-category-extra .genre-caption>span{display:block!important;margin-top:5px!important;color:#b8d5ce!important;font-size:12px!important;line-height:1.1!important;font-weight:600!important;letter-spacing:0!important;opacity:1!important}
  .genre-grid>button:hover,.zero-category-extra:hover{transform:none!important;border-color:var(--mint)!important;background:var(--surface)!important}
  .genre-grid>button:focus-visible,.zero-category-extra:focus-visible{outline:none!important;border-color:var(--mint)!important;transform:none!important;box-shadow:0 0 0 2px color-mix(in srgb,var(--mint) 22%,transparent)!important}
  [data-theme="light"] .genre-grid>button::after,[data-theme="light"] .zero-category-extra::after{background:linear-gradient(180deg,rgba(16,24,36,.08) 0%,rgba(12,16,25,.82) 100%)!important}
  @media(max-width:1050px){.genre-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}}
  @media(max-width:650px){.genre-grid{grid-template-columns:1fr!important}.genre-grid>button,.zero-category-extra{height:120px!important;min-height:120px!important}.genre-grid .genre-caption,.zero-category-extra .genre-caption{font-size:16px!important}}
  `;document.head.appendChild(style);
  function polish(){const flix=document.querySelector('#ui-layout option[value="flix"]');if(flix&&flix.textContent!=='Flix UI - Beta')flix.textContent='Flix UI - Beta';document.querySelectorAll('.genre-grid>button,.zero-category-extra').forEach(card=>{card.classList.add('zero-category-card');const caption=card.querySelector('.genre-caption');if(caption&&!caption.querySelector(':scope > span')){const hint=document.createElement('span');hint.textContent='Explore →';caption.appendChild(hint);}});}
  new MutationObserver(polish).observe(document.body,{childList:true,subtree:true});polish();
  for(const [src,tag] of [['filmography-page.js','zero-filmography'],['omdb-ratings.js','zero-omdb']])if(!document.querySelector('script[data-'+tag+']')){const script=document.createElement('script');script.src=src;script.setAttribute('data-'+tag,'1');document.head.appendChild(script);}
})();
