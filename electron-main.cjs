const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const os = require('os');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    title: 'Alles Kaufen - Gestão de Compras',
    icon: path.join(__dirname, 'public', 'favicon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Agora aponta para o seu servidor oficial na nuvem!
  win.loadURL('https://alles-kaufen-system.onrender.com');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
