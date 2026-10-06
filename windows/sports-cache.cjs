const fs=require('node:fs'),path=require('node:path');
// Only retired sports browser caches. Never open cached content or remove user libraries.
function cleanLegacySportsCache(root){const failed=[];const partition=path.join(root,'Partitions','live-sports');for(const name of ['Cache','Code Cache','GPUCache','Service Worker']){try{fs.rmSync(path.join(partition,name),{recursive:true,force:true});}catch{failed.push(name);}}return failed;}
module.exports={cleanLegacySportsCache};
