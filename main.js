const { app, BrowserWindow, ipcMain, dialog, Menu, globalShortcut } = require('electron');
const path = require('path');
const fs = require('fs');

// Chemins des fichiers de données
const userDataPath = app.getPath('userData');
const stateFilePath = path.join(userDataPath, 'user_state.json');
const customImagesDir = path.join(__dirname, 'assets', 'custom');

// S'assurer que les dossiers existent
if (!fs.existsSync(customImagesDir)) {
    fs.mkdirSync(customImagesDir, { recursive: true });
}

if (!fs.existsSync(path.join(__dirname, 'data'))) {
    fs.mkdirSync(path.join(__dirname, 'data'));
}

// Liste des agents par défaut
const defaultAgents = [
  { "nom": "Jett", "image": "assets/agents/Jett.png" },
  { "nom": "Phoenix", "image": "assets/agents/Phoenix.png" },
  { "nom": "Sova", "image": "assets/agents/Sova.png" },
  { "nom": "Sage", "image": "assets/agents/Sage.png" },
  { "nom": "Cypher", "image": "assets/agents/Cypher.png" },
  { "nom": "Omen", "image": "assets/agents/Omen.png" },
  { "nom": "Brimstone", "image": "assets/agents/Brimstone.png" },
  { "nom": "Viper", "image": "assets/agents/Viper.png" },
  { "nom": "Killjoy", "image": "assets/agents/Killjoy.png" },
  { "nom": "Raze", "image": "assets/agents/Raze.png" },
  { "nom": "Breach", "image": "assets/agents/Breach.png" },
  { "nom": "Skye", "image": "assets/agents/Skye.png" },
  { "nom": "Yoru", "image": "assets/agents/Yoru.png" },
  { "nom": "KAY/O", "image": "assets/agents/Kayo.png" },
  { "nom": "Astra", "image": "assets/agents/Astra.png" },
  { "nom": "Neon", "image": "assets/agents/Neon.png" },
  { "nom": "Harbor", "image": "assets/agents/Harbor.png" },
  { "nom": "Chamber", "image": "assets/agents/Chamber.png" },
  { "nom": "Fade", "image": "assets/agents/Fade.png" },
  { "nom": "Gekko", "image": "assets/agents/Gekko.png" },
  { "nom": "Deadlock", "image": "assets/agents/Deadlock.png" },
  { "nom": "Clove", "image": "assets/agents/Clove.png" },
  { "nom": "Vyse", "image": "assets/agents/Vyse.png" },
  { "nom": "Tejo", "image": "assets/agents/Tejo.png" },
  { "nom": "Reyna", "image": "assets/agents/Reyna.png" },
  { "nom": "Iso", "image": "assets/agents/Iso.png" },
  { "nom": "Waylay", "image": "assets/agents/Waylay.png" },
  { "nom": "Miks", "image": "assets/agents/Miks.png" }
];

// Créer le fichier agents.json
const agentsJsonPath = path.join(__dirname, 'data', 'agents.json');
if (!fs.existsSync(agentsJsonPath)) {
    fs.writeFileSync(agentsJsonPath, JSON.stringify(defaultAgents, null, 2));
}

// État utilisateur par défaut
const defaultUserState = {
    agentsCustom: [],
    agentsExclus: [],
    secretMode: { enabled: false, target: "Jett" }
};

function initUserState() {
    if (!fs.existsSync(stateFilePath)) {
        fs.writeFileSync(stateFilePath, JSON.stringify(defaultUserState, null, 2));
    }
    return JSON.parse(fs.readFileSync(stateFilePath, 'utf8'));
}

let mainWindow;
let secretWindow = null;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            webSecurity: false
        }
    });

    mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));
    
    // DevTools désactivé
    // mainWindow.webContents.openDevTools();
    
    Menu.setApplicationMenu(null);
    
    globalShortcut.register('CommandOrControl+Shift+A', () => {
        openSecretWindow();
    });
}

function openSecretWindow() {
    if (secretWindow) {
        secretWindow.focus();
        return;
    }
    
    secretWindow = new BrowserWindow({
        width: 400,
        height: 300,
        parent: mainWindow,
        modal: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            webSecurity: false
        },
        title: 'Configuration Secrète'
    });
    
    secretWindow.loadFile(path.join(__dirname, 'src', 'secret.html'));
    secretWindow.on('closed', () => { secretWindow = null; });
}

// IPC Handlers
ipcMain.handle('get-user-state', async () => {
    return initUserState();
});

ipcMain.handle('get-default-agents', async () => {
    return JSON.parse(fs.readFileSync(agentsJsonPath, 'utf8'));
});

ipcMain.handle('save-user-state', async (event, state) => {
    fs.writeFileSync(stateFilePath, JSON.stringify(state, null, 2));
    return true;
});

ipcMain.handle('select-image', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile'],
        filters: [{ name: 'Images', extensions: ['png'] }]
    });
    
    if (!result.canceled && result.filePaths.length > 0) {
        const sourcePath = result.filePaths[0];
        const fileName = path.basename(sourcePath);
        const destPath = path.join(customImagesDir, fileName);
        
        fs.copyFileSync(sourcePath, destPath);
        
        return {
            success: true,
            path: `assets/custom/${fileName}`,
            name: path.basename(fileName, '.png')
        };
    }
    return { success: false };
});

ipcMain.handle('delete-custom-image', async (event, imagePath) => {
    const fullPath = path.join(__dirname, imagePath);
    if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
    }
    return true;
});

ipcMain.handle('open-secret-window', () => {
    openSecretWindow();
});

app.whenReady().then(() => {
    initUserState();
    createWindow();
});

app.on('window-all-closed', () => {
    globalShortcut.unregisterAll();
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});