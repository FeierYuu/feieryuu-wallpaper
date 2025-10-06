# 小而美壁纸应用

一个基于 Electron + Vue 3 + TypeScript 开发的桌面壁纸应用，提供高质量壁纸的浏览、预览、下载和应用功能。

## ✨ 功能特性

- 🖼️ **高质量壁纸**：从 nguaduot.cn API 获取 4K 高清壁纸
- 👀 **图片预览**：点击图片即可全屏预览
- 💾 **一键下载**：支持自定义下载路径
- 🎨 **一键应用**：直接设置为桌面壁纸
- 🎯 **简洁界面**：现代化 UI 设计，支持毛玻璃效果
- 🖱️ **窗口拖拽**：无边框设计，支持拖拽移动
- ⚡ **快速加载**：优化的图片加载和缓存机制

## 🛠️ 技术栈

- **前端框架**：Vue 3 + TypeScript
- **桌面框架**：Electron
- **样式框架**：Tailwind CSS
- **构建工具**：Vite
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

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🙏 致谢

- [Electron](https://electronjs.org/) - 跨平台桌面应用框架
- [Vue.js](https://vuejs.org/) - 渐进式 JavaScript 框架
- [Tailwind CSS](https://tailwindcss.com/) - 实用优先的 CSS 框架
- [nguaduot.cn](https://nguaduot.cn/) - 壁纸数据源

## 📞 联系方式

如有问题或建议，请通过以下方式联系：

- 提交 Issue：[GitHub Issues](https://github.com/你的用户名/feieryuu-wallpaper/issues)
- 邮箱：your-email@example.com

---

⭐ 如果这个项目对你有帮助，请给它一个星标！
