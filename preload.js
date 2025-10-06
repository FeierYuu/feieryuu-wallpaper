import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
  downloadImage: async (url) => ipcRenderer.invoke('download-image', url),
  applyWallpaper: async (urlOrPath) => ipcRenderer.invoke('apply-wallpaper', urlOrPath),
});


