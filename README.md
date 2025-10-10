# 飞鱼壁纸
一个基于 Electron + Vue 3 + TypeScript 开发的小而美的桌面壁纸应用，提供高质量壁纸的浏览、预览、下载和应用功能。主打简洁、美观、轻量。

# 开发初衷
自我换macbook之后，发现在Mac电脑上 壁纸资源太少 好用的壁纸软件在壁纸商城里又收费使用网站上下载的破解版壁纸软件又经常签名过期导致无法使用，所以就想着自己开发一个简单小巧的壁纸软件 点击就能使用没有那么多花里胡哨所以也就有了此项目--->飞鱼壁纸。


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


### 下载配置

- 默认下载路径：用户选择的文件夹
- 文件命名：`wallpaper-{timestamp}.jpg`
- 支持格式：JPG, PNG




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
