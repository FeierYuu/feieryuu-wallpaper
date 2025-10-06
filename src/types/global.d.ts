export {};

declare global {
  interface Window {
    api?: {
      downloadImage: (url: string) => Promise<{ ok: boolean; path?: string; error?: string }>;
      applyWallpaper: (urlOrPath: string) => Promise<{ success: boolean; error?: string }>;
      fetchBingWallpapers: (page: number) => Promise<any[]>;
      preloadNextPage: (page: number) => Promise<void>;
      getFooterText: () => Promise<{ success: boolean; text: string }>;
    };
  }
}


