const { app, BrowserWindow, ipcMain, dialog, Menu, globalShortcut } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs');
const { fileURLToPath, pathToFileURL } = require('url');

// User-created data belongs in userData so it survives app upgrades.
const userDataPath = app.getPath('userData');
const stateFilePath = path.join(userDataPath, 'user_state.json');
const customImagesDir = path.join(userDataPath, 'custom-images');
const agentsJsonPath = path.join(__dirname, 'data', 'agents.json');

fs.mkdirSync(customImagesDir, { recursive: true });

/** Default data persisted for first-time users. */
const defaultUserState = {
    agentsCustom: [],
    agentsExcluded: [],
    secretMode: { enabled: false, target: "Jett" }
};

/** Load the saved state or create it on first launch. */
function initUserState() {
    if (!fs.existsSync(stateFilePath)) {
        fs.writeFileSync(stateFilePath, JSON.stringify(defaultUserState, null, 2));
    }
    return JSON.parse(fs.readFileSync(stateFilePath, 'utf8'));
}

let mainWindow;

autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = false;
autoUpdater.allowPrerelease = false;

/**
 * Relay updater events to the renderer. The updater downloads only after the
 * user requests a check; a completed download is installed automatically.
 */
function sendUpdateStatus(status, details = {}) {
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('update-status', { status, ...details });
    }
}

autoUpdater.on('checking-for-update', () => {
    sendUpdateStatus('checking');
});

autoUpdater.on('update-available', (info) => {
    sendUpdateStatus('downloading', { version: info.version });
    autoUpdater.downloadUpdate().catch((error) => {
        sendUpdateStatus('error', { message: error.message });
    });
});

autoUpdater.on('update-not-available', () => {
    sendUpdateStatus('current');
});

autoUpdater.on('download-progress', (progress) => {
    sendUpdateStatus('progress', { percent: progress.percent });
});

autoUpdater.on('update-downloaded', (info) => {
    sendUpdateStatus('installing', { version: info.version });
    setTimeout(() => autoUpdater.quitAndInstall(), 1500);
});

autoUpdater.on('error', (error) => {
    sendUpdateStatus('error', { message: error.message });
});

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        }
    });

    mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));
    
    // DevTools désactivé
    // mainWindow.webContents.openDevTools();
    
    Menu.setApplicationMenu(null);

    globalShortcut.register('CommandOrControl+Shift+A', () => {
        if (!mainWindow) return;
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.show();
        mainWindow.focus();

        const openMenu = () => mainWindow.webContents.send('open-secret-menu');
        if (mainWindow.webContents.isLoading()) {
            mainWindow.webContents.once('did-finish-load', openMenu);
        } else {
            openMenu();
        }
    });
}

// IPC Handlers
ipcMain.handle('get-user-state', async () => {
    return initUserState();
});

ipcMain.handle('get-default-agents', async () => {
    // agents.json is the single source of truth for built-in agents.
    return JSON.parse(fs.readFileSync(agentsJsonPath, 'utf8'));
});

/** Only packaged installers can use electron-updater. */
ipcMain.handle('check-for-updates', async () => {
    if (!app.isPackaged) {
        sendUpdateStatus('unavailable');
        return false;
    }

    await autoUpdater.checkForUpdates();
    return true;
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
        const destPath = path.join(customImagesDir, `${Date.now()}-${fileName}`);
        
        fs.copyFileSync(sourcePath, destPath);
        
        return {
            success: true,
            path: pathToFileURL(destPath).href,
            name: path.basename(fileName, '.png')
        };
    }
    return { success: false };
});

ipcMain.handle('delete-custom-image', async (event, imagePath) => {
    // Accept old in-installation paths for existing custom-agent state.
    const fullPath = imagePath.startsWith('file://')
        ? path.resolve(fileURLToPath(imagePath))
        : path.resolve(__dirname, imagePath);
    const allowedDirectories = [
        path.resolve(customImagesDir),
        path.resolve(__dirname, 'assets', 'custom')
    ];
    const parentDirectory = path.dirname(fullPath);

    if (!allowedDirectories.includes(parentDirectory)) {
        throw new Error('Invalid custom image path');
    }

    if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
    }
    return true;
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