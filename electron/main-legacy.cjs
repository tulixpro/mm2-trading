const { app, BrowserWindow, shell } = require('electron');
const path = require('node:path');
// Prefer hardware WebGL, but allow Chromium's bundled SwiftShader fallback on blocked/unsupported GPUs.
// Allow local ES modules and bundled assets to load from the packaged file:// app.
app.commandLine.appendSwitch('allow-file-access-from-files');
app.commandLine.appendSwitch('enable-webgl');
app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('enable-unsafe-swiftshader');
function createWindow(){
 const win=new BrowserWindow({width:1440,height:900,minWidth:980,minHeight:680,show:false,backgroundColor:'#07111f',autoHideMenuBar:true,title:'Frankfurt Life Launcher',webPreferences:{contextIsolation:true,nodeIntegration:false,sandbox:true}});
 win.once('ready-to-show',()=>win.show());
 win.loadFile(path.join(__dirname,'..','launcher.html'),{query:{edition:'sanandreas'}});
 win.webContents.setWindowOpenHandler(({url})=>{if(url.startsWith('https://'))shell.openExternal(url);return {action:'deny'};});
}
app.whenReady().then(()=>{createWindow();app.on('activate',()=>{if(BrowserWindow.getAllWindows().length===0)createWindow();});});
app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit();});
