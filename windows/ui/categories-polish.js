'use strict';
(()=>{
  const style=document.createElement('style');
  style.textContent=`
  .genre-grid{
    display:grid!important;
    grid-template-columns:repeat(auto-fill,minmax(250px,1fr))!important;
    gap:18px!important;
    margin:26px 0 34px!important;
  }
  .genre-grid>button,
  .zero-category-extra{
    position:relative!important;
    min-height:158px!important;
    overflow:hidden!important;
    isolation:isolate!important;
    border-radius:18px!important;
    border:1px solid color-mix(in srgb,var(--ink) 13%,transparent)!important;
    padding:0!important;
    text-align:left!important;
    background-color:color-mix(in srgb,var(--surface) 80%,var(--bg))!important;
    background-size:cover!important;
    background-position:center!important;
    box-shadow:0 12px 28px #0003!important;
    transform:translateZ(0);
  }
  .genre-grid>button::before,
  .zero-category-extra::before{
    content:""!important;
    position:absolute!important;
    inset:-12px!important;
    z-index:-2!important;
    background-image:inherit!important;
    background-size:cover!important;
    background-position:center!important;
    filter:blur(8px) saturate(1.08)!important;
    transform:scale(1.08)!important;
    opacity:.92!important;
  }
  .genre-grid>button::after,
  .zero-category-extra::after{
    content:""!important;
    position:absolute!important;
    inset:0!important;
    z-index:-1!important;
    background:linear-gradient(180deg,rgba(0,0,0,.10) 0%,rgba(0,0,0,.30) 44%,rgba(0,0,0,.86) 100%)!important;
  }
  .genre-grid .genre-caption,
  .zero-category-extra .genre-caption{
    position:absolute!important;
    left:20px!important;
    right:20px!important;
    bottom:18px!important;
    z-index:2!important;
    display:block!important;
    margin:0!important;
    color:var(--mint)!important;
    font-size:24px!important;
    line-height:1.05!important;
    font-weight:800!important;
    letter-spacing:-.025em!important;
    text-shadow:0 2px 12px rgba(0,0,0,.8)!important;
  }
  .genre-grid .genre-caption>span,
  .zero-category-extra .genre-caption>span{
    display:block!important;
    margin-top:8px!important;
    color:#fff!important;
    font-size:12px!important;
    line-height:1!important;
    font-weight:700!important;
    letter-spacing:.02em!important;
    opacity:.86!important;
  }
  .genre-grid>button:hover,
  .zero-category-extra:hover{
    transform:translateY(-3px) scale(1.01)!important;
    border-color:color-mix(in srgb,var(--mint) 65%,transparent)!important;
  }
  .genre-grid>button:focus-visible,
  .zero-category-extra:focus-visible{
    outline:3px solid var(--mint)!important;
    outline-offset:3px!important;
    transform:scale(1.025)!important;
  }
  [data-theme="light"] .genre-grid>button::after,
  [data-theme="light"] .zero-category-extra::after{
    background:linear-gradient(180deg,rgba(0,0,0,.04) 0%,rgba(0,0,0,.18) 45%,rgba(10,18,26,.78) 100%)!important;
  }
  @media(max-width:900px){
    .genre-grid{grid-template-columns:repeat(auto-fill,minmax(210px,1fr))!important}
    .genre-grid>button,.zero-category-extra{min-height:138px!important}
    .genre-grid .genre-caption,.zero-category-extra .genre-caption{font-size:21px!important}
  }
  `;
  document.head.appendChild(style);

  function polish(){
    document.querySelectorAll('.genre-grid>button,.zero-category-extra').forEach(card=>{
      card.classList.add('zero-category-card');
      const caption=card.querySelector('.genre-caption');
      if(caption&&!caption.querySelector(':scope > span')){
        const hint=document.createElement('span');
        hint.textContent='Explore →';
        caption.appendChild(hint);
      }
    });
  }
  new MutationObserver(polish).observe(document.body,{childList:true,subtree:true});
  polish();

  // Keep the filmography implementation isolated while loading it as part of the desktop UI bundle.
  if(!document.querySelector('script[data-zero-filmography]')){
    const script=document.createElement('script');script.src='filmography-page.js';script.dataset.zeroFilmography='1';document.head.appendChild(script);
  }
})();
