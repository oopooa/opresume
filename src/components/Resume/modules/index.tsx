import type { ReactNode, ComponentType } from 'react';
import type { ResumeConfig } from '@/types';
import type { TemplateDefinition, ModuleProps } from '../types';
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

/**
 * 根据模板定义和布局配置，生成 sidebar 和 main 区域的已排序渲染节点。
 */
export function useTemplateModules(
  def: TemplateDefinition,
  config: ResumeConfig,
): { sidebarContent: ReactNode; mainContent: ReactNode } {
  const layout = getEffectiveLayout(def.id, config.moduleLayout);
  const tokens = def.getTokens();

  function renderModule(key: string): ReactNode {
    const Mod = DEFAULT_MODULES[key];
    if (!Mod) return null;
    return <div key={key} className="resume-module"><Mod config={config} tokens={tokens} /></div>;
  }

  return {
    sidebarContent: <>{layout.sidebar.map((k) => renderModule(k))}</>,
    mainContent: <>{layout.main.map((k) => renderModule(k))}</>,
  };
}
