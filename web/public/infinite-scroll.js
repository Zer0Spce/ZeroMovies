'use strict';
(() => {
  const content=document.getElementById('content');
  if(!content)return;
  let loading=false,phase='idle',savedGrid=null,savedPaging=null,loadContext='',scheduled=false,blockedUntil=0,retries=0;
  const contextKey=()=>[document.documentElement.dataset.section||'',document.getElementById('heading')?.textContent||'',document.getElementById('query')?.value.trim()||'',document.getElementById('web-filter-bar')?.textContent||''].join('|');
  function hidePaging(paging){if(!paging)return;paging.hidden=true;paging.setAttribute('aria-hidden','true');}
  function nearBottom(){return document.documentElement.scrollHeight-(window.scrollY+window.innerHeight)<2200;}
  function endMarker(){const paging=content.querySelector('.paging');if(!paging||paging.querySelector('[data-action="next-page"]')||content.querySelector('.infinite-end'))return;const marker=document.createElement('div');marker.className='infinite-end';marker.textContent='You reached the end of these results.';paging.after(marker);}
  function reset(keepRetry=false){loading=false;phase='idle';savedGrid=null;savedPaging=null;loadContext='';content.style.minHeight='';if(!keepRetry)retries=0;}
  function restoreWhileLoading(){if(phase!=='waiting-skeleton'||!savedGrid||!content.querySelector('.skeleton'))return false;const loader=document.createElement('div');loader.className='paging';loader.id='infinite-loader';loader.setAttribute('role','status');loader.textContent=retries?'Retrying…':'Loading more titles…';content.replaceChildren(savedGrid,loader);phase='waiting-page';return true;}
  function mergeLoadedPage(){
    if(phase!=='waiting-page')return false;
    if(loadContext!==contextKey()){reset();return true;}
    const newGrid=content.querySelector('.grid'),paging=content.querySelector('.paging');
    if(newGrid&&paging&&newGrid!==savedGrid){
      const existing=new Set([...savedGrid.querySelectorAll('[data-detail],[data-web-open]')].map(node=>node.dataset.detail||node.dataset.webOpen));
      for(const card of [...newGrid.children]){const id=card.dataset?.detail||card.dataset?.webOpen||'';if(!id||!existing.has(id)){if(id)existing.add(id);savedGrid.appendChild(card);}}
      content.replaceChildren(savedGrid,paging);hidePaging(paging);reset();endMarker();scheduleCheck();return true;
    }
    const empty=content.querySelector('.empty');
    if(empty&&!content.querySelector('.skeleton')){
      const retryPaging=paging||savedPaging;content.replaceChildren(savedGrid);if(retryPaging){content.appendChild(retryPaging);hidePaging(retryPaging);}retries++;
      if(retries<=2&&retryPaging?.querySelector('[data-action="next-page"]')){blockedUntil=Date.now()+900*retries;reset(true);setTimeout(scheduleCheck,950*retries);}else{blockedUntil=Date.now()+5000;reset();const note=document.createElement('div');note.className='infinite-end';note.textContent='Could not load more titles. Scroll again to retry.';content.appendChild(note);}return true;
    }
    return false;
  }
  function loadMore(){if(loading||Date.now()<blockedUntil||document.querySelector('dialog[open]')||!nearBottom())return;const grid=content.querySelector('.grid'),paging=content.querySelector('.paging'),next=paging?.querySelector('[data-action="next-page"]');if(!grid||!paging||!next){endMarker();return;}loading=true;phase='waiting-skeleton';savedGrid=grid;savedPaging=paging.cloneNode(true);loadContext=contextKey();content.style.minHeight=Math.max(content.offsetHeight,window.innerHeight)+'px';const top=window.scrollY;next.click();window.scrollTo({top,behavior:'auto'});}
  function scheduleCheck(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;const paging=content.querySelector('.paging');if(paging&&paging.id!=='infinite-loader')hidePaging(paging);loadMore();});}
  new MutationObserver(()=>{if(loading){if(phase==='waiting-skeleton')restoreWhileLoading();if(phase==='waiting-page')mergeLoadedPage();}if(!loading){const paging=content.querySelector('.paging');if(paging)hidePaging(paging);endMarker();}scheduleCheck();}).observe(content,{childList:true,subtree:false});
  window.addEventListener('scroll',scheduleCheck,{passive:true});window.addEventListener('resize',scheduleCheck,{passive:true});scheduleCheck();
})();
