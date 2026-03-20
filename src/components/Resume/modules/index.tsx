import type { ReactNode, ComponentType } from 'react';
import type { ExtendedJSONResume } from '@/types/extended-json-resume';
import type { TemplateDefinition, ModuleProps, StyleTokens } from '../types';
import type { PageSlice } from '@/utils/pagination';
import { getEffectiveLayout } from '@/config/layout';

import { EducationModule } from './EducationModule';
import { AwardModule } from './AwardModule';
import { WorkExpModule } from './WorkExpModule';
import { ProjectModule } from './ProjectModule';
import { WorkListModule } from './WorkListModule';
import { AboutMeModule } from './AboutMeModule';
import { SkillModule } from './SkillModule';

/** 模块组件映射表 */
export const MODULE_COMPONENTS: Record<string, ComponentType<ModuleProps>> = {
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
  config: ExtendedJSONResume,
): { sidebarContent: ReactNode; mainContent: ReactNode } {
  const layout = getEffectiveLayout(def.id, config['x-op-moduleLayout']);
  const tokens = def.getTokens();

  function renderModule(key: string): ReactNode {
    const Mod = MODULE_COMPONENTS[key];
    if (!Mod) return null;
    return (
      <div key={key} className="resume-module" data-module-key={key}>
        <Mod config={config} tokens={tokens} />
      </div>
    );
  }

  return {
    sidebarContent: <>{layout.sidebar.map((k) => renderModule(k))}</>,
    mainContent: <>{layout.main.map((k) => renderModule(k))}</>,
  };
}

/**
 * 根据分页切片渲染单页内的模块列表。
 */
export function renderPageSlices(
  slices: PageSlice[],
  config: ExtendedJSONResume,
  tokens: StyleTokens,
): ReactNode {
  return (
    <>
      {slices.map((slice) => {
        const Mod = MODULE_COMPONENTS[slice.moduleKey];
        if (!Mod) return null;
        const key = `${slice.moduleKey}-${slice.startItem}`;
        const hasItems = slice.endItem > 0;
        return (
          <div key={key} className="resume-module" data-module-key={slice.moduleKey}>
            <Mod
              config={config}
              tokens={tokens}
              showTitle={slice.showTitle}
              itemRange={hasItems ? [slice.startItem, slice.endItem] : undefined}
            />
          </div>
        );
      })}
    </>
  );
}
