const {parentPort}=require('node:worker_threads'),jsQR=require('jsqr'),{adQr}=require('./core.cjs');
parentPort.on('message',({raw,width,height})=>{
  let confirmed=false;
  try{const rgba=new Uint8ClampedArray(raw.length);for(let i=0;i<raw.length;i+=4){rgba[i]=raw[i+2];rgba[i+1]=raw[i+1];rgba[i+2]=raw[i];rgba[i+3]=255;}const code=jsQR(rgba,width,height,{inversionAttempts:'dontInvert'});confirmed=!!code&&adQr(code.data);
  }catch{}parentPort.postMessage(confirmed);
});
