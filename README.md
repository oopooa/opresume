<div align="center">

# OpResume

**无需登录、精美排版的在线简历制作工具** — 数据仅保存在本地，零泄露风险，随时导出

[![React](https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-5-646cff?logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06b6d4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[English](./README.en.md) | 简体中文

**[👉 立即体验](https://opresume.pages.dev)**

<img src="docs/images/mockup.webp" alt="OpResume 预览" width="800" />

</div>

## ✨ 核心功能

### 🎨 专业排版引擎
- **多维布局控制**：通过滑块自由调整页边距、模块间距和行高，告别 Word 排版噩梦。
- **多套经典模板**：7+ 套精选行业通用模板（含 ATS 友好风格、单栏商务布局、双栏布局以及应届生校园模板），一键切换。
- **应届生校园模板**：内置校徽/学校 logo 上传、栏目专属 Lucide 图标、一页 A4 紧凑排版，以及学术风格黑点/编号列表；默认内置东华大学校徽与应届生示例内容。
- **主题色定制**：8+ 套精心调配的预设主题色，匹配不同行业的视觉调性。
- **智能自动分页**：内容超出 A4 边界时自动视觉分页，并附带现代悬浮页码指示器。

### 🤖 AI 智能助手
- **AI 简历导入**：上传 PDF 简历，AI 自动解析并回填信息，快速迁移。
- **AI 内容润色**：一键优化简历内容，提升专业度与表达清晰度。

### 🚀 极致用户体验
- **所见即所得编辑**：侧边抽屉式表单编辑，主画布实时预览。
- **隐私保护模式**：一键打码模式，自动隐藏姓名、电话、邮箱等敏感信息，方便在社区分享求点评。
- **流畅拖拽排序**：基于 `@dnd-kit`，工作经历、项目描述等条目可自由拖拽排序。
- **富文本与智能计算**：基于 Tiptap 的富文本编辑器支持加粗、列表、链接；系统还能根据生日和起始日期自动计算年龄与工作年限。

### 🔒 数据安全与导出
- **无需登录、零上传**：所有数据仅保存在浏览器 `localStorage` 中，无后端、无数据库，隐私完全由你掌控。
- **JSON 导入/导出**：一键导出完整简历配置为 JSON 文件，用于备份、迁移或跨设备使用；导入已有配置即可瞬间恢复。
- **原生 PDF 导出**：使用浏览器原生 `window.print()` 进行高保真导出，文字可选中，且对 **ATS 友好**。

---

## 🚀 快速开始

### 环境要求

- [Node.js](https://nodejs.org) >= 18
- npm >= 8

### 安装与运行

```bash
# 1. 克隆仓库
git clone https://github.com/oopooa/opresume.git
cd opresume

# 2. 安装依赖
npm install

# 3. 启动开发服务器
npm run dev
```

在浏览器中打开 `http://localhost:5173`，即可开始制作你的完美简历。

### 构建与部署

```bash
# 生产构建
npm run build

# 预览构建产物
npm run preview
```

---

## 🏗️ 技术栈

| 类别 | 选型 |
|------|------|
| **核心框架** | React 18 + Vite 5 + TypeScript 5 |
| **UI 与样式** | Tailwind CSS 3 + shadcn/ui |
| **状态管理** | Zustand 5 |
| **富文本编辑** | Tiptap 3 |
| **拖拽排序** | @dnd-kit |
| **动画** | Framer Motion 11 |
| **国际化** | react-i18next |

---

## 🗺️ 路线图

- [x] 简历 JSON 导入/导出
- [x] 富文本编辑器
- [x] 模块拖拽排序
- [x] 双栏布局与栏目拖拽
- [x] 模板切换
- [x] 自定义排版设置
- [x] 智能分页（单栏模板）
- [x] 隐私打码模式
- [x] 国际化（i18n）支持
- [x] AI 简历导入
- [x] AI 润色
- [x] 应届生校园模板（校徽上传、栏目图标、一页 A4 适配）
- [x] 多 AI 提供商支持
- [ ] AI 简历评分与分析
- [ ] 多简历管理
- [ ] 智能一页适配
- [ ] 更多模板

---

## 📁 项目结构

```text
src/
├── components/
│   ├── Resume/            # 核心简历渲染引擎
│   │   ├── templates/     # 🌟 多套模板（自动注册）
│   │   └── modules/       # 基础模块渲染器（经历、教育、技能等）
│   ├── Editor/            # 侧边抽屉与动态表单
│   ├── Toolbar/           # 顶部工具栏（外观控制/导出）
│   ├── Settings/          # 设置面板（AI 提供商配置等）
│   └── ui/                # shadcn/ui 基础组件库
├── config/                # 配置文件
│   └── ai-providers/      # AI 提供商配置
├── store/                 # Zustand 状态切片
├── services/              # 业务逻辑（AI 生成/润色、PDF 解析、数据存储等）
├── hooks/                 # 自定义 hooks（分页、打码逻辑等）
└── types/                 # 全局 TypeScript 类型定义
```

---

## ⭐ Star History

<div align="center">

<a href="https://www.star-history.com/?repos=oopooa%2Fopresume&type=date&legend=top-left">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/chart?repos=oopooa/opresume&type=date&theme=dark&legend=top-left&sealed_token=8ZQ8VIV2gHILeT724qeK8LleA83fLyqrVo3Q4u3hbia8Z-Zg6qS-pfIedfjfKqn6in-MBxxcpQk46YF-ZFhd5he4sXq5t7CwBbCy3MIA-tZSBxq8p5T70VRQHZ_BnKkG7O6KDzkPmreqs5IVEo4VvPjoyBHsnexRDfQuH-uGRawZSQiZlt4tif9g7jNC" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/chart?repos=oopooa/opresume&type=date&legend=top-left&sealed_token=8ZQ8VIV2gHILeT724qeK8LleA83fLyqrVo3Q4u3hbia8Z-Zg6qS-pfIedfjfKqn6in-MBxxcpQk46YF-ZFhd5he4sXq5t7CwBbCy3MIA-tZSBxq8p5T70VRQHZ_BnKkG7O6KDzkPmreqs5IVEo4VvPjoyBHsnexRDfQuH-uGRawZSQiZlt4tif9g7jNC" />
   <img alt="Star History Chart" src="https://api.star-history.com/chart?repos=oopooa/opresume&type=date&legend=top-left&sealed_token=8ZQ8VIV2gHILeT724qeK8LleA83fLyqrVo3Q4u3hbia8Z-Zg6qS-pfIedfjfKqn6in-MBxxcpQk46YF-ZFhd5he4sXq5t7CwBbCy3MIA-tZSBxq8p5T70VRQHZ_BnKkG7O6KDzkPmreqs5IVEo4VvPjoyBHsnexRDfQuH-uGRawZSQiZlt4tif9g7jNC" />
 </picture>
</a>

</div>

---

## 📄 许可证

本项目基于 [MIT 许可证](LICENSE) 开源。欢迎 fork、提交 PR 或提出 issue！
