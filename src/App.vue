<template>
  <div class="h-full w-full glass flex flex-col -webkit-app-region-drag">
    <header class="flex items-center justify-between px-3 py-2 border-b border-white/10 flex-shrink-0 -webkit-app-region-drag">
      <div class="text-sm font-semibold opacity-90 text-white pl-14">小而美壁纸--4K</div>
      <div class="flex items-center gap-3 text-xs opacity-80 text-white -webkit-app-region-no-drag">
        <button class="hover:opacity-100 hover:bg-white/10 px-2 py-1 rounded transition-all duration-200" @click="prev" :disabled="currentPage <= 1">← 上一页</button>
        <span class="text-xs opacity-60">{{ currentPage }}</span>
        <button class="hover:opacity-100 hover:bg-white/10 px-2 py-1 rounded transition-all duration-200" @click="next">下一页→</button>
      </div>
    </header>
    
    <div class="flex-1 px-3 py-3 flex flex-col -webkit-app-region-no-drag">
      <div v-if="loading" class="grid grid-cols-4 gap-1.5 flex-1">
        <div v-for="n in 8" :key="n" class="rounded-lg animate-pulse bg-white/10"></div>
      </div>
      <div v-else class="grid grid-cols-4 gap-1.5 flex-1">
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
          <div v-if="currentPreviewImage.copyright" class="text-xs opacity-70 mt-1">{{ currentPreviewImage.copyright }}</div>
          <div class="text-xs opacity-60 mt-2">{{ currentPreviewIndex + 1 }} / {{ images.length }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';

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
const footerText = ref('此软件 免费使用');
const hoveredIndex = ref(-1); // 新增：跟踪鼠标悬浮的图片索引

// 预览相关
const previewVisible = ref(false);
const currentPreviewIndex = ref(0);

const currentPreviewImage = computed(() => {
  return images.value[currentPreviewIndex.value];
});

async function loadImages(page: number) {
  loading.value = true;
  try {
    const result = await window.api?.fetchBingWallpapers(page);
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
  if (currentPreviewIndex.value > 0) {
    currentPreviewIndex.value--;
  } else {
    currentPreviewIndex.value = images.value.length - 1;
  }
}

function nextImage() {
  if (currentPreviewIndex.value < images.value.length - 1) {
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
    const res = await window.api?.applyWallpaper(img.url);
    console.log('Apply result:', res);
    
    if (res?.success) {
      alert('已应用为壁纸');
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

onMounted(() => {
  loadImages(currentPage.value);
  loadFooterText();
  
  setTimeout(() => {
    window.api?.preloadNextPage(currentPage.value + 1);
  }, 1000);
  
  document.addEventListener('keydown', handleKeydown);
});

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

/* 图片容器 */
.image-container {
  position: relative;
  cursor: pointer;
  overflow: hidden;
  border-radius: 8px;
  -webkit-app-region: no-drag;
}

.image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.2s ease;
  -webkit-app-region: no-drag;
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


