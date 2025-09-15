const { contextBridge, ipcRenderer } = require('electron');

let lastScreenshot = null;
const screenshotListeners = [];

// 1) Catch *every* screenshot-data event, buffer it, and fan it out to any listeners:
ipcRenderer.on('screenshot-data', (_e, dataUrl) => {
  lastScreenshot = dataUrl;
  screenshotListeners.forEach((cb) => cb(dataUrl));
});

contextBridge.exposeInMainWorld('electronAPI', {
  onEditorVisibility: (cb) =>
    ipcRenderer.on('editor-visibility-changed', (_, v) => cb(v)),
  isEditorOpen: () => ipcRenderer.invoke('editor-is-open'),
  takeFullScreen: () => ipcRenderer.send('menu-fullscreen'),
  takeRegion: () => ipcRenderer.send('menu-select'),
  openEditor: () => ipcRenderer.send('open-editor'),
  quitApp: () => ipcRenderer.send('menu-quit'),
  saveComposedImage: (base64Data, defaultFileName) =>
    ipcRenderer.invoke('save-composed-image', { base64Data, defaultFileName }),

  // 2) When you register a listener, we immediately call it if we already have data:
  onScreenshotData: (callback) => {
    screenshotListeners.push(callback);
    if (lastScreenshot !== null) {
      callback(lastScreenshot);
    }
  },

  // (optional) in case you want to remove it later
  removeScreenshotListener: (callback) => {
    const idx = screenshotListeners.indexOf(callback);
    if (idx !== -1) screenshotListeners.splice(idx, 1);
  },
  openFromClipboard: () => ipcRenderer.send('menu-open-clipboard'),
  openFromFile: () => ipcRenderer.send('menu-open-file'),
  preferences: () => ipcRenderer.send('preferences'),

  getLoginItemSettings: () => ipcRenderer.invoke('get-login-item-settings'),
  setLoginItemSettings: (enable) =>
    ipcRenderer.invoke('set-login-item-settings', enable),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
});
