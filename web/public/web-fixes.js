'use strict';
(() => {
  const overlayIds=['web-player','settings','detail'];
  let closingFromHistory=false;

  const topOpenDialog=()=>overlayIds.map(id=>document.getElementById(id)).find(node=>node?.open)||null;

  function closeDialogFromHistory(dialog){
    if(!dialog)return;
    closingFromHistory=true;
    try{
      if(dialog.id==='web-player'){
        const cancel=new Event('cancel',{cancelable:true});
        dialog.dispatchEvent(cancel);
      }else{
        dialog.close();
      }
    }finally{
      queueMicrotask(()=>{closingFromHistory=false;});
    }
  }

  const originalShowModal=HTMLDialogElement.prototype.showModal;
  HTMLDialogElement.prototype.showModal=function(){
    const wasOpen=this.open;
    originalShowModal.call(this);
    if(!wasOpen&&overlayIds.includes(this.id)){
      history.pushState({...(history.state||{}),zeroPlayOverlay:this.id},'',location.href);
    }
  };

  window.addEventListener('popstate',()=>{
    const open=topOpenDialog();
    if(open)closeDialogFromHistory(open);
  });

  document.addEventListener('click',event=>{
    const target=event.target.closest('#close-player,[data-action="close"],[data-action="close-settings"]');
    if(!target||closingFromHistory)return;
    const dialog=target.closest('dialog');
    if(!dialog?.open)return;
    if(history.state?.zeroPlayOverlay===dialog.id){
      event.preventDefault();
      event.stopImmediatePropagation();
      history.back();
    }
  },true);

  for(const id of overlayIds){
    const dialog=document.getElementById(id);
    if(!dialog)continue;
    dialog.addEventListener('cancel',event=>{
      if(closingFromHistory||history.state?.zeroPlayOverlay!==dialog.id)return;
      event.preventDefault();
      event.stopImmediatePropagation();
      history.back();
    },true);
  }

  const enforceWebSource=()=>{
    for(const option of document.querySelectorAll('option[value="vidsrc-sh"]'))option.remove();
    for(const select of document.querySelectorAll('#playback-source,.title-source')){
      if(select.value!=='vidstuck')select.value='vidstuck';
    }
  };
  enforceWebSource();
  new MutationObserver(enforceWebSource).observe(document.documentElement,{subtree:true,childList:true});

  const openSource=document.getElementById('open-player-source');
  if(openSource){
    openSource.addEventListener('click',()=>{
      const frame=document.querySelector('#player-stage iframe');
      if(!frame?.src)return;
      const url=new URL(frame.src);
      if(url.protocol!=='https:'||!window.playbackSources?.trusted(url.origin))return;
      window.open(url.href,'_blank','noopener,noreferrer');
    });
  }
})();
