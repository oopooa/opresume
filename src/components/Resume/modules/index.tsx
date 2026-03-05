import type { ReactNode, ComponentType } from 'react';
import type { ResumeConfig } from '@/types';
import type { TemplateDefinition, RenderZone, ModuleProps, ModuleOverride } from '../types';
import { getEffectiveLayout } from '@/config/layout';

import { EducationModule } from './EducationModule';
import { AwardModule } from './AwardModule';
import { WorkExpModule } from './WorkExpModule';
import { ProjectModule } from './ProjectModule';
import { WorkListModule } from './WorkListModule';
import { AboutMeModule } from './AboutMeModule';
import { SkillModule } from './SkillModule';

/** 共享默认模块映射 */
const DEFAULT_MODULES: Record<string, ComponentType<ModuleProps>> = {
  educationList: EducationModule,
  awardList: AwardModule,
  workExpList: WorkExpModule,
  projectList: ProjectModule,
  workList: WorkListModule,
  aboutme: AboutMeModule,
  skillList: SkillModule,
};

/** 解析 override：支持统一组件或按 zone 区分 */
function resolveOverride(
  raw: ModuleOverride | { sidebar?: ModuleOverride; main?: ModuleOverride },
  zone: RenderZone,
): ComponentType<ModuleProps> | undefined {
  // 含 sidebar/main 键的对象 → zone 感知
  if ('sidebar' in raw || 'main' in raw) {
    return (raw as { sidebar?: ModuleOverride; main?: ModuleOverride })[zone];
  }
  // 否则视为统一组件
  return raw as ComponentType<ModuleProps>;
}

/**
 * 根据模板定义和布局配置，生成 sidebar 和 main 区域的已排序渲染节点。
 */
export function useTemplateModules(
  def: TemplateDefinition,
  config: ResumeConfig,
): { sidebarContent: ReactNode; mainContent: ReactNode } {
  const layout = getEffectiveLayout(def.id, config.moduleLayout);

  function renderModule(key: string, zone: RenderZone): ReactNode {
    const tokens = def.getTokens(zone);

    // 查找 override（支持 zone 感知）
    const raw = def.moduleOverrides?.[key];
    if (raw) {
      const Override = resolveOverride(raw, zone);
      if (Override) {
        return <div key={key}><Override config={config} tokens={tokens} /></div>;
      }
    }

    // 使用共享默认渲染器
    const Mod = DEFAULT_MODULES[key];
    if (!Mod) return null;
    return <div key={key}><Mod config={config} tokens={tokens} /></div>;
  }

  return {
    sidebarContent: <>{layout.sidebar.map((k) => renderModule(k, 'sidebar'))}</>,
    mainContent: <>{layout.main.map((k) => renderModule(k, 'main'))}</>,
  };
}
