import { app } from 'electron';
import { join } from 'path';
import { exec } from 'child_process';
import fs from 'fs';
import { createAppWindow, getMainWindow } from './window.js';

function captureFileToDataURL(tmp, cb) {
  fs.readFile(tmp, (e, data) => {
    if (e) return cb(e);
    fs.unlink(tmp, () => {});
    cb(null, `data:image/png;base64,${data.toString('base64')}`);
  });
}

export function captureFullScreen(cb) {
  const tmp = join(app.getPath('temp'), 'full.png');
  exec(`screencapture "${tmp}"`, (err) => {
    if (err) return cb(err);
    captureFileToDataURL(tmp, cb);
  });
}

export function captureRegionInteractive(cb) {
  const tmp = join(app.getPath('temp'), 'region.png');
  exec(`screencapture -i -x "${tmp}"`, (err) => {
    if (err) {
      if (err && err.code === 1) return; // user cancelled
      return cb(err);
    }
    captureFileToDataURL(tmp, cb);
  });
}

export function fullScreenScreenshotFlow() {
  const win = getMainWindow();
  if (win) win.hide();
  setTimeout(() => {
    captureFullScreen((err, dataUrl) => {
      if (err) return console.error(err);
      const w = createAppWindow();
      w.webContents.send('screenshot-data', dataUrl);
      w.maximize();
      w.show();
    });
  }, 150);
}

export function selectionScreenshotFlow() {
  const win = getMainWindow();
  if (win) win.hide();
  setTimeout(() => {
    captureRegionInteractive((err, dataUrl) => {
      if (err) return console.error(err);
      if (!dataUrl) return; // cancelled
      const w = createAppWindow();
      w.webContents.send('screenshot-data', dataUrl);
      w.maximize();
      w.show();
    });
  }, 150);
}
