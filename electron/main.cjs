const { app, BrowserWindow, shell } = require('electron');
const path = require('node:path');
// Prefer hardware WebGL, but allow Chromium's bundled SwiftShader fallback on blocked/unsupported GPUs.
// The game loads bundled Three.js ES modules from file:// URLs. Keep Node integration disabled,
// but disable Chromium's renderer sandbox because it can prevent local module loading in packaged builds.
app.commandLine.appendSwitch('allow-file-access-from-files');
app.commandLine.appendSwitch('enable-webgl');
app.commandLine.appendSwitch('enable-unsafe-webgpu');
app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('enable-unsafe-swiftshader');
function createWindow() {
 const win = new BrowserWindow({width:1480,height:940,minWidth:980,minHeight:680,show:false,backgroundColor:'#07111f',autoHideMenuBar:true,title:'Frankfurt Life Launcher',webPreferences:{contextIsolation:true,nodeIntegration:false,sandbox:false}});
 win.once('ready-to-show',()=>win.show());
 win.loadFile(path.join(__dirname,'..','launcher.html'));
 win.webContents.setWindowOpenHandler(({url})=>{if(url.startsWith('https://'))shell.openExternal(url);return {action:'deny'};});
}
app.whenReady().then(()=>{createWindow();app.on('activate',()=>{if(BrowserWindow.getAllWindows().length===0)createWindow();});});
app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit();});
