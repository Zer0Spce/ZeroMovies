// Owns embedded player layout and native fullscreen in the existing app window.
class PlayerHost {
  constructor(main,view,toolbar,options={}){
    this.bottom=!!options.bottom;
    this.main=main;this.view=view;this.toolbar=toolbar;this.closed=false;
    this.beforeFullscreen=main.isFullScreen();this.manualFullscreen=this.beforeFullscreen;this.htmlFullscreen=false;
    this.resize=()=>this.layout();this.enter=()=>{this.htmlFullscreen=true;main.setFullScreen(true);this.layout();};this.leave=()=>{this.htmlFullscreen=false;main.setFullScreen(this.manualFullscreen);this.layout();};
    main.contentView.addChildView(view);main.contentView.addChildView(toolbar);
    for(const event of ['resize','enter-full-screen','leave-full-screen'])main.on(event,this.resize);
    view.webContents.on('enter-html-full-screen',this.enter);view.webContents.on('leave-html-full-screen',this.leave);
    this.layout();this.activity();
  }
  layout(){if(this.closed||this.main.isDestroyed())return;const [width,height]=this.main.getContentSize();this.view.setBounds({x:0,y:0,width,height});this.toolbar.setBounds({x:0,y:this.bottom?Math.max(0,height-44):0,width,height:44});this.toolbar.setVisible((this.bottom||(!this.main.isFullScreen()&&!this.htmlFullscreen))&&!!this.toolbarVisible);}
  activity(){if(this.closed)return;this.toolbarVisible=true;this.layout();clearTimeout(this.idle);this.idle=setTimeout(()=>{this.toolbarVisible=false;this.layout();},3000);}
  async exitFullscreen(){this.manualFullscreen=false;this.htmlFullscreen=false;for(const frame of this.view.webContents.mainFrame.framesInSubtree)await frame.executeJavaScript('if(document.fullscreenElement)document.exitFullscreen().catch(()=>{});').catch(()=>{});if(!this.closed){this.main.setFullScreen(false);this.activity();}}
  async toggleFullscreen(){if(this.main.isFullScreen()||this.htmlFullscreen)return this.exitFullscreen();this.manualFullscreen=true;this.main.setFullScreen(true);this.layout();}
  close(){if(this.closed)return;this.closed=true;clearTimeout(this.idle);for(const event of ['resize','enter-full-screen','leave-full-screen'])this.main.removeListener(event,this.resize);this.view.webContents.removeListener('enter-html-full-screen',this.enter);this.view.webContents.removeListener('leave-html-full-screen',this.leave);if(!this.main.isDestroyed()){this.main.contentView.removeChildView(this.toolbar);this.main.contentView.removeChildView(this.view);this.main.setFullScreen(this.beforeFullscreen);}if(!this.toolbar.webContents.isDestroyed())this.toolbar.webContents.close();if(!this.view.webContents.isDestroyed())this.view.webContents.close();}
}
module.exports={PlayerHost};
