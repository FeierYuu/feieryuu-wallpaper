# 飞鱼壁纸
一个基于 Electron + Vue 3 + TypeScript 开发的小而美的桌面壁纸应用，提供高质量壁纸的浏览、预览、下载和应用功能。主打简洁、美观、轻量，经过深度优化，体积仅43MB！

## ✨ 功能特性

- 🖼️ **多分类壁纸**：支持9种分类（4K高清、风景、妹子、游戏、影视剧照、炫酷、明星、汽车、动漫）
- 👀 **图片预览**：点击图片即可全屏预览
- 💾 **一键下载**：支持自定义下载路径
- 🎨 **一键应用**：直接设置为桌面壁纸
- 📚 **历史记录**：查看和管理已应用的壁纸历史
- 🎯 **简洁界面**：现代化 UI 设计，支持毛玻璃效果
- 🖱️ **窗口拖拽**：无边框设计，支持拖拽移动
- ⚡ **极速加载**：优化的图片加载和缓存机制
- 🚀 **轻量设计**：经过深度优化，安装包仅43MB

## 🚀 体积优化亮点

### 📊 优化效果对比
| 项目 | 优化前 | 优化后 | 减少量 |
|------|--------|--------|--------|
| **ZIP安装包** | 103MB | 43MB | **-60MB (58%减少)** |
| **DMG安装包** | 108MB | 87MB | **-21MB (19%减少)** |
| **应用包** | 64MB | 14MB | **-50MB (78%减少)** |

### 🔧 优化措施
- ✅ **移除大型依赖**：移除Element Plus UI库（约30MB）
- ✅ **精简状态管理**：移除Pinia，使用Vue原生响应式
- ✅ **原生HTTP请求**：移除Axios，使用原生fetch API
- ✅ **代码压缩优化**：配置Terser压缩，移除console和debugger
- ✅ **构建优化**：优化Vite配置，启用最大压缩模式
- ✅ **文件精简**：移除不必要的语言包和资源文件

## 🛠️ 技术栈

- **前端框架**：Vue 3 + TypeScript
- **桌面框架**：Electron
- **样式框架**：Tailwind CSS
- **构建工具**：Vite + Terser
- **包管理器**：pnpm

## 📦 安装与运行

### 环境要求

- Node.js >= 16.0.0
- pnpm >= 7.0.0

### 安装依赖

```bash
pnpm install
```

### 开发模式

```bash
# 启动前端开发服务器
pnpm run dev

# 启动 Electron 应用
pnpm run electron:dev
```

### 构建应用

```bash
# 构建前端资源
pnpm run build:renderer

# 打包 Electron 应用
pnpm run build
```

## 🚀 使用说明

1. **浏览壁纸**：应用启动后自动加载第一页壁纸
2. **翻页浏览**：使用"上一页"/"下一页"按钮切换页面
3. **预览图片**：点击任意图片进行全屏预览
4. **下载壁纸**：鼠标悬浮在图片上，点击"下载"按钮
5. **应用壁纸**：鼠标悬浮在图片上，点击"应用"按钮

## 📁 项目结构

```
feieryuu-wallpaper/
├── src/                    # 前端源码
│   ├── App.vue            # 主应用组件
│   ├── main.ts            # 应用入口
│   ├── style.css          # 全局样式
│   └── types/             # TypeScript 类型定义
├── electron-main.js       # Electron 主进程
├── preload.cjs           # 预加载脚本
├── package.json          # 项目配置
├── vite.config.ts        # Vite 配置
├── tailwind.config.cjs   # Tailwind CSS 配置
└── tsconfig.json         # TypeScript 配置
```

## 🔧 配置说明

### API 配置

应用使用以下 API 获取壁纸数据：
- 主要 API：`nguaduot.cn` (bizhihui)
- 备用 API：`nguaduot.cn` (snake)
- 兜底 API：Picsum Photos

### 下载配置

- 默认下载路径：用户选择的文件夹
- 文件命名：`wallpaper-{timestamp}.jpg`
- 支持格式：JPG, PNG

## 🎨 界面预览

- **主界面**：4x2 网格布局展示壁纸缩略图
- **悬浮效果**：鼠标悬浮显示下载/应用按钮
- **预览模式**：全屏图片预览，支持键盘导航
- **毛玻璃效果**：现代化的半透明背景设计

## 📝 开发说明

### 主要功能模块

1. **图片获取模块** (`electron-main.js`)
   - 从多个 API 源获取壁纸数据
   - 实现图片缓存和预加载
   - 处理网络请求和错误重试

2. **壁纸应用模块** (`electron-main.js`)
   - 下载图片到本地
   - 使用 AppleScript 设置 macOS 壁纸
   - 支持自定义下载路径

3. **UI 交互模块** (`src/App.vue`)
   - Vue 3 Composition API
   - 响应式数据管理
   - 图片预览和导航

### 调试模式

开发模式下会自动打开 DevTools，方便调试：
- 主进程日志：终端输出
- 渲染进程日志：DevTools Console
- 网络请求：DevTools Network

## 🤝 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📝 版本更新

### v0.2.0 - 体积优化版本 (2024-10-06)

#### 🎉 新功能
- ✨ 新增9种壁纸分类选择功能
- 📚 新增历史记录管理功能
- 🎨 优化界面布局和用户体验

#### 🚀 重大优化
- 📦 **体积大幅减少**：ZIP包从103MB减少到43MB（减少58%）
- ⚡ **启动速度提升**：移除大型依赖，应用启动更快
- 💾 **内存占用减少**：精简代码，运行时内存占用更少
- 🔧 **技术栈优化**：移除Element Plus、Pinia、Axios等大型依赖

#### 🐛 问题修复
- 修复打包后应用无法显示内容的问题
- 修复历史按钮点击事件失效问题
- 优化资源路径和文件加载

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🙏 致谢

- [Electron](https://electronjs.org/) - 跨平台桌面应用框架
- [Vue.js](https://vuejs.org/) - 渐进式 JavaScript 框架
- [Tailwind CSS](https://tailwindcss.com/) - 实用优先的 CSS 框架
- [nguaduot.cn](https://nguaduot.cn/) - 壁纸数据源

## 📞 联系方式

如有问题或建议，请通过以下方式联系：

- 提交 Issue：[GitHub Issues](https://github.com/feierYuu/feieryuu-wallpaper/issues)
- 邮箱：1965214761@qq.com

---

⭐ 如果这个项目对你有帮助，请给它一个星标！
