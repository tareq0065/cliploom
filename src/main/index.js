import { app, globalShortcut } from 'electron';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
import { createAppWindow, getMainWindow } from './window.js';
import { createAppTray } from './tray.js';
import {
  fullScreenScreenshotFlow,
  selectionScreenshotFlow,
} from './capture.js';
import { registerIpcHandlers } from './ipc.js';
import { wireAutoUpdater } from './updates.js';

// Keep parity with previous behavior
app.isQuitting = false;

app.whenReady().then(() => {
  if (process.platform === 'darwin') app.dock.hide();

  electronApp.setAppUserModelId('com.gscodes.cliploom');

  // Global shortcuts
  globalShortcut.register(
    'CommandOrControl+Option+c',
    fullScreenScreenshotFlow,
  );
  globalShortcut.register('CommandOrControl+Option+x', selectionScreenshotFlow);

  if (is.dev) {
    app.on('browser-window-created', (_, window) => {
      optimizer.watchWindowShortcuts(window);
    });
  }

  // Window is created lazily by flows / tray "Open Editor"
  createAppTray({
    onOpenEditor: () => {
      const win = getMainWindow() ?? createAppWindow({ showOnCreate: true });
      if (!win.isMaximized()) win.maximize();
      win.show();
    },
    onFull: fullScreenScreenshotFlow,
    onSelect: selectionScreenshotFlow,
  });

  // IPC
  registerIpcHandlers();

  // Auto-updates (polite UX)
  wireAutoUpdater();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => globalShortcut.unregisterAll());
