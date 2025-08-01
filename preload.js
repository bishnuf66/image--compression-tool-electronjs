const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  selectFiles: () => ipcRenderer.invoke('select-files'),
  convertImage: (data) => ipcRenderer.invoke('convert-image', data),
  saveFile: (data) => ipcRenderer.invoke('save-file', data),
  saveAllFiles: (data) => ipcRenderer.invoke('save-all-files', data),
  
  // Platform info
  platform: process.platform,
  
  // Version info
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron
  }
});