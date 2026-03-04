import type { ReactNode, ComponentType } from 'react';
import type { ResumeConfig, ModuleLayout } from '@/types';

/** 渲染区域：侧栏 or 主栏，用于 Template3 按区域返回不同 tokens */
export type RenderZone = 'sidebar' | 'main';

/** 样式令牌 — 控制共享模块的视觉差异 */
export interface StyleTokens {
  /** 模块容器间距: "mb-4" | "mb-5" | "mb-6" */
  moduleSpacing: string;
  /** 标题/名称文字色: "text-gray-800" | "text-white" | "" */
  textPrimary: string;
  /** 次要文字色: "text-gray-600" | "text-gray-400" */
  textSecondary: string;
  /** 弱文字色: "text-gray-500" */
  textMuted: string;
  /** 该区域的 SectionTitle 组件 */
  SectionTitle: ComponentType<{ title: string }>;
  /** 奖项时间：true=括号内联, false=右对齐 */
  awardTimeInline: boolean;
  /** 教育条目：true=单行横排(T4), false=多行堆叠 */
  educationInline: boolean;
  /** flex 行内垂直对齐: "items-start" | "items-baseline" */
  flexAlign: string;
}

/** 共享模块组件的 props */
export interface ModuleProps {
  config: ResumeConfig;
  tokens: StyleTokens;
}

/** 模块覆盖组件 — 与共享模块使用相同的 props */
export type ModuleOverride = ComponentType<ModuleProps>;

/**
 * 模板定义 — 每个模板实现此接口。
 *
 * 新增模板只需在 templates/ 目录下新建文件并 default export 此接口的实现，
 * 即可被 import.meta.glob 自动发现和注册，无需手动修改其他文件。
 */
export interface TemplateDefinition {
  /** 模板唯一标识，同时用作 i18n 键名（`template.${id}`）和布局配置键 */
  id: string;
  /** 默认模块布局：sidebar 和 main 各放哪些模块（不含 profile） */
  defaultLayout: ModuleLayout;
  getTokens: (zone: RenderZone) => StyleTokens;
  moduleOverrides?: Record<
    string,
    | ModuleOverride
    | { sidebar?: ModuleOverride; main?: ModuleOverride }
  >;
  LayoutShell: ComponentType<LayoutShellProps>;
}

/** 布局壳 props */
export interface LayoutShellProps {
  config: ResumeConfig;
  sidebarContent: ReactNode;
  mainContent: ReactNode;
}
