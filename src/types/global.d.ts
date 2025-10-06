export {};

// 历史壁纸记录类型
export interface WallpaperHistoryItem {
  id: string;
  url: string;
  thumb: string;
  title: string;
  appliedAt: string;
  localPath?: string;
}

declare global {
  interface Window {
    api?: {
      downloadImage: (url: string) => Promise<{ ok: boolean; path?: string; error?: string }>;
      applyWallpaper: (wallpaperData: any) => Promise<{ success: boolean; error?: string }>;
      fetchBingWallpapers: (page: number, category?: string) => Promise<any[]>;
      preloadNextPage: (page: number) => Promise<void>;
      getFooterText: () => Promise<{ success: boolean; text: string }>;
      // 历史壁纸相关接口
      getWallpaperHistory: () => Promise<{ success: boolean; data: WallpaperHistoryItem[]; error?: string }>;
      deleteWallpaperHistory: (historyId: string) => Promise<{ success: boolean; error?: string }>;
      clearWallpaperHistory: () => Promise<{ success: boolean; error?: string }>;
    };
  }
}


