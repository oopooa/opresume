import type { ReactNode, ComponentType } from 'react';
import type { ResumeConfig, ModuleLayout } from '@/types';

/** 渲染区域：侧栏 or 主栏，用于 Template3 按区域返回不同 tokens */
export type RenderZone = 'sidebar' | 'main';

/** 样式令牌 — 控制共享模块的视觉差异 */
export interface StyleTokens {
  spacing: {
    module: string;
    item: string;
  };
  typography: {
    titleWeight: string;
    titleSize: string;
    contentSize: string;
  };
  colors: {
    primary: string;
    secondary: string;
    muted: string;
  };
  components: {
    SectionTitle: ComponentType<{ title: string }>;
  };
  variants: {
    skill: 'bar' | 'list' | 'tags';
    project: 'compact' | 'detailed';
    education: 'inline' | 'stacked';
  };
  layout: {
    awardTimeInline: boolean;
    flexAlign: string;
  };

  /** @deprecated 使用 spacing.module */
  moduleSpacing?: string;
  /** @deprecated 使用 colors.primary */
  textPrimary?: string;
  /** @deprecated 使用 colors.secondary */
  textSecondary?: string;
  /** @deprecated 使用 colors.muted */
  textMuted?: string;
  /** @deprecated 使用 components.SectionTitle */
  SectionTitle?: ComponentType<{ title: string }>;
  /** @deprecated 使用 variants.education */
  educationInline?: boolean;
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
