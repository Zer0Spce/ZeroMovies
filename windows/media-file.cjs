'use strict';
const MIME={mp4:'video/mp4',mov:'video/quicktime',mkv:'video/x-matroska',webm:'video/webm',ts:'video/mp2t',mpg:'video/mpeg',flv:'video/x-flv',avi:'video/x-msvideo'};
function identify(bytes){if(bytes.length<12)return null;if(bytes.toString('ascii',4,8)==='ftyp')return bytes.toString('ascii',8,12)==='qt  '?'mov':'mp4';if(bytes.readUInt32BE(0)===0x1a45dfa3)return bytes.subarray(0,256).toString('ascii').includes('webm')?'webm':'mkv';if(bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='AVI ')return 'avi';if(bytes.toString('ascii',0,3)==='FLV')return 'flv';if(bytes[0]===0x47&&(bytes.length<189||bytes[188]===0x47))return 'ts';if(bytes.readUInt32BE(0)===0x000001ba)return 'mpg';return null;}
module.exports={MIME,identify};
