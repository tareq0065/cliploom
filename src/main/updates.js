import { dialog } from 'electron';
import { autoUpdater } from 'electron-updater';

let wired = false;

export function wireAutoUpdater() {
  if (wired) return;
  wired = true;

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('update-downloaded', async () => {
    const result = await dialog.showMessageBox({
      type: 'info',
      buttons: ['Restart now', 'Later'],
      defaultId: 0,
      cancelId: 1,
      title: 'Update ready',
      message: 'A new version of Cliploom has been downloaded.',
      detail: 'Restart to finish installing the update.',
    });
    if (result.response === 0) {
      setImmediate(() => autoUpdater.quitAndInstall());
    }
  });

  // silent one-shot check at boot; you can add periodic checks if you like
  autoUpdater.checkForUpdates().catch(() => {});
}
