const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const os = require('os');

function checkNetwork() {
  const interfaces = os.networkInterfaces();
  let onCorrectNetwork = false;

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Check for IPv4 and the specific subnet
      if (iface.family === 'IPv4' && iface.address.startsWith('10.96.1.')) {
        onCorrectNetwork = true;
        break;
      }
    }
  }
  return onCorrectNetwork;
}

function createWindow() {
  if (!checkNetwork()) {
    dialog.showErrorBox(
      'Acesso Negado',
      'Este aplicativo só pode ser executado quando conectado à rede Wi-Fi Alles Park (10.96.1.x).'
    );
    app.quit();
    return;
  }

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

  // Points to the server's static file serving port
  win.loadURL('http://10.96.1.198:3001');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
