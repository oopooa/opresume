import type { ReactNode, ComponentType } from 'react';
import type { JsonResume } from '@/types/json-resume';
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
import { CustomModule } from './CustomModule';

/** 内置模块组件映射表 */
export const MODULE_COMPONENTS: Record<string, ComponentType<ModuleProps>> = {
  educationList: EducationModule,
  awardList: AwardModule,
  workExpList: WorkExpModule,
  projectList: ProjectModule,
  workList: WorkListModule,
  aboutme: AboutMeModule,
  skillList: SkillModule,
};

/** 判断模块 ID 是否为自定义模块（以 custom- 开头） */
export function isCustomModule(key: string): boolean {
  return key.startsWith('custom-');
}

/**
 * 根据模板定义和布局配置，生成 sidebar 和 main 区域的已排序渲染节点。
 */
export function useTemplateModules(
  def: TemplateDefinition,
  config: JsonResume,
): { sidebarContent: ReactNode; mainContent: ReactNode } {
  const layout = getEffectiveLayout(def.id, config['x-op-moduleLayout']);
  const tokens = def.getTokens();

  function renderModule(key: string): ReactNode {
    /* 自定义模块使用专用组件渲染 */
    if (isCustomModule(key)) {
      return (
        <div key={key} className="resume-module" data-module-key={key}>
          <CustomModule moduleId={key} config={config} tokens={tokens} />
        </div>
      );
    }

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
  config: JsonResume,
  tokens: StyleTokens,
): ReactNode {
  return (
    <>
      {slices.map((slice) => {
        const key = `${slice.moduleKey}-${slice.startItem}`;

        /* 自定义模块使用专用组件渲染 */
        if (isCustomModule(slice.moduleKey)) {
          return (
            <div key={key} className="resume-module" data-module-key={slice.moduleKey}>
              <CustomModule
                moduleId={slice.moduleKey}
                config={config}
                tokens={tokens}
                showTitle={slice.showTitle}
              />
            </div>
          );
        }

        const Mod = MODULE_COMPONENTS[slice.moduleKey];
        if (!Mod) return null;
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
