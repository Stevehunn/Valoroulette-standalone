const { contextBridge, ipcRenderer } = require('electron');

// Keep renderer access explicit: expose only the IPC operations used by the UI.
contextBridge.exposeInMainWorld('electronAPI', {
    getUserState: () => ipcRenderer.invoke('get-user-state'),
    getDefaultAgents: () => ipcRenderer.invoke('get-default-agents'),
    saveUserState: (state) => ipcRenderer.invoke('save-user-state', state),
    selectImage: () => ipcRenderer.invoke('select-image'),
    deleteCustomImage: (path) => ipcRenderer.invoke('delete-custom-image', path),
    onOpenSecretMenu: (callback) => ipcRenderer.on('open-secret-menu', () => callback()),
    checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
    onUpdateStatus: (callback) => ipcRenderer.on('update-status', (event, update) => callback(update))
});