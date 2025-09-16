import { app, BrowserWindow, shell } from 'electron';
import { join } from 'path';
import { is } from '@electron-toolkit/utils';
import icon from '../../resources/icon.png?asset';

let mainWindow = null;

export function getMainWindow() {
  return mainWindow && !mainWindow.isDestroyed() ? mainWindow : null;
}

export function createAppWindow({ showOnCreate = false } = {}) {
  const existing = getMainWindow();
  if (existing) return existing;

  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      devTools: is.dev,
    },
  });

  mainWindow.once('ready-to-show', () => {
    if (showOnCreate) {
      mainWindow.maximize();
      mainWindow.show();
    }
  });

  if (!is.dev) {
    mainWindow.webContents.on('devtools-opened', () =>
      mainWindow.webContents.closeDevTools(),
    );
    mainWindow.webContents.on('context-menu', (e) => e.preventDefault());
  }

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  mainWindow.on('close', (e) => {
    if (!app.isQuitting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }

  return mainWindow;
}

export function showEditorWindow() {
  const win = getMainWindow() ?? createAppWindow({ showOnCreate: true });
  if (!win.isMaximized()) win.maximize();
  win.show();
}
