<div align="center">

# OpResume

**纯本地、高颜值的专业简历生成器** — Fork 即用，实时预览，安全导出

[![React](https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-5-646cff?logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06b6d4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**[👉 在线体验 Live Demo](https://opresume.pages.dev)**

</div>

## ✨ 核心特性

### 🎨 专业的排版引擎
- **多维度外观控制**：页边距、模块间距、行间距自由滑动调节，告别 Word 排版地狱。
- **多套经典模板**：内置 4+ 套经过严格筛选的行业经典模板（涵盖大厂 ATS 风格、外企单栏风等），一键无缝切换。
- **主题配色定制**：8+ 款精心调配的预设主题色，适应不同行业的视觉调性。
- **自动智能分页**：内容超出 A4 纸范围时自动视觉分页，并带有现代化的悬浮页码指示器。

### 🚀 极致的用户体验
- **所见即所得**：侧边栏抽屉式表单编辑，主画布实时渲染预览。
- **隐私保护模式**：一键开启“打码模式”，自动隐藏姓名、手机、邮箱等敏感信息，方便简历在社区分享与 Review。
- **丝滑拖拽排序**：基于 `@dnd-kit`，工作经历、项目描述等模块内的条目均可自由拖拽调整顺序。
- **富文本与智能推算**：基于 Tiptap 的富文本编辑器支持加粗、列表与链接；系统还会根据生日和入职时间自动推算年龄与工作年限。

### 🔒 纯净的本地架构
- **无后端无数据库**：开发模式下利用 Vite API 中间件直接读写本地 `data/resume.json`；生产环境下纯依靠 `localStorage`，数据绝不上云。
- **原生 PDF 导出**：不依赖第三方 PDF 渲染库，直接基于浏览器原生的 `window.print()` 实现高保真导出，**文字可被 ATS 机器完美解析**。

---

## 🚀 快速开始

### 环境要求

- [Node.js](https://nodejs.org) >= 18
- npm >= 8

### 安装与运行

```bash
# 1. 克隆项目
git clone https://github.com/oopooa/opresume.git
cd opresume

# 2. 安装依赖
npm install

# 3. 启动开发服务器
npm run dev
```

浏览器访问 `http://localhost:5173`，即可开始编辑属于你的完美简历。

### 构建与部署

```bash
# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

---

## 🏗️ 技术栈

| 类别 | 选型 |
|------|------|
| **基础框架** | React 18 + Vite 5 + TS 5 |
| **UI 与样式** | Tailwind CSS 3 + shadcn/ui |
| **状态管理** | Zustand 5 |
| **富文本编辑** | Tiptap 3 |
| **拖拽交互** | @dnd-kit |
| **国际化** | react-i18next |

---

## 📁 项目结构

```text
src/
├── components/
│   ├── Resume/            # 简历渲染核心引擎
│   │   ├── templates/     # 🌟 多套模板（基于自动注册机制）
│   │   └── modules/       # 基础模块渲染（经历、教育、技能等）
│   ├── Editor/            # 侧边栏抽屉与动态表单
│   ├── Toolbar/           # 顶部工具栏（外观控制/导出）
│   └── ui/                # shadcn/ui 基础组件库
├── store/                 # Zustand 状态切片
├── services/              # 纯本地的 IO 操作（加载/保存/迁移数据）
├── hooks/                 # 自定义 Hooks（分页计算、打码逻辑等）
└── types/                 # 全局 TypeScript 接口定义
```

---

## 📄 许可证

本项目基于 [MIT 协议](LICENSE) 开源。欢迎 Fork、提交 PR 或提 Issue 探讨！
