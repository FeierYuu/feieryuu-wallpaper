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

// 历史壁纸管理
const HISTORY_FILE = path.join(app.getPath('userData'), 'wallpaper-history.json');

// 读取历史壁纸记录
async function loadWallpaperHistory() {
  try {
    const data = await fs.readFile(HISTORY_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // 文件不存在或解析失败，返回空数组
    return [];
  }
}

// 保存历史壁纸记录
async function saveWallpaperHistory(history) {
  try {
    await fs.writeFile(HISTORY_FILE, JSON.stringify(history, null, 2), 'utf8');
  } catch (error) {
    console.error('保存历史记录失败:', error);
  }
}

// 添加壁纸到历史记录
async function addToHistory(wallpaperData) {
  try {
    const history = await loadWallpaperHistory();
    const newEntry = {
      id: Date.now().toString(),
      url: wallpaperData.url,
      thumb: wallpaperData.thumb,
      title: wallpaperData.title || '未知壁纸',
      appliedAt: new Date().toISOString(),
      localPath: wallpaperData.localPath || null
    };
    
    // 避免重复添加相同的壁纸
    const exists = history.some(item => item.url === newEntry.url);
    if (!exists) {
      history.unshift(newEntry); // 添加到开头
      
      // 限制历史记录数量，最多保存100条
      if (history.length > 100) {
        history.splice(100);
      }
      
      await saveWallpaperHistory(history);
    }
    
    return newEntry;
  } catch (error) {
    console.error('添加历史记录失败:', error);
    return null;
  }
}

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
    width: 480,
    height: 400,
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

app.whenReady().then(async () => {
  // 测试网络连接
  try {
    console.log('测试网络连接...');
    const testResponse = await fetch('https://api.mmp.cc/api/pcwallpaper?category=4k&type=webp', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    });
    console.log('网络测试结果:', testResponse.status);
    if (testResponse.ok) {
      const testData = await testResponse.json();
      console.log('API测试数据:', testData);
    }
  } catch (error) {
    console.error('网络测试失败:', error.message);
  }
  
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

// 检查本地文件是否存在
function checkLocalFileExists(filePath) {
  try {
    return fsSync.existsSync(filePath);
  } catch (error) {
    console.error('检查文件存在性失败:', error);
    return false;
  }
}

// 获取分类的中文标签
function getCategoryLabel(category) {
  const categoryLabels = {
    '4k': '4K高清',
    'landscape': '风景',
    'belle': '妹子',
    'game': '游戏',
    'photo': '影视剧照',
    'cool': '炫酷',
    'star': '明星',
    'car': '汽车',
    'cartoon': '动漫'
  };
  return categoryLabels[category] || '随机';
}

// 应用壁纸
ipcMain.handle('apply-wallpaper', async (_e, wallpaperData) => {
  try {
    let urlOrPath = wallpaperData.url || wallpaperData;
    console.log('Applying wallpaper:', urlOrPath);
    
    // 如果是历史记录，先检查本地文件是否存在
    if (wallpaperData.localPath && checkLocalFileExists(wallpaperData.localPath)) {
      console.log('使用本地文件:', wallpaperData.localPath);
      urlOrPath = wallpaperData.localPath;
    }
    
    let tempPath;
    let isDownloaded = false;
    
    if (urlOrPath.startsWith('http')) {
      // 下载远程图片到临时目录
      const tempDir = '/tmp/wallpaper';
      await fs.mkdir(tempDir, { recursive: true });
      const filename = `wallpaper-${Date.now()}.jpg`;
      tempPath = path.join(tempDir, filename);
      
      console.log('Downloading to:', tempPath);
      await downloadToFile(urlOrPath, tempPath);
      console.log('Downloaded successfully');
      isDownloaded = true;
    } else {
      tempPath = urlOrPath;
      isDownloaded = false; // 使用本地文件，不需要下载
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
              // 添加到历史记录（只有下载新图片时才添加）
              if (isDownloaded && typeof wallpaperData === 'object' && wallpaperData.url) {
                addToHistory({
                  ...wallpaperData,
                  localPath: tempPath
                }).catch(err => console.error('添加历史记录失败:', err));
              }
              resolve({ success: true });
            }
          });
        } else {
          console.log('Wallpaper set successfully');
          // 添加到历史记录（只有下载新图片时才添加）
          if (isDownloaded && typeof wallpaperData === 'object' && wallpaperData.url) {
            addToHistory({
              ...wallpaperData,
              localPath: tempPath
            }).catch(err => console.error('添加历史记录失败:', err));
          }
          resolve({ success: true });
        }
      });
    });
  } catch (e) {
    console.error('Apply wallpaper error:', e);
    return { success: false, error: String(e && e.message ? e.message : e) };
  }
});

// 获取历史壁纸记录
ipcMain.handle('get-wallpaper-history', async () => {
  try {
    const history = await loadWallpaperHistory();
    return { success: true, data: history };
  } catch (error) {
    console.error('获取历史记录失败:', error);
    return { success: false, error: error.message };
  }
});

// 删除历史壁纸记录
ipcMain.handle('delete-wallpaper-history', async (_e, historyId) => {
  try {
    const history = await loadWallpaperHistory();
    const filteredHistory = history.filter(item => item.id !== historyId);
    await saveWallpaperHistory(filteredHistory);
    return { success: true };
  } catch (error) {
    console.error('删除历史记录失败:', error);
    return { success: false, error: error.message };
  }
});

// 清空历史壁纸记录
ipcMain.handle('clear-wallpaper-history', async () => {
  try {
    await saveWallpaperHistory([]);
    return { success: true };
  } catch (error) {
    console.error('清空历史记录失败:', error);
    return { success: false, error: error.message };
  }
});

// 获取壁纸数据
ipcMain.handle('fetch-bing-wallpapers', async (_e, page = 1, category = '4k') => {
  try {
    console.log('Fetching wallpapers for page:', page);
    
    // 检查缓存
    const cacheKey = `page-${page}-${category}`;
    if (imageCache.has(cacheKey)) {
      console.log('Using cached images for page:', page, 'category:', category);
      return imageCache.get(cacheKey);
    }
    
    const results = [];
    
    // 使用新的mmp.cc API作为主要数据源，nguaduot.cn作为保底
    const promises = Array(8).fill(0).map(async (_, index) => {
      try {
        // 设置较长的超时时间
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          console.log(`API请求超时: 图片 ${index + 1}`);
          controller.abort();
        }, 10000); // 10秒超时
        
        try {
          // 首先尝试mmp.cc API
          console.log(`尝试获取mmp.cc API图片 ${index + 1}, 分类: ${category}`);
          const apiUrl = `https://api.mmp.cc/api/pcwallpaper?category=${category}&type=webp`;
          console.log(`请求URL: ${apiUrl}`);
          
          const response = await fetch(apiUrl, {
            signal: controller.signal,
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
              'Cache-Control': 'no-cache'
            }
          });
          clearTimeout(timeoutId);
          
          if (response.ok) {
            const data = await response.json();
            console.log(`mmp.cc API响应数据:`, data);
            
            if (data.status === 200 && data.url) {
              console.log(`成功获取mmp.cc图片: ${data.url}`);
              return {
                thumb: data.url,
                url: data.url,
                id: `mmp-${data.id || page}-${index}-${Date.now()}`,
                title: `${getCategoryLabel(category)}壁纸 ${page}-${index + 1}`,
                copyright: 'mmp.cc'
              };
            } else {
              throw new Error('mmp.cc API returned invalid data');
            }
          } else {
            throw new Error(`mmp.cc API failed with status: ${response.status}`);
          }
        } catch (fetchError) {
          clearTimeout(timeoutId);
          console.warn(`mmp.cc failed for image ${index}:`, fetchError.message);
          
          // 尝试nguaduot.cn作为备用
          const fallbackController = new AbortController();
          const fallbackTimeoutId = setTimeout(() => {
            console.log(`备用API请求超时: 图片 ${index + 1}`);
            fallbackController.abort();
          }, 8000); // 8秒超时
          
          try {
            console.log(`尝试nguaduot.cn备用API图片 ${index + 1}`);
            const fallbackResponse = await fetch('https://api.nguaduot.cn/bizhihui/random', {
              signal: fallbackController.signal
            });
            clearTimeout(fallbackTimeoutId);
            
            if (fallbackResponse.ok) {
              const imageUrl = fallbackResponse.url;
              console.log(`成功获取nguaduot.cn图片: ${imageUrl}`);
              return {
                thumb: imageUrl,
                url: imageUrl,
                id: `nguaduot-${page}-${index}-${Date.now()}`,
                title: `壁纸 ${page}-${index + 1}`,
                copyright: 'nguaduot.cn (fallback)'
              };
            } else {
              throw new Error('nguaduot.cn fallback failed');
            }
          } catch (fallbackError) {
            clearTimeout(fallbackTimeoutId);
            console.warn(`nguaduot.cn fallback failed for image ${index}:`, fallbackError.message);
            throw fallbackError;
          }
        }
      } catch (error) {
        console.warn(`All APIs failed for image ${index}, skipping this image`);
        // 如果所有API都失败，返回null，让Promise.allSettled处理
        return null;
      }
    });
    
    // 等待所有请求完成
    const images = await Promise.allSettled(promises);
    
    // 处理结果，只保留成功的图片
    images.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value !== null) {
        results.push(result.value);
      } else {
        console.warn(`Image ${index} failed:`, result.reason || 'No data returned');
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
    // 如果没有获取到任何图片，返回空数组
    console.warn('No images were successfully loaded');
    return [];
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
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        try {
          // 首先尝试mmp.cc API
          const response = await fetch('https://api.mmp.cc/api/pcwallpaper?category=4k&type=webp', {
            signal: controller.signal,
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
            }
          });
          clearTimeout(timeoutId);
          
          if (response.ok) {
            const data = await response.json();
            if (data.status === 200 && data.url) {
              return {
                thumb: data.url,
                url: data.url,
                id: `mmp-preload-${data.id || page}-${index}-${Date.now()}`,
                title: `4K壁纸 ${page}-${index + 1}`,
                copyright: 'mmp.cc'
              };
            } else {
              throw new Error('mmp.cc API returned invalid data');
            }
          } else {
            throw new Error(`mmp.cc API failed with status: ${response.status}`);
          }
        } catch (fetchError) {
          clearTimeout(timeoutId);
          console.warn(`Preload API failed for image ${index}:`, fetchError.message);
          return null;
        }
      } catch (error) {
        console.warn(`Preload failed for image ${index}:`, error);
        return null;
      }
    });
    
    const images = await Promise.allSettled(promises);
    const results = [];
    
    images.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value !== null) {
        results.push(result.value);
      } else {
        console.warn(`Preload image ${index} failed:`, result.reason || 'No data returned');
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