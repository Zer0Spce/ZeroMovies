'use strict';
(()=>{
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const style=document.createElement('style');
  style.textContent=`
  #zero-filmography-page{position:fixed;inset:0;z-index:1000;background:var(--bg);color:var(--ink);overflow:auto;padding:28px 34px 44px;display:none}
  #zero-filmography-page.open{display:block}
  #zero-filmography-page .film-head{position:sticky;top:0;z-index:3;display:flex;align-items:center;gap:16px;padding:10px 0 18px;background:linear-gradient(var(--bg) 75%,transparent)}
  #zero-filmography-page .film-head h1{margin:0;font-size:30px}
  #zero-filmography-page .film-head p{margin:4px 0 0}
  #zero-filmography-page .film-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:22px 16px}
  #zero-filmography-page .film-card{padding:0;border:0;background:transparent;text-align:left;color:var(--ink)}
  #zero-filmography-page .film-card:hover{background:transparent;transform:translateY(-3px)}
  #zero-filmography-page .film-card:focus-visible{outline:3px solid var(--mint);outline-offset:4px}
  #zero-filmography-page .film-card img{width:100%;aspect-ratio:2/3;object-fit:cover;border-radius:13px;background:var(--surface)}
  #zero-filmography-page .film-card strong{display:block;margin-top:9px;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  #zero-filmography-page .film-card small{display:block;margin-top:4px;color:var(--muted)}
  @media(max-width:760px){#zero-filmography-page{padding:18px 16px 32px}#zero-filmography-page .film-grid{grid-template-columns:repeat(auto-fill,minmax(120px,1fr))}}
  `;
  document.head.appendChild(style);

  const page=document.createElement('section');page.id='zero-filmography-page';page.setAttribute('aria-hidden','true');document.body.appendChild(page);
  let previousFocus=null,previousDetailOpen=false;
  function close(){page.classList.remove('open');page.setAttribute('aria-hidden','true');document.body.style.overflow='';if(previousDetailOpen&&!document.querySelector('#detail')?.open)document.querySelector('#detail')?.showModal?.();previousFocus?.focus?.();}
  async function open(personId,name){
    previousFocus=document.activeElement;const detail=document.querySelector('#detail');previousDetailOpen=!!detail?.open;if(detail?.open)detail.close();
    document.body.style.overflow='hidden';page.classList.add('open');page.setAttribute('aria-hidden','false');page.innerHTML='<div class="film-head"><button data-film-back>‹ Back</button><div><h1>'+esc(name)+'</h1><p>Loading movies & TV series…</p></div></div>';
    page.querySelector('[data-film-back]').onclick=close;
    try{
      const data=await window.zero.api('/person/'+Number(personId)+'/combined_credits',{}),seen=new Set(),rows=[];
      for(const raw of data?.cast||[]){const type=raw.media_type;if(!['movie','tv'].includes(type)||raw.adult||!raw.id||!raw.poster_path)continue;const key=type+':'+raw.id;if(seen.has(key))continue;seen.add(key);rows.push({id:raw.id,type,title:raw.title||raw.name||'Untitled',poster:'https://image.tmdb.org/t/p/w342'+raw.poster_path,year:String(raw.release_date||raw.first_air_date||'').slice(0,4),pop:Number(raw.popularity)||0,votes:Number(raw.vote_count)||0});}
      rows.sort((a,b)=>(b.pop+b.votes*.03)-(a.pop+a.votes*.03));
      page.innerHTML='<div class="film-head"><button data-film-back>‹ Back</button><div><h1>'+esc(name)+'</h1><p>'+rows.length+' movies & TV series</p></div></div><div class="film-grid">'+rows.map(row=>'<button class="film-card" data-title="'+esc(row.title)+'"><img loading="lazy" src="'+row.poster+'" alt=""><strong>'+esc(row.title)+'</strong><small>'+(row.type==='tv'?'TV Series':'Movie')+(row.year?' · '+row.year:'')+'</small></button>').join('')+'</div>';
      page.querySelector('[data-film-back]').onclick=close;
      page.querySelectorAll('.film-card').forEach(card=>card.onclick=()=>{const q=document.querySelector('#query'),form=document.querySelector('#search-form');close();if(q&&form){q.value=card.dataset.title;form.requestSubmit();}});
      page.querySelector('[data-film-back]')?.focus();
    }catch(error){page.innerHTML='<div class="film-head"><button data-film-back>‹ Back</button><div><h1>'+esc(name)+'</h1><p>Filmography unavailable. '+esc(error?.message||'Try again.')+'</p></div></div>';page.querySelector('[data-film-back]').onclick=close;}
  }

  document.addEventListener('click',event=>{const person=event.target.closest?.('.cast-person[data-person-id]');if(!person)return;event.preventDefault();event.stopImmediatePropagation();const name=person.querySelector('span')?.textContent||person.getAttribute('aria-label')?.replace(/^Show titles with /,'')||'Filmography';open(person.dataset.personId,name);},true);
  document.addEventListener('keydown',event=>{if(page.classList.contains('open')&&event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();close();}},true);
})();
