# 浏览器冒烟测试手册（UI 链路）

> 目标：验证「UI 上传 PDF → AI 识别 → 预览 → 确认 → 填入当前 template7 模板」的完整浏览器链路。
> dev server 已在 **http://localhost:5173** 运行（端口探测 200 OK：`/editor`、`/api/resume`、`/api/avatar` 均正常）。
> 自动 harness 已验证核心链路（PDF 提取 → AI → 映射，6/6 PASS）；本手册补充 **UI 交互层**（对话框、预览、确认写回）。

## 前置

1. 打开 **http://localhost:5173/editor**（编辑器入口；landing 首页为 `/`）。
2. 右上角进入「设置 → AI 供应商」：
   - **qwen**：填真实 key → 点「检测」。预期：**通过**（DashScope 支持浏览器直连 CORS，实测 OPTIONS 200 + ACAO `*`）。模型选 **qwen3.8-max**。
   - **opencode**：填真实 key → 点「检测」。**预期会失败并提示 CORS/跨域**——这是已知限制（opencode 官方端点无 CORS 头，浏览器直连不可行；Node/服务端可用，本次自动测试已证明）。如需 UI 端使用需自备中转（设置中添加自定义供应商指向自建网关）。
3. 将 **qwen** 设为当前引擎（激活开关）。

## 冒烟步骤（约 3 分钟）

1. 工具栏 → **JSON 菜单 → 从 PDF 导入**（或直接拖拽 PDF 到对话框）。
2. 上传 `opresume/test-data/resumes/03-software-dev-en.pdf`（干净正例，最稳）。
   - 观察进度：①提取文本 → ②调用 AI（qwen3.8-max）→ ③预览。
3. 预览核对：姓名 Chen Yu、教育 1、工作 2（Alibaba Cloud / ByteDance）、项目 2、技能 5、奖项 1。**点击「确认导入」**。
4. 确认后检查主编辑区：template7 应显示新简历（教育/工作/项目/技能/奖项模块化展示），左侧编辑器可继续修改任意字段。
5. 按 **Ctrl+S** 保存（dev 模式会写回 `data/resume.json`）。

## 写回影响与恢复

**重要**：确认导入 + 保存后，dev 模式会把新简历写回 `opresume/data/resume.json`（覆盖当前默认模板，含本项目之前的简历润色内容）。若需恢复：

```bash
cd opresume
Copy-Item test-data\backups\resume-before-smoke.json data\resume.json -Force
# 如需要保持 demo 底稿同步：
Copy-Item data\resume.json src\config\sample-resume.zh-CN.json -Force
# 重新构建（发布用）：
npm run build
```

备份已生成：`test-data/backups/resume-before-smoke.json`（SHA 与冒烟前 `data/resume.json` 一致，已验证）。

## 可选：再跑 02 难点样本

上传 `02-latex-multi-page.pdf`：预期 email/phone 正确，姓名可能出现 "MARS"（图标噪声）——与自动测试观察一致，属于低质量 PDF 识别边界，非配置问题。

## 判定标准

- [ ] qwen 检测通过（浏览器 CORS 验证）
- [ ] 03 号 PDF 导入预览字段完整
- [ ] 确认后 template7 正常渲染、可编辑
- [ ] 冒烟后恢复默认模板（或确认接受覆盖）

> 注：本手册执行需要真实浏览器 + 真实 key（`.keys.env` 已按安全要求删除，key 请重新在设置面板填写，仅存于浏览器 localStorage）。