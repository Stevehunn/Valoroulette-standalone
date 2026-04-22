const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    getUserState: () => ipcRenderer.invoke('get-user-state'),
    getDefaultAgents: () => ipcRenderer.invoke('get-default-agents'),
    saveUserState: (state) => ipcRenderer.invoke('save-user-state', state),
    selectImage: () => ipcRenderer.invoke('select-image'),
    deleteCustomImage: (path) => ipcRenderer.invoke('delete-custom-image', path),
    openSecretWindow: () => ipcRenderer.invoke('open-secret-window')
});