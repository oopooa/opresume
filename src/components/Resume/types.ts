import type { ReactNode, ComponentType } from 'react';
import type { JsonResume } from '@/types/json-resume';
import type { ModuleLayout } from '@/types/resume';
import type { Typography } from '@/types/theme';

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
    SectionTitle: ComponentType<{ title: string; icon?: string }>;
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
}

/** 共享模块组件的 props */
export interface ModuleProps {
  config: JsonResume;
  tokens: StyleTokens;
  /** 列表型模块的条目渲染范围 [start, end)，默认渲染全部 */
  itemRange?: [number, number];
  /** 是否显示模块标题（跨页续渲时为 false），默认 true */
  showTitle?: boolean;
}

/**
 * 模板定义 — 每个模板实现此接口。
 *
 * 新增模板只需在 templates/ 目录下新建文件并 default export 此接口的实现，
 * 即可被 import.meta.glob 自动发现和注册，无需手动修改其他文件。
 */
export interface TemplateDefinition {
  /** 模板唯一标识，同时用作 i18n 键名（`template.${id}`）和布局配置键 */
  id: string;
  /** 模板特征标签，值为 i18n 键名后缀（完整键名 `templateTag.${tag}`） */
  tags: string[];
  /** 默认模块布局：sidebar 和 main 各放哪些模块（不含 profile） */
  defaultLayout: ModuleLayout;
  /**
   * 模板默认字号 / 行高。未声明则回退到 GLOBAL_DEFAULT_TYPOGRAPHY（16/14/1.5）。
   * 学术模板 template5 用它把正文锁到 12px 以匹配目标 PDF；用户仍可在 AppearanceDrawer
   * 中调整（调整值按模板记忆，见 UIStore.typographyByTemplate / getEffectiveTypography）。
   */
  defaultTypography?: Typography;
  getTokens: () => StyleTokens;
  LayoutShell: ComponentType<LayoutShellProps>;
}

/** 布局壳 props */
export interface LayoutShellProps {
  config: JsonResume;
  sidebarContent: ReactNode;
  mainContent: ReactNode;
  /** 页码索引（0 = 首页含 Profile，1+ = 续页不含 Profile），默认 0 */
  pageIndex?: number;
}
