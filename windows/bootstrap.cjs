const {app}=require('electron');
if(process.platform==='win32')app.commandLine.appendSwitch('disable-direct-composition-video-overlays');
const versions=require('./version-manager.cjs');
if(!versions.maybeLaunchCurrent(app)){
  require('./updater.cjs').install();
  require('./main.cjs');
}
