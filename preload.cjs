const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  downloadImage: async (url, customPath) => ipcRenderer.invoke('download-image', url, customPath),
  applyWallpaper: async (urlOrPath) => ipcRenderer.invoke('apply-wallpaper', urlOrPath),
  fetchBingWallpapers: async (page) => ipcRenderer.invoke('fetch-bing-wallpapers', page),
  preloadNextPage: async (page) => ipcRenderer.invoke('preload-next-page', page),
  showSaveDialog: async () => ipcRenderer.invoke('show-save-dialog'),
  getFooterText: async () => ipcRenderer.invoke('get-footer-text'),
});


