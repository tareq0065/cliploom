import { Tray, Menu, app } from 'electron';
import trayIcon from '../../resources/trayIcon.png?asset';
import { showAbout } from './about.js';
import { showEditorWindow } from './window.js';

let tray = null;

export function createAppTray(actions) {
  const { onFull, onSelect, onOpenEditor } = actions;

  tray = new Tray(trayIcon);
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Full Screen', click: onFull },
    { label: 'Select a portion', click: onSelect },
    {
      label: 'Open Editor',
      click: () => {
        if (typeof onOpenEditor === 'function') return onOpenEditor();
        showEditorWindow();
      },
    },
    { type: 'separator' },
    { label: 'About', click: showAbout },
    {
      label: 'Exit',
      click: () => {
        app.isQuitting = true;
        app.quit();
      },
    },
  ]);
  tray.setToolTip('Cliploom');
  tray.setContextMenu(contextMenu);

  return tray;
}
