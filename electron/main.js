import { app, BrowserWindow, shell } from 'electron';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getAppIcon() {
  const icoPath = path.join(__dirname, '../public/icon.ico');
  const favPath = path.join(__dirname, '../public/favicon.ico');
  const pngPath = path.join(__dirname, '../public/icon.png');
  if (fs.existsSync(icoPath)) return icoPath;
  if (fs.existsSync(favPath)) return favPath;
  if (fs.existsSync(pngPath)) return pngPath;
  return undefined;
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1024,
    minHeight: 700,
    title: 'Neon Sign Design Studio',
    autoHideMenuBar: true,
    backgroundColor: '#0f172a',
    icon: getAppIcon(),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    const distIndexPath = path.join(__dirname, '../dist/index.html');
    win.loadFile(distIndexPath);
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
