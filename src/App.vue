<template>
  <div class="h-full w-full glass flex flex-col -webkit-app-region-drag">
    <header class="flex items-center justify-between px-4 py-3 border-b border-white/10 flex-shrink-0 -webkit-app-region-drag">
      <div class="flex items-center gap-3">
        <div class="text-base font-semibold opacity-90 text-white">飞鱼壁纸</div>
        <button 
          class="hover:opacity-100 text-white hover:bg-white/10 px-3 py-1.5 rounded transition-all duration-200 text-sm -webkit-app-region-no-drag" 
          @click="toggleHistory"
          :class="{ 'bg-white/20': showHistory }"
        >
          📚 历史
        </button>
        <select 
          v-if="!showHistory"
          v-model="selectedCategory" 
          @change="onCategoryChange"
          class="bg-white/10 border border-white/20 rounded px-2 py-1 text-sm text-white opacity-90 hover:bg-white/20 transition-all duration-200 -webkit-app-region-no-drag"
        >
          <option v-for="category in categories" :key="category.value" :value="category.value" class="bg-gray-800 text-white">
            {{ category.label }}
          </option>
        </select>
        <button 
          v-if="showHistory"
          @click="importImage"
          class="bg-white/10 border border-white/20 rounded px-2 py-1 text-sm text-white opacity-90 hover:bg-white/20 transition-all duration-200 -webkit-app-region-no-drag"
        >
          📁 导入
        </button>
      </div>
      <div class="flex items-center text-sm opacity-80 text-white -webkit-app-region-no-drag gap-2">
        <button 
          class="hover:opacity-100 hover:bg-white/10 px-2 py-1.5 rounded transition-all duration-200 text-xs whitespace-nowrap" 
          @click="handlePrevPage" 
          :disabled="showHistory ? currentHistoryPage <= 1 : currentPage <= 1"
        >
          ← 上页
        </button>
        <span class="text-xs opacity-60 px-1 whitespace-nowrap">
          {{ showHistory ? `${currentHistoryPage}/${totalHistoryPages}` : currentPage }}
        </span>
        <button 
          class="hover:opacity-100 hover:bg-white/10 px-2 py-1.5 rounded transition-all duration-200 text-xs whitespace-nowrap" 
          @click="handleNextPage"
          :disabled="showHistory ? currentHistoryPage >= totalHistoryPages : false"
        >
          下页→
        </button>
      </div>
    </header>
    
    <div class="flex-1 px-2 py-3 flex flex-col -webkit-app-region-no-drag">
      <!-- 历史壁纸视图 -->
      <div v-if="showHistory" class="flex-1 flex flex-col overflow-hidden" style="max-height: 100%;">
        <div class="flex items-center justify-between mb-2 min-w-0">
          <h3 class="text-xs font-semibold text-white opacity-90 truncate flex-shrink-0">历史({{ historyItems.length }})</h3>
          <div class="flex gap-1 flex-shrink-0">
            <button 
              class="text-xs px-1 py-0.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded transition-all duration-200"
              @click="clearHistory"
              :disabled="historyItems.length === 0"
            >
              清空
            </button>
            <button 
              class="text-xs px-1 py-0.5 bg-white/10 hover:bg-white/20 text-white rounded transition-all duration-200"
              @click="refreshHistory"
            >
              刷新
            </button>
          </div>
        </div>
        
        <div v-if="historyLoading" class="grid grid-cols-4 flex-1 auto-rows-fr grid-container">
          <div v-for="n in 8" :key="n" class="rounded-lg animate-pulse bg-white/10 aspect-[4/3]"></div>
        </div>
        
        <div v-else-if="historyItems.length === 0" class="flex-1 flex items-center justify-center">
          <div class="text-center text-white/60">
            <div class="text-4xl mb-2">📚</div>
            <div class="text-sm">暂无历史壁纸</div>
            <div class="text-xs opacity-60 mt-1">应用壁纸后会自动记录在这里</div>
          </div>
        </div>
        
        <div v-else class="grid grid-cols-4 flex-1 auto-rows-fr grid-container" style="max-height: calc(100% - 2rem); overflow: hidden;">
          <div 
            v-for="(item, idx) in currentHistoryItems" 
            :key="item.id" 
            class="image-container"
          >
            <img 
              :src="getImageUrl(item.thumb, item.isLocal)" 
              class="image" 
              @error="handleHistoryImageError"
              @click="() => openHistoryPreview(idx)"
            />
            <div class="button-overlay">
              <button 
                class="action-btn" 
                @click.stop="applyHistoryItem(item)"
                :disabled="applying"
              >
                应用
              </button>
              <button 
                class="action-btn" 
                @click.stop="downloadHistoryItem(item)"
                :disabled="downloading"
              >
                下载
              </button>
              <button 
                class="action-btn bg-red-500/20 hover:bg-red-500/30 text-red-300" 
                @click.stop="deleteHistoryItem(item.id)"
              >
                删除
              </button>
            </div>
            <div class="absolute bottom-1 left-1 right-1 text-xs text-white/80 bg-black/50 rounded px-1 py-0.5 truncate">
              {{ formatDate(item.appliedAt) }}
            </div>
          </div>
        </div>
      </div>
      
      <!-- 正常壁纸视图 -->
      <div v-else>
        <div v-if="loading" class="grid grid-cols-4 flex-1 auto-rows-fr grid-container">
          <div v-for="n in 8" :key="n" class="rounded-lg animate-pulse bg-white/10 aspect-[4/3]"></div>
        </div>
        <div v-else class="grid grid-cols-4 flex-1 auto-rows-fr grid-container">
          <div 
            v-for="(img, idx) in images" 
            :key="`${currentPage}-${idx}`" 
            class="image-container"
          >
            <img 
              :src="img.thumb" 
              class="image" 
              @error="handleImageError"
              @click="() => { console.log('Image clicked for preview:', idx); openPreview(idx); }"
            />
            <div class="button-overlay">
              <button 
                class="action-btn" 
                @click.stop="apply(img)"
                :disabled="applying"
              >
                应用
              </button>
              <button 
                class="action-btn" 
                @click.stop="download(img)"
                :disabled="downloading"
              >
                下载
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <footer class="px-3 py-2 text-[10px] opacity-70 border-t border-white/10 text-white flex-shrink-0 center -webkit-app-region-drag text-center">
      {{ footerText }}
    </footer>

    <!-- 图片预览模态框 -->
    <div v-if="previewVisible" class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center" @click="closePreview">
      <div class="relative max-w-[90vw] max-h-[90vh] bg-black/50 rounded-lg overflow-hidden" @click.stop>
        <!-- 关闭按钮 -->
        <button 
          @click="closePreview"
          class="absolute top-2 right-2 z-10 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
        >
          ✕
        </button>
        
        <!-- 导航按钮 -->
        <button 
          v-if="images.length > 1"
          @click="prevImage"
          class="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
        >
          ‹
        </button>
        
        <button 
          v-if="images.length > 1"
          @click="nextImage"
          class="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
        >
          ›
        </button>
        
        <!-- 预览图片 -->
        <img 
          :src="currentPreviewImage?.url || currentPreviewImage?.thumb" 
          class="max-w-full max-h-full object-contain"
          @error="handlePreviewImageError"
        />
        
        <!-- 图片信息 -->
        <div v-if="currentPreviewImage" class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 text-white">
          <div class="text-sm opacity-90">{{ currentPreviewImage.title || '随机壁纸' }}</div>
          <div v-if="!showHistory && (currentPreviewImage as Img).copyright" class="text-xs opacity-70 mt-1">{{ (currentPreviewImage as Img).copyright }}</div>
          <div class="text-xs opacity-60 mt-2">{{ currentPreviewIndex + 1 }} / {{ showHistory ? historyItems.length : images.length }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import type { WallpaperHistoryItem } from './types/global';

interface Img {
  thumb: string;
  url: string;
  id: string;
  title: string;
  copyright?: string;
}

const currentPage = ref(1);
const images = ref<Img[]>([]);
const loading = ref(false);
const applying = ref(false);
const downloading = ref(false);
const footerText = ref('此软件 免费使用 商用追责');
const hoveredIndex = ref(-1); // 新增：跟踪鼠标悬浮的图片索引

// 分类相关
const selectedCategory = ref('4k');
const categories = ref([
  { value: '4k', label: '4K高清' },
  { value: 'landscape', label: '风景' },
  { value: 'belle', label: '妹子' },
  { value: 'game', label: '游戏' },
  { value: 'photo', label: '影视剧照' },
  { value: 'cool', label: '炫酷' },
  { value: 'star', label: '明星' },
  { value: 'car', label: '汽车' },
  { value: 'cartoon', label: '动漫' }
]);

// 历史壁纸相关
const showHistory = ref(false);
const historyItems = ref<WallpaperHistoryItem[]>([]);
const historyLoading = ref(false);
const currentHistoryPage = ref(1);
const historyPageSize = 8;

// 预览相关
const previewVisible = ref(false);
const currentPreviewIndex = ref(0);

const currentPreviewImage = computed(() => {
  if (showHistory.value) {
    return historyItems.value[currentPreviewIndex.value];
  }
  return images.value[currentPreviewIndex.value];
});

// 历史分页相关计算属性
const totalHistoryPages = computed(() => Math.ceil(historyItems.value.length / historyPageSize));
const currentHistoryItems = computed(() => {
  const start = (currentHistoryPage.value - 1) * historyPageSize;
  const end = start + historyPageSize;
  return historyItems.value.slice(start, end);
});

async function loadImages(page: number, category?: string) {
  loading.value = true;
  try {
    const result = await window.api?.fetchBingWallpapers(page, category || selectedCategory.value);
    if (result) {
      images.value = result;
    }
  } catch (e: any) {
    console.error('加载图片失败:', e);
    alert('加载图片失败: ' + (e?.message || '未知错误'));
  } finally {
    loading.value = false;
  }
}

function prev() {
  if (currentPage.value > 1) {
    currentPage.value--;
    loadImages(currentPage.value);
  }
}

function next() {
  currentPage.value++;
  loadImages(currentPage.value);
}

// 分类变更处理
function onCategoryChange() {
  console.log('分类变更:', selectedCategory.value);
  currentPage.value = 1; // 重置到第一页
  loadImages(1, selectedCategory.value);
}

function handleImageError(event: Event) {
  const img = event.target as HTMLImageElement;
  const svgString = `
    <svg xmlns="http://www.w3.org/2000/svg" width="300" height="225" viewBox="0 0 300 225">
      <rect width="300" height="225" fill="#333"/>
      <text x="150" y="115" text-anchor="middle" fill="#666" font-family="Arial" font-size="14">图片加载失败</text>
    </svg>
  `;
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;
}

function handlePreviewImageError(event: Event) {
  const img = event.target as HTMLImageElement;
  const svgString = `
    <svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
      <rect width="800" height="600" fill="#333"/>
      <text x="400" y="300" text-anchor="middle" fill="#666" font-family="Arial" font-size="18">图片加载失败</text>
    </svg>
  `;
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;
}

function openPreview(index: number) {
  console.log('Opening preview for index:', index);
  currentPreviewIndex.value = index;
  previewVisible.value = true;
}

function closePreview() {
  previewVisible.value = false;
}

function prevImage() {
  const currentList = showHistory.value ? historyItems.value : images.value;
  if (currentPreviewIndex.value > 0) {
    currentPreviewIndex.value--;
  } else {
    currentPreviewIndex.value = currentList.length - 1;
  }
}

function nextImage() {
  const currentList = showHistory.value ? historyItems.value : images.value;
  if (currentPreviewIndex.value < currentList.length - 1) {
    currentPreviewIndex.value++;
  } else {
    currentPreviewIndex.value = 0;
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (!previewVisible.value) return;
  
  switch (event.key) {
    case 'Escape':
      closePreview();
      break;
    case 'ArrowLeft':
      prevImage();
      break;
    case 'ArrowRight':
      nextImage();
      break;
  }
}

async function apply(img: Img) {
  if (applying.value) return;
  applying.value = true;
  
  try {
    console.log('Applying wallpaper:', img.url);
    // 只传递可序列化的数据
    const wallpaperData = {
      url: img.url,
      thumb: img.thumb,
      title: img.title || '未知壁纸'
    };
    const res = await window.api?.applyWallpaper(wallpaperData);
    console.log('Apply result:', res);
    
    if (res?.success) {
      alert('已应用为壁纸');
      // 刷新历史记录
      if (showHistory.value) {
        await loadHistory();
      }
    } else {
      const reason = res?.error || '未知错误';
      alert('应用失败：' + reason);
    }
  } catch (e: any) {
    console.error('Apply error:', e);
    alert('应用失败：' + (e?.message || '未知错误'));
  } finally {
    applying.value = false;
  }
}

async function download(img: Img) {
  if (downloading.value) return;
  downloading.value = true;
  
  try {
    console.log('Downloading image:', img.url);
    const res = await window.api?.downloadImage(img.url);
    console.log('Download result:', res);
    
    if (res?.ok) {
      alert('壁纸已保存到：' + res.path);
    } else {
      const reason = res?.error || '未知错误';
      if (reason !== '用户取消下载') {
        alert('下载失败：' + reason);
      }
    }
  } catch (e: any) {
    console.error('Download error:', e);
    alert('下载失败：' + (e?.message || '未知错误'));
  } finally {
    downloading.value = false;
  }
}

async function loadFooterText() {
  try {
    const result = await window.api?.getFooterText();
    if (result?.success) {
      footerText.value = result.text;
    }
  } catch (e) {
    console.warn('Failed to load footer text:', e);
  }
}

// 历史壁纸相关方法
async function loadHistory() {
  historyLoading.value = true;
  try {
    const result = await window.api?.getWallpaperHistory();
    if (result?.success) {
      historyItems.value = result.data;
    } else {
      console.error('加载历史记录失败:', result?.error);
    }
  } catch (e: any) {
    console.error('加载历史记录失败:', e);
  } finally {
    historyLoading.value = false;
  }
}

function toggleHistory() {
  showHistory.value = !showHistory.value;
  if (showHistory.value) {
    currentHistoryPage.value = 1; // 重置到第一页
    loadHistory();
  }
}

async function refreshHistory() {
  await loadHistory();
}

async function clearHistory() {
  if (confirm('确定要清空所有历史记录吗？')) {
    try {
      const result = await window.api?.clearWallpaperHistory();
      if (result?.success) {
        historyItems.value = [];
        alert('历史记录已清空');
      } else {
        alert('清空失败：' + (result?.error || '未知错误'));
      }
    } catch (e: any) {
      console.error('清空历史记录失败:', e);
      alert('清空失败：' + (e?.message || '未知错误'));
    }
  }
}

async function deleteHistoryItem(id: string) {
  if (confirm('确定要删除这条历史记录吗？')) {
    try {
      const result = await window.api?.deleteWallpaperHistory(id);
      if (result?.success) {
        historyItems.value = historyItems.value.filter(item => item.id !== id);
        alert('删除成功');
      } else {
        alert('删除失败：' + (result?.error || '未知错误'));
      }
    } catch (e: any) {
      console.error('删除历史记录失败:', e);
      alert('删除失败：' + (e?.message || '未知错误'));
    }
  }
}

async function applyHistoryItem(item: WallpaperHistoryItem) {
  if (applying.value) return;
  applying.value = true;
  
  try {
    const wallpaperData = {
      url: item.url,
      thumb: item.thumb,
      title: item.title,
      localPath: item.localPath // 添加本地路径信息
    };
    const res = await window.api?.applyWallpaper(wallpaperData);
    
    if (res?.success) {
      alert('已应用为壁纸');
      await loadHistory(); // 刷新历史记录
    } else {
      const reason = res?.error || '未知错误';
      alert('应用失败：' + reason);
    }
  } catch (e: any) {
    console.error('Apply history item error:', e);
    alert('应用失败：' + (e?.message || '未知错误'));
  } finally {
    applying.value = false;
  }
}

async function downloadHistoryItem(item: WallpaperHistoryItem) {
  if (downloading.value) return;
  downloading.value = true;
  
  try {
    const res = await window.api?.downloadImage(item.url);
    
    if (res?.ok) {
      alert('下载成功：' + res.path);
    } else {
      alert('下载失败：' + (res?.error || '未知错误'));
    }
  } catch (e: any) {
    console.error('Download history item error:', e);
    alert('下载失败：' + (e?.message || '未知错误'));
  } finally {
    downloading.value = false;
  }
}

function openHistoryPreview(index: number) {
  // 计算在完整历史列表中的实际索引
  const actualIndex = (currentHistoryPage.value - 1) * historyPageSize + index;
  currentPreviewIndex.value = actualIndex;
  previewVisible.value = true;
}

// 历史分页函数（复用顶部分页控制）
function prevHistoryPage() {
  if (currentHistoryPage.value > 1) {
    currentHistoryPage.value--;
  }
}

function nextHistoryPage() {
  if (currentHistoryPage.value < totalHistoryPages.value) {
    currentHistoryPage.value++;
  }
}

// 统一的分页处理函数
function handlePrevPage() {
  if (showHistory.value) {
    prevHistoryPage();
  } else {
    prev();
  }
}

function handleNextPage() {
  if (showHistory.value) {
    nextHistoryPage();
  } else {
    next();
  }
}

function handleHistoryImageError(event: Event) {
  const img = event.target as HTMLImageElement;
  const fallbackSvg = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
      <rect width="100" height="100" fill="#333"/>
      <text x="50" y="50" text-anchor="middle" dy="0.3em" fill="#666" font-size="12">图片加载失败</text>
    </svg>
  `)}`;
  img.src = fallbackSvg;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return '今天 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  } else if (diffDays === 1) {
    return '昨天 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  } else if (diffDays < 7) {
    return `${diffDays}天前`;
  } else {
    return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
  }
}

onMounted(() => {
  loadImages(currentPage.value);
  loadFooterText();
  
  setTimeout(() => {
    window.api?.preloadNextPage(currentPage.value + 1);
  }, 1000);
  
  document.addEventListener('keydown', handleKeydown);
});

// 获取图片URL，处理本地图片
function getImageUrl(url: string, isLocal?: boolean) {
  console.log('getImageUrl called with:', { url, isLocal });
  
  if (isLocal && url && !url.startsWith('http')) {
    // 本地图片，使用file://协议
    const fileUrl = `file://${url}`;
    console.log('Local image URL:', fileUrl);
    return fileUrl;
  }
  // 检查是否为本地文件路径（不以http开头且包含路径分隔符）
  if (url && !url.startsWith('http') && (url.includes('/') || url.includes('\\'))) {
    const fileUrl = `file://${url}`;
    console.log('Detected local file URL:', fileUrl);
    return fileUrl;
  }
  console.log('Using original URL:', url);
  return url;
}

// 导入图片功能
async function importImage() {
  try {
    const result = await window.api?.importImage();
    if (result?.success) {
      alert('图片导入成功！');
      // 刷新历史记录以显示新导入的图片
      await loadHistory();
    } else {
      alert('导入失败：' + (result?.error || '未知错误'));
    }
  } catch (e: any) {
    console.error('Import image error:', e);
    alert('导入失败：' + (e?.message || '未知错误'));
  }
}


onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown);
});
</script>

<style scoped>
.glass {
  backdrop-filter: blur(10px);
  background: rgba(42, 42, 42, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.center {
  display: flex;
  align-items: center;
  justify-content: center;
}

.-webkit-app-region-drag {
  -webkit-app-region: drag;
}

.-webkit-app-region-no-drag {
  -webkit-app-region: no-drag;
}

/* 网格容器样式 */
.grid-container {
  gap: 0.5rem;
  margin-top: 10px;
}

/* 图片容器 */
.image-container {
  position: relative;
  cursor: pointer;
  overflow: hidden;
  border-radius: 6px;
  -webkit-app-region: no-drag;
  aspect-ratio: 4/3;
  width: 100%;
  max-width: 100%;
  height: auto;
  min-height: 120px;
}

.image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.2s ease;
  -webkit-app-region: no-drag;
  display: block;
}

/* 悬浮时图片放大 */
.image-container:hover .image {
  transform: scale(1.05);
}

/* 按钮覆盖层 */
.button-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  opacity: 0;
  transition: opacity 0.2s ease;
  border-radius: 8px;
  pointer-events: none;
}

/* 悬浮时显示按钮 */
.image-container:hover .button-overlay {
  opacity: 1;
}

/* 按钮样式 */
.action-btn {
  padding: 4px 8px;
  font-size: 10px;
  background: rgba(255, 255, 255, 0.3);
  border: none;
  border-radius: 4px;
  color: white;
  cursor: pointer;
  transition: background-color 0.2s ease;
  -webkit-app-region: no-drag;
  pointer-events: auto;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.4);
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>


