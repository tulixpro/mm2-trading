const { app, BrowserWindow, shell } = require('electron');
const path = require('node:path');
function createWindow(){const win=new BrowserWindow({width:1280,height:850,minWidth:800,minHeight:600,backgroundColor:'#101827',autoHideMenuBar:true,webPreferences:{contextIsolation:true,nodeIntegration:false,sandbox:true}});win.loadFile(path.join(__dirname,'..','classic-2d.html'));win.webContents.setWindowOpenHandler(({url})=>{if(url.startsWith('https://'))shell.openExternal(url);return {action:'deny'};});}
app.whenReady().then(()=>{createWindow();app.on('activate',()=>{if(BrowserWindow.getAllWindows().length===0)createWindow();});});
app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit();});