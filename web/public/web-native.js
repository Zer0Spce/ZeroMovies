'use strict';
(() => {
  const key='zerostreams-web-v1';
  try{
    const parsed=JSON.parse(localStorage.getItem(key)||'null');
    if(parsed&&typeof parsed==='object'){
      parsed.settings={...(parsed.settings||{}),uiLayout:'classic'};
      localStorage.setItem(key,JSON.stringify(parsed));
    }
  }catch{}
})();
