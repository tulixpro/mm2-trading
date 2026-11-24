const { app, BrowserWindow, shell } = require('electron');
const path = require('node:path');
// Titan Engine Studio currently uses WebGPU only; no WebGL/software fallback.
app.commandLine.appendSwitch('allow-file-access-from-files');
app.commandLine.appendSwitch('enable-unsafe-webgpu');
function createWindow(){
  const win=new BrowserWindow({
    width:1440,height:900,minWidth:900,minHeight:620,show:false,
    backgroundColor:'#080d14',autoHideMenuBar:true,
    title:'Titan Engine Studio',
    webPreferences:{contextIsolation:true,nodeIntegration:false,sandbox:true}
  });
  win.once('ready-to-show',()=>win.show());
  win.loadFile(path.join(__dirname,'..','studio.html'));
  win.webContents.setWindowOpenHandler(({url})=>{
    if(url.startsWith('https://'))shell.openExternal(url);
    return {action:'deny'};
  });
}
app.whenReady().then(()=>{
  createWindow();
  app.on('activate',()=>{if(BrowserWindow.getAllWindows().length===0)createWindow();});
});
app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit();});
