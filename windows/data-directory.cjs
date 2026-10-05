const fs=require('node:fs'),path=require('node:path');
function dataDirectory(appData){
  // Retain libraries from either historical Electron app-name convention.
  const legacy=['zerostreams-windows','ZeroStreams'].map(name=>path.join(appData,name));
  return legacy.find(dir=>fs.existsSync(path.join(dir,'library.json')))||legacy[0];
}
module.exports={dataDirectory};
