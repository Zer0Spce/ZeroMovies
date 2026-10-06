'use strict';
// parse-torrent returns a hexadecimal string; WebTorrent's debug label must
// not pass that string to the byte-array encoder. This otherwise aborts add/seed.
const fs=require('node:fs'),path=require('node:path');
const file=path.join(__dirname,'../node_modules/webtorrent/lib/torrent.js');
const original='arr2hex(parsedTorrent.infoHash).substring(0, 7)',fixed='parsedTorrent.infoHash.substring(0, 7)';
let source=fs.readFileSync(file,'utf8');
if(source.includes(original)){source=source.split(original).join(fixed);fs.writeFileSync(file,source);}
if(!source.includes(fixed))throw Error('WebTorrent compatibility check failed. Review dependency API before release.');
console.log('Verified WebTorrent hexadecimal info-hash compatibility');
