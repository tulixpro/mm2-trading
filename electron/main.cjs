const { app, BrowserWindow, shell } = require('electron');
const path = require('node:path');
function createWindow() {
 const win = new BrowserWindow({width:1480,height:940,minWidth:980,minHeight:680,show:false,backgroundColor:'#07111f',autoHideMenuBar:true,title:'Frankfurt Life Launcher',webPreferences:{contextIsolation:true,nodeIntegration:false,sandbox:true}});
 win.once('ready-to-show',()=>win.show());
 win.loadFile(path.join(__dirname,'..','launcher.html'));
 win.webContents.setWindowOpenHandler(({url})=>{if(url.startsWith('https://'))shell.openExternal(url);return {action:'deny'};});
}
app.whenReady().then(()=>{createWindow();app.on('activate',()=>{if(BrowserWindow.getAllWindows().length===0)createWindow();});});
app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit();});
