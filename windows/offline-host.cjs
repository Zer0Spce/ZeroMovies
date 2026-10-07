'use strict';
class OfflineHost{
 constructor(main,view){this.main=main;this.view=view;this.closed=false;this.beforeFullscreen=main.isFullScreen();this.manualFullscreen=this.beforeFullscreen;this.htmlFullscreen=false;this.resize=()=>this.layout();this.enter=()=>{this.htmlFullscreen=true;main.setFullScreen(true);this.layout();};this.leave=()=>{this.htmlFullscreen=false;main.setFullScreen(this.manualFullscreen);this.layout();};main.contentView.addChildView(view);for(const event of ['resize','enter-full-screen','leave-full-screen'])main.on(event,this.resize);view.webContents.on('enter-html-full-screen',this.enter);view.webContents.on('leave-html-full-screen',this.leave);this.layout();}
 layout(){if(this.closed||this.main.isDestroyed())return;const [width,height]=this.main.getContentSize();this.view.setBounds({x:0,y:0,width,height});}
 activity(){}
 async exitFullscreen(){this.manualFullscreen=false;this.htmlFullscreen=false;for(const frame of this.view.webContents.mainFrame.framesInSubtree)await frame.executeJavaScript('if(document.fullscreenElement)document.exitFullscreen().catch(()=>{});').catch(()=>{});if(!this.closed){this.main.setFullScreen(false);this.layout();}}
 async toggleFullscreen(){if(this.main.isFullScreen()||this.htmlFullscreen)return this.exitFullscreen();this.manualFullscreen=true;this.main.setFullScreen(true);this.layout();}
 close(){if(this.closed)return;this.closed=true;for(const event of ['resize','enter-full-screen','leave-full-screen'])this.main.removeListener(event,this.resize);this.view.webContents.removeListener('enter-html-full-screen',this.enter);this.view.webContents.removeListener('leave-html-full-screen',this.leave);if(!this.main.isDestroyed()){this.main.contentView.removeChildView(this.view);this.main.setFullScreen(this.beforeFullscreen);}if(!this.view.webContents.isDestroyed())this.view.webContents.close();}
}
module.exports={OfflineHost};
