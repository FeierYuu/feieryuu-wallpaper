import { app, BrowserWindow, ipcMain, shell, nativeTheme, dialog } from 'electron';
import path from 'node:path';
import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import { createWriteStream } from 'node:fs';
import https from 'node:https';
import http from 'node:http';
import { pipeline } from 'node:stream';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const streamPipeline = promisify(pipeline);

// 优化下载函数：使用更快的下载方式
async function downloadToFile(url, filePath, depth = 0) {
  if (depth > 3) throw new Error('too many redirects');
  
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    
    // 优化请求选项
    const options = {
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache'
      },
      timeout: 30000, // 减少到30秒
      // 启用连接复用
      agent: url.startsWith('https') 
        ? new https.Agent({ keepAlive: true, maxSockets: 5 })
        : new http.Agent({ keepAlive: true, maxSockets: 5 })
    };

    const req = client.get(url, options, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        // 处理重定向
        return downloadToFile(res.headers.location, filePath, depth + 1)
          .then(resolve)
          .catch(reject);
      }
      
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
        return;
      }

      const writeStream = createWriteStream(filePath);
      writeStream.on('error', reject);
      writeStream.on('finish', () => resolve(filePath));
      
      streamPipeline(res, writeStream).catch(reject);
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy(new Error('request timeout after 30 seconds'));
    });
  });
}

// 新增：快速下载函数，用于小文件
async function fastDownload(url, filePath) {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      signal: AbortSignal.timeout(10000) // 10秒超时
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();
    await fs.writeFile(filePath, Buffer.from(buffer));
    return filePath;
  } catch (error) {
    console.warn('Fast download failed, falling back to stream download:', error.message);
    // 如果快速下载失败，回退到流式下载
    return downloadToFile(url, filePath);
  }
}

let mainWindow;
let imageCache = new Map();
const CACHE_SIZE = 50;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 360,
    height: 320,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs')
    },
    frame: false,
    transparent: false, // 暂时关闭透明窗口
    resizable: false,
    alwaysOnTop: true,
    movable: true,
    titleBarStyle: 'hidden',
    backgroundColor: '#2a2a2a' // 设置背景色
  });

  // 设置窗口可拖拽
  mainWindow.setMovable(true);

  // 检查开发环境
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  
  console.log('Environment check:', {
    NODE_ENV: process.env.NODE_ENV,
    isPackaged: app.isPackaged,
    isDev: isDev,
    __dirname: __dirname
  });
  
  if (isDev) {
    console.log('Loading development URL: http://localhost:5173');
    mainWindow.loadURL('http://localhost:5173');
    // 修复DevTools位置，避免重叠
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    // 生产环境：从app.asar中加载index.html
    const indexPath = path.join(__dirname, 'dist', 'index.html');
    console.log('Loading production file:', indexPath);
    
    // 检查文件是否存在
    if (fsSync.existsSync(indexPath)) {
      console.log('✅ index.html file exists');
    } else {
      console.log('❌ index.html file NOT found at:', indexPath);
      console.log('Available files in __dirname:', fsSync.readdirSync(__dirname));
    }
    
    mainWindow.loadFile(indexPath);
  }
  
  // 添加加载事件监听
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('✅ Page loaded successfully');
  });
  
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.log('❌ Page load failed:', {
      errorCode,
      errorDescription,
      validatedURL
    });
  });
  
  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log(`[Renderer Console ${level}]:`, message);
  });
}

app.whenReady().then(() => {
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// 应用壁纸
ipcMain.handle('apply-wallpaper', async (_e, urlOrPath) => {
  try {
    console.log('Applying wallpaper:', urlOrPath);
    
    let tempPath;
    if (urlOrPath.startsWith('http')) {
      // 下载远程图片到临时目录
      const tempDir = '/tmp/wallpaper';
      await fs.mkdir(tempDir, { recursive: true });
      const filename = `wallpaper-${Date.now()}.jpg`;
      tempPath = path.join(tempDir, filename);
      
      console.log('Downloading to:', tempPath);
      await downloadToFile(urlOrPath, tempPath);
      console.log('Downloaded successfully');
    } else {
      tempPath = urlOrPath;
    }

    // 使用AppleScript设置壁纸
    const script = `
      tell application "System Events"
        tell every desktop
          set picture to "${tempPath}"
        end tell
      end tell
    `;

    return new Promise((resolve, reject) => {
      execFile('osascript', ['-e', script], { timeout: 15000 }, (error, stdout, stderr) => {
        if (error) {
          console.warn('System Events failed, trying Finder method:', error.message);
          // 备用方法：使用Finder
          const finderScript = `
            tell application "Finder"
              tell desktop
                set picture to "${tempPath}"
              end tell
            end tell
          `;
          
          execFile('osascript', ['-e', finderScript], { timeout: 15000 }, (finderError, finderStdout, finderStderr) => {
            if (finderError) {
              console.error('Both methods failed:', finderError);
              reject(new Error('Failed to set wallpaper: ' + finderError.message));
            } else {
              console.log('Wallpaper set via Finder');
              resolve({ success: true });
            }
          });
        } else {
          console.log('Wallpaper set successfully');
          resolve({ success: true });
        }
      });
    });
  } catch (e) {
    console.error('Apply wallpaper error:', e);
    return { success: false, error: String(e && e.message ? e.message : e) };
  }
});

// 获取壁纸数据
ipcMain.handle('fetch-bing-wallpapers', async (_e, page = 1) => {
  try {
    console.log('Fetching wallpapers for page:', page);
    
    // 检查缓存
    const cacheKey = `page-${page}`;
    if (imageCache.has(cacheKey)) {
      console.log('Using cached images for page:', page);
      return imageCache.get(cacheKey);
    }
    
    const results = [];
    
    // 使用nguaduot.cn API
    const promises = Array(8).fill(0).map(async (_, index) => {
      try {
        // 设置较短的超时时间
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000); // 2秒超时
        
        try {
          // 首先尝试bizhihui接口
          const response = await fetch('https://api.nguaduot.cn/bizhihui/random', {
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          
          if (response.ok) {
            const imageUrl = response.url;
            return {
              thumb: imageUrl,
              url: imageUrl,
              id: `bizhihui-${page}-${index}-${Date.now()}`,
              title: `壁纸 ${page}-${index + 1}`,
              copyright: 'nguaduot.cn'
            };
          } else {
            throw new Error('bizhihui API failed');
          }
        } catch (fetchError) {
          clearTimeout(timeoutId);
          console.warn(`bizhihui failed for image ${index}, trying snake fallback`);
          
          // 尝试snake接口作为备用
          const snakeController = new AbortController();
          const snakeTimeoutId = setTimeout(() => snakeController.abort(), 2000);
          
          try {
            const snakeResponse = await fetch('https://api.nguaduot.cn/snake/random', {
              signal: snakeController.signal
            });
            clearTimeout(snakeTimeoutId);
            
            if (snakeResponse.ok) {
              const imageUrl = snakeResponse.url;
              return {
                thumb: imageUrl,
                url: imageUrl,
                id: `snake-${page}-${index}-${Date.now()}`,
                title: `壁纸 ${page}-${index + 1}`,
                copyright: 'nguaduot.cn (snake)'
              };
            } else {
              throw new Error('snake API failed');
            }
          } catch (snakeError) {
            clearTimeout(snakeTimeoutId);
            throw snakeError;
          }
        }
      } catch (error) {
        console.warn(`Both APIs failed for image ${index}, using Picsum fallback`);
        // 最终备用：使用Picsum Photos
        const imageId = Math.floor(Math.random() * 1000) + 1000;
        const timestamp = Date.now() + index;
        
        return {
          thumb: `https://picsum.photos/id/${imageId}/300/225?random=${timestamp}`,
          url: `https://picsum.photos/id/${imageId}/2560/1440?random=${timestamp}`,
          id: `picsum-${imageId}-${page}-${index}`,
          title: `备用壁纸 ${page}-${index + 1}`,
          copyright: 'Picsum Photos'
        };
      }
    });
    
    // 等待所有请求完成
    const images = await Promise.allSettled(promises);
    
    // 处理结果，确保有8张图片
    images.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        console.warn(`Image ${index} failed:`, result.reason);
        // 添加备用图片
        const imageId = Math.floor(Math.random() * 1000) + 2000;
        results.push({
          thumb: `https://picsum.photos/id/${imageId}/300/225?random=${Date.now()}-${index}`,
          url: `https://picsum.photos/id/${imageId}/2560/1440?random=${Date.now()}-${index}`,
          id: `fallback-${page}-${index}-${Date.now()}`,
          title: `应急壁纸 ${page}-${index + 1}`,
          copyright: 'Picsum Photos'
        });
      }
    });
    
    // 缓存结果
    if (imageCache.size >= CACHE_SIZE) {
      // 删除最旧的缓存
      const firstKey = imageCache.keys().next().value;
      imageCache.delete(firstKey);
    }
    imageCache.set(cacheKey, results);
    
    console.log('Generated', results.length, 'wallpapers for page', page);
    return results;
    
  } catch (error) {
    console.error('获取壁纸失败:', error);
    // 返回备用图片
    const fallbackResults = [];
    for (let i = 0; i < 8; i++) {
      const imageId = Math.floor(Math.random() * 1000) + 3000;
      fallbackResults.push({
        thumb: `https://picsum.photos/id/${imageId}/300/225?random=${Date.now()}-${i}`,
        url: `https://picsum.photos/id/${imageId}/2560/1440?random=${Date.now()}-${i}`,
        id: `emergency-${page}-${i}-${Date.now()}`,
        title: `应急壁纸 ${page}-${i + 1}`,
        copyright: 'Picsum Photos'
      });
    }
    return fallbackResults;
  }
});

// 预加载下一页
ipcMain.handle('preload-next-page', async (_e, page) => {
  try {
    console.log('Preloading page:', page);
    
    // 检查缓存
    const cacheKey = `page-${page}`;
    if (imageCache.has(cacheKey)) {
      console.log('Page already cached:', page);
      return;
    }
    
    // 直接调用获取壁纸逻辑
    const promises = Array(8).fill(0).map(async (_, index) => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        
        try {
          const response = await fetch('https://api.nguaduot.cn/bizhihui/random', {
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          
          if (response.ok) {
            const imageUrl = response.url;
            return {
              thumb: imageUrl,
              url: imageUrl,
              id: `bizhihui-preload-${page}-${index}-${Date.now()}`,
              title: `壁纸 ${page}-${index + 1}`,
              copyright: 'nguaduot.cn'
            };
          } else {
            throw new Error('bizhihui API failed');
          }
        } catch (fetchError) {
          clearTimeout(timeoutId);
          // 快速备用：直接使用Picsum
          const imageId = Math.floor(Math.random() * 1000) + 1000;
          const timestamp = Date.now() + index;
          return {
            thumb: `https://picsum.photos/id/${imageId}/300/225?random=${timestamp}`,
            url: `https://picsum.photos/id/${imageId}/2560/1440?random=${timestamp}`,
            id: `picsum-preload-${imageId}-${page}-${index}`,
            title: `壁纸 ${page}-${index + 1}`,
            copyright: 'Picsum Photos'
          };
        }
      } catch (error) {
        console.warn(`Preload failed for image ${index}:`, error);
        const imageId = Math.floor(Math.random() * 1000) + 2000;
        return {
          thumb: `https://picsum.photos/id/${imageId}/300/225?random=${Date.now()}-${index}`,
          url: `https://picsum.photos/id/${imageId}/2560/1440?random=${Date.now()}-${index}`,
          id: `fallback-preload-${page}-${index}-${Date.now()}`,
          title: `壁纸 ${page}-${index + 1}`,
          copyright: 'Picsum Photos'
        };
      }
    });
    
    const images = await Promise.allSettled(promises);
    const results = [];
    
    images.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        const imageId = Math.floor(Math.random() * 1000) + 3000;
        results.push({
          thumb: `https://picsum.photos/id/${imageId}/300/225?random=${Date.now()}-${index}`,
          url: `https://picsum.photos/id/${imageId}/2560/1440?random=${Date.now()}-${index}`,
          id: `emergency-preload-${page}-${index}-${Date.now()}`,
          title: `壁纸 ${page}-${index + 1}`,
          copyright: 'Picsum Photos'
        });
      }
    });
    
    // 缓存结果
    if (imageCache.size >= CACHE_SIZE) {
      const firstKey = imageCache.keys().next().value;
      imageCache.delete(firstKey);
    }
    imageCache.set(cacheKey, results);
    
    console.log('Preloaded', results.length, 'images for page', page);
  } catch (error) {
    console.error('Preload failed:', error);
  }
});

// 获取 footer 文本
ipcMain.handle('get-footer-text', async () => {
  try {
    const response = await fetch('https://glitter.timeline.ink/api/v2', {
      signal: AbortSignal.timeout(5000)
    });
    
    if (response.ok) {
      const data = await response.text();
      return { success: true, text: data.trim() };
    } else {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (error) {
    console.warn('Failed to fetch footer text:', error.message);
    return { success: false, text: '此软件 免费使用' };
  }
});

// 下载图片到用户选择的文件夹
ipcMain.handle('download-image', async (_e, url) => {
  try {
    console.log('Downloading image:', url);
    
    // 显示保存对话框
    const result = await dialog.showSaveDialog(mainWindow, {
      title: '保存壁纸',
      defaultPath: `wallpaper-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.jpg`,
      filters: [
        { name: '图片文件', extensions: ['jpg', 'jpeg', 'png', 'webp'] },
        { name: '所有文件', extensions: ['*'] }
      ]
    });
    
    if (result.canceled) {
      return { ok: false, error: '用户取消下载' };
    }
    
    const targetPath = result.filePath;
    console.log('Target path:', targetPath);
    
    // 使用快速下载方法
    await fastDownload(url, targetPath);
    console.log('Downloaded to:', targetPath);
    
    return { ok: true, path: targetPath };
  } catch (e) {
    console.error('Download image error:', e);
    return { ok: false, error: String(e && e.message ? e.message : e) };
  }
});