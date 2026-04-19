<div align="center">

# OpResume

**No login, beautifully crafted online resume builder** — Data stored locally only, zero leak risk, export anytime

[![React](https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-5-646cff?logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06b6d4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[简体中文](./README.md) | English

**[👉 Get Started](https://opresume.pages.dev)**

<img src="docs/images/mockup1.png" alt="OpResume Preview" width="800" />

</div>

## ✨ Key Features

### 🎨 Professional Typesetting Engine
- **Multi-dimensional layout control**: Freely adjust margins, section spacing, and line height with sliders — no more Word formatting nightmares.
- **Multiple classic templates**: 4+ carefully curated industry-standard templates (including ATS-friendly styles, single-column corporate layouts, etc.) with seamless one-click switching.
- **Theme color customization**: 8+ meticulously crafted preset color themes to match the visual tone of different industries.
- **Smart auto-pagination**: Automatic visual page breaks when content exceeds A4 boundaries, with a modern floating page indicator.

### 🚀 Ultimate User Experience
- **WYSIWYG editing**: Sidebar drawer-style form editing with real-time preview on the main canvas.
- **Privacy protection mode**: One-click redaction mode that automatically masks name, phone, email, and other sensitive info — perfect for sharing resumes in communities for review.
- **Smooth drag & drop sorting**: Powered by `@dnd-kit`, entries within work experience, project descriptions, and other sections can be freely reordered via drag and drop.
- **Rich text & smart calculation**: Tiptap-based rich text editor supports bold, lists, and links; the system also auto-calculates age and years of experience from birthday and start date.

### 🔒 Data Security & Export
- **No login, zero upload**: All data is stored exclusively in the browser's `localStorage` — no backend, no database, your privacy is fully in your hands.
- **JSON import/export**: One-click export of your complete resume configuration as a JSON file for backup, migration, or cross-device use; import existing configurations to restore instantly.
- **Native PDF export**: Uses the browser's native `window.print()` for high-fidelity export, with selectable text and **ATS-friendly** output.

---

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org) >= 18
- npm >= 8

### Installation & Running

```bash
# 1. Clone the repository
git clone https://github.com/oopooa/opresume.git
cd opresume

# 2. Install dependencies
npm install

# 3. Start the dev server
npm run dev
```

Open `http://localhost:5173` in your browser and start crafting your perfect resume.

### Build & Deploy

```bash
# Build for production
npm run build

# Preview the build
npm run preview
```

---

## 🏗️ Tech Stack

| Category | Choice |
|----------|--------|
| **Core Framework** | React 18 + Vite 5 + TS 5 |
| **UI & Styling** | Tailwind CSS 3 + shadcn/ui |
| **State Management** | Zustand 5 |
| **Rich Text Editing** | Tiptap 3 |
| **Drag & Drop** | @dnd-kit |
| **Internationalization** | react-i18next |

---

## 🗺️ Roadmap

- [x] Resume JSON import/export
- [x] Rich text editor
- [x] Drag & drop module sorting
- [x] Two-column layout with section drag & drop
- [x] Template switching
- [x] Custom typography settings
- [x] Smart pagination (single-column templates)
- [x] Privacy redaction mode
- [x] Internationalization (i18n) support
- [x] AI-powered resume import
- [ ] AI resume scoring & analysis
- [ ] Multiple resume management
- [ ] Smart fit-to-page
- [ ] More templates

---

## 📁 Project Structure

```text
src/
├── components/
│   ├── Resume/            # Core resume rendering engine
│   │   ├── templates/     # 🌟 Multiple templates (auto-registered)
│   │   └── modules/       # Base module renderers (experience, education, skills, etc.)
│   ├── Editor/            # Sidebar drawer & dynamic forms
│   ├── Toolbar/           # Top toolbar (appearance controls / export)
│   └── ui/                # shadcn/ui base component library
├── store/                 # Zustand state slices
├── services/              # Pure local IO operations (load / save / migrate data)
├── hooks/                 # Custom hooks (pagination, redaction logic, etc.)
└── types/                 # Global TypeScript type definitions
```

---

## ⭐ Star History

<div align="center">

<a href="https://star-history.com/#oopooa/opresume&Date">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=oopooa/opresume&type=Date&theme=dark" />
    <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=oopooa/opresume&type=Date" />
    <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=oopooa/opresume&type=Date" />
  </picture>
</a>

</div>

---

## 📄 License

This project is open-sourced under the [MIT License](LICENSE). Feel free to fork, submit PRs, or open issues!
