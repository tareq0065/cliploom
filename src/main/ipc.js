import { ipcMain, dialog, shell } from 'electron';
import fs from 'fs';

export function registerIpcHandlers() {
  ipcMain.handle('get-app-version', ({ sender }) => {
    const app = require('electron').app;
    return app.getVersion();
  });

  ipcMain.handle(
    'save-composed-image',
    async (_event, { base64Data, defaultFileName }) => {
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

  ipcMain.on('open-editor', () => {
    const { showEditorWindow } = require('./window.js');
    showEditorWindow();
  });

  ipcMain.on('menu-fullscreen', () => {
    const { fullScreenScreenshotFlow } = require('./capture.js');
    fullScreenScreenshotFlow();
  });

  ipcMain.on('menu-select', () => {
    const { selectionScreenshotFlow } = require('./capture.js');
    selectionScreenshotFlow();
  });

  ipcMain.on('menu-quit', () => {
    const { app } = require('electron');
    app.quit();
  });

  ipcMain.handle('open-external', (_e, url) => shell.openExternal(url));
}
