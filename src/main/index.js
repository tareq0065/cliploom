import {
  app,
  BrowserWindow,
  Tray,
  ipcMain,
  globalShortcut,
  screen,
  dialog,
  clipboard,
  Menu,
} from 'electron';
import { join, extname } from 'path';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
import { exec, execFile, spawn } from 'child_process';
import fs from 'fs';
import icon from '../../resources/icon.png?asset';
import trayIcon from '../../resources/trayIcon.png?asset';

let mainWindow = null;
let tray = null;

// Set this flag to true before quitting
app.isQuitting = false;

function createTray() {
  tray = new Tray(trayIcon);
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Full Screen',
      click: () => fullScreenScreenshotFlow(),
    },
    {
      label: 'Select a portion',
      click: () => selectionScreenshotFlow(),
    },
    {
      label: 'Open Editor',
      click: () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.show();
        }
      },
    },
    {
      label: 'About',
      click: () => {
        // Show about information (implement as needed)
      },
    },
    {
      label: 'Exit',
      click: () => {
        app.isQuitting = true;
        app.quit();
      },
    },
  ]);
  tray.setToolTip('My Electron App');
  tray.setContextMenu(contextMenu);
}

function createWindow(imageDataUrl) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('screenshot-data', imageDataUrl);
    mainWindow.show();
    return;
  }

  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
    },
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  // Hide window on close instead of quitting app
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.gscodes.cliploom');
  globalShortcut.register(
    'CommandOrControl+Option+c',
    fullScreenScreenshotFlow,
  );
  globalShortcut.register('CommandOrControl+Option+x', selectionScreenshotFlow);
  // Watch for window shortcuts (F12, reload, etc.)
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  // IPC test
  ipcMain.on('ping', () => console.log('pong'));

  createTray();
  createWindow();

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => globalShortcut.unregisterAll());

//editor

// Full-screen capture via `screencapture`
function captureFullScreen(cb) {
  const tmp = join(app.getPath('temp'), 'full.png');
  exec(`screencapture ${tmp}`, (err) => {
    if (err) return cb(err);
    fs.readFile(tmp, (e, data) => {
      if (e) return cb(e);
      fs.unlink(tmp, () => {});
      cb(null, `data:image/png;base64,${data.toString('base64')}`);
    });
  });
}

// **NEW**: interactive region capture using macOS’s built-in UI
function captureRegionInteractive(cb) {
  const tmp = join(app.getPath('temp'), 'region.png');
  // -i: interactive selection, -x: no shutter sound
  exec(`screencapture -i -x "${tmp}"`, (err) => {
    if (err) {
      // user hit Escape → exit code 1 → treat as cancel
      if (err.code === 1) return;
      return cb(err);
    }
    fs.readFile(tmp, (e, data) => {
      if (e) return cb(e);
      fs.unlink(tmp, () => {});
      cb(null, `data:image/png;base64,${data.toString('base64')}`);
    });
  });
}

function openFromClipboard() {
  const image = clipboard.readImage();
  if (image.isEmpty()) {
    dialog.showErrorBox('Clipboard Empty', 'No image found in the clipboard.');
    return;
  }
  const dataUrl = image.toDataURL();
  createWindow(dataUrl);
}

async function openFromFile() {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: 'Open image file…',
    filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg'] }],
    properties: ['openFile'],
  });
  if (canceled || !filePaths.length) return;
  const data = fs.readFileSync(filePaths[0]);
  const ext = extname(filePaths[0]).slice(1);
  const base64 = data.toString('base64');
  createWindow(`data:image/${ext};base64,${base64}`);
}

// Return your app’s version (pulled from package.json)
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

// Flow: Full-screen screenshot
function fullScreenScreenshotFlow() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.hide();
  }
  setTimeout(() => {
    captureFullScreen((err, dataUrl) => {
      if (err) return console.error(err);
      createWindow(dataUrl);
    });
  }, 150);
}

// Flow: Region selection screenshot (NOW uses built-in UI)
function selectionScreenshotFlow() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.hide();
  }
  setTimeout(() => {
    captureRegionInteractive((err, dataUrl) => {
      if (err) return console.error(err);
      if (!dataUrl) return; // cancelled
      createWindow(dataUrl);
    });
  }, 150);
}

// IPC: Save composed image
ipcMain.handle(
  'save-composed-image',
  async (event, { base64Data, defaultFileName }) => {
    const { canceled, filePath } = await dialog.showSaveDialog({
      title: 'Save screenshot as…',
      defaultPath: defaultFileName,
      filters: [{ name: 'PNG Image', extensions: ['png'] }],
    });
    if (canceled || !filePath) return null;
    const buffer = Buffer.from(
      base64Data.replace(/^data:image\/\w+;base64,/, ''),
      'base64',
    );
    fs.writeFileSync(filePath, buffer);
    return filePath;
  },
);

// IPC: Menu actions
ipcMain.on('menu-fullscreen', fullScreenScreenshotFlow);
ipcMain.on('menu-select', selectionScreenshotFlow);
ipcMain.on('menu-open-clipboard', openFromClipboard);
ipcMain.on('menu-open-file', openFromFile);
ipcMain.on('open-editor', () => {
  if (mainWindow) mainWindow.show();
});
ipcMain.on('menu-quit', () => app.quit());
