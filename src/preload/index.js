const { contextBridge, ipcRenderer } = require('electron');

let lastScreenshot = null;
const screenshotListeners = [];

// 1) Catch *every* screenshot-data event, buffer it, and fan it out to any listeners:
ipcRenderer.on('screenshot-data', (_e, dataUrl) => {
  lastScreenshot = dataUrl;
  screenshotListeners.forEach((cb) => cb(dataUrl));
});

contextBridge.exposeInMainWorld('electronAPI', {
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
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
  preferences: () => ipcRenderer.send('preferences'),
});
