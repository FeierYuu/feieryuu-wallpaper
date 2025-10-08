const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  downloadImage: async (url, customPath) => ipcRenderer.invoke('download-image', url, customPath),
  applyWallpaper: async (wallpaperData) => ipcRenderer.invoke('apply-wallpaper', wallpaperData),
  fetchBingWallpapers: async (page, category) => ipcRenderer.invoke('fetch-bing-wallpapers', page, category),
  preloadNextPage: async (page) => ipcRenderer.invoke('preload-next-page', page),
  showSaveDialog: async () => ipcRenderer.invoke('show-save-dialog'),
  getFooterText: async () => ipcRenderer.invoke('get-footer-text'),
  // 历史壁纸相关接口
  getWallpaperHistory: async () => ipcRenderer.invoke('get-wallpaper-history'),
  deleteWallpaperHistory: async (historyId) => ipcRenderer.invoke('delete-wallpaper-history', historyId),
  clearWallpaperHistory: async () => ipcRenderer.invoke('clear-wallpaper-history'),
  // 导入图片接口
  importImage: async () => ipcRenderer.invoke('import-image'),
});


