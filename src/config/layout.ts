import type { ModuleLayout } from '@/types/resume';
import { definitions, defaultDefinition } from '@/components/Resume/templates';

/**
 * 每个模板的默认模块布局，从模板定义的 defaultLayout 字段自动派生。
 * 新增模板时无需修改此文件——只要模板文件声明了 defaultLayout 即可。
 *
 * profile 不在此列——它固定在侧栏首位，不参与拖拽排序。
 */
export const DEFAULT_LAYOUTS: Record<string, ModuleLayout> = Object.fromEntries(
  Object.values(definitions).map((def) => [def.id, def.defaultLayout]),
);

/** 模板是否支持双栏布局（sidebar 非空即为双栏） */
export function isTwoColumnTemplate(template: string): boolean {
  const layout = DEFAULT_LAYOUTS[template];
  return layout ? layout.sidebar.length > 0 : true;
}

/** 获取当前生效的布局：用户自定义 > 模板默认 */
export function getEffectiveLayout(
  template: string,
  moduleLayout?: Record<string, ModuleLayout>,
): ModuleLayout {
  const custom = moduleLayout?.[template];
  if (custom) return custom;
  return DEFAULT_LAYOUTS[template] ?? defaultDefinition.defaultLayout;
}

/** 所有可排序的模块 ID（不含 profile） */
export const SORTABLE_MODULES = [
  'educationList',
  'workExpList',
  'projectList',
  'skillList',
  'awardList',
  'workList',
  'aboutme',
] as const;

/** 标题字号范围（px） */
export const TITLE_FONT_SIZE_RANGE = { min: 16, max: 24 } as const;

/** 正文字号范围（px） */
export const BODY_FONT_SIZE_RANGE = { min: 12, max: 16 } as const;
