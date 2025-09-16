import { app, dialog } from 'electron';

function getVersionInfoText() {
  return `${app.getName()} v${app.getVersion()}`;
}

export function showAbout() {
  if (process.platform === 'darwin') {
    // Ensure app is active, otherwise About panel won’t open if no window exists
    if (!app.isReady()) return;

    app.setAboutPanelOptions({
      applicationName: app.getName(),
      applicationVersion: app.getVersion(),
      website: 'https://cliploom.gscode.dev',
      copyright: `© ${new Date().getFullYear()} GSCodes`,
    });

    // Bring app to foreground so About panel is visible
    app.focus({ steal: true });
    app.showAboutPanel();
  } else {
    dialog.showMessageBox({
      type: 'info',
      title: `About ${app.getName()}`,
      message: `${app.getName()} v${app.getVersion()}`,
      detail: `© ${new Date().getFullYear()} GSCodes\nhttps://cliploom.gscode.dev`,
    });
  }
}
