import type { ModuleLayout } from '@/types/resume';

/**
 * 每个模板的默认模块布局。
 * profile 不在此列——它固定在侧栏首位，不参与拖拽排序。
 * 单栏模板（template4）sidebar 为空数组，所有模块放 main。
 */
export const DEFAULT_LAYOUTS: Record<string, ModuleLayout> = {
  template1: {
    sidebar: ['skillList', 'educationList', 'awardList'],
    main: ['workExpList', 'projectList', 'workList', 'aboutme'],
  },
  template2: {
    sidebar: ['skillList', 'educationList', 'awardList'],
    main: ['workExpList', 'projectList', 'workList', 'aboutme'],
  },
  template3: {
    sidebar: ['skillList', 'educationList', 'awardList'],
    main: ['workExpList', 'projectList', 'workList', 'aboutme'],
  },
  template4: {
    sidebar: [],
    main: ['workExpList', 'projectList', 'skillList', 'educationList', 'awardList', 'workList', 'aboutme'],
  },
};

/** 模板是否支持双栏布局 */
export function isTwoColumnTemplate(template: string): boolean {
  return template !== 'template4';
}

/** 获取当前生效的布局：用户自定义 > 模板默认 */
export function getEffectiveLayout(
  template: string,
  moduleLayout?: Record<string, ModuleLayout>,
): ModuleLayout {
  const custom = moduleLayout?.[template];
  if (custom) return custom;
  return DEFAULT_LAYOUTS[template] ?? DEFAULT_LAYOUTS.template1;
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
