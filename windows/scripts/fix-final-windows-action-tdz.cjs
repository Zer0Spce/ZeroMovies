'use strict';
const fs=require('node:fs');
const path=require('node:path');
const file=path.resolve(__dirname,'..','ui','app.js');
let app=fs.readFileSync(file,'utf8');
const fixes=[
  ["if(action==='source-keep')", "if(target.dataset.action==='source-keep')"],
  ["if(action==='source-once')", "if(target.dataset.action==='source-once')"],
  ["if(action==='source-cancel')", "if(target.dataset.action==='source-cancel')"]
];
for(const [from,to] of fixes){
  if(app.includes(from)) app=app.replace(from,to);
  else if(!app.includes(to)) throw new Error('Missing Windows source-confirmation marker: '+from);
}
fs.writeFileSync(file,app);
console.log('Fixed Windows source-confirmation action TDZ.');
