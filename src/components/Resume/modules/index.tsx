import type { ReactNode, ComponentType } from 'react';
import type { JsonResume } from '@/types/json-resume';
import type { TemplateDefinition, ModuleProps, StyleTokens } from '../types';
import type { PageSlice } from '@/utils/pagination';
import { getEffectiveLayout } from '@/config/layout';

import { EducationModule } from './EducationModule';
import { AwardModule } from './AwardModule';
import { AchievementModule } from './AchievementModule';
import { WorkExpModule } from './WorkExpModule';
import { ProjectModule } from './ProjectModule';
import { WorkListModule } from './WorkListModule';
import { AboutMeModule } from './AboutMeModule';
import { SkillModule } from './SkillModule';
import { CustomModule } from './CustomModule';
import { CAMPUS_EXTRA_MODULES, CAMPUS_STYLE_OVERRIDES, CAMPUS_TEMPLATE_ID } from './CampusModules';

/** 内置模块组件映射表 */
export const MODULE_COMPONENTS: Record<string, ComponentType<ModuleProps>> = {
  educationList: EducationModule,
  awardList: AwardModule,
  achievementList: AchievementModule,
  workExpList: WorkExpModule,
  projectList: ProjectModule,
  workList: WorkListModule,
  aboutme: AboutMeModule,
  skillList: SkillModule,
};

/**
 * 模板级模块解析：校徽单栏模板（template7）可覆盖共享模块的渲染（见 CampusModules.tsx）。
 */
export function getModuleComponent(templateId: string, key: string): ComponentType<ModuleProps> | undefined {
  if (templateId === CAMPUS_TEMPLATE_ID) {
    const dhu = CAMPUS_STYLE_OVERRIDES[key];
    if (dhu) return dhu;
    const extra = CAMPUS_EXTRA_MODULES[key];
    if (extra) return extra;
  }
  return MODULE_COMPONENTS[key];
}

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
  const sidebarTokens = def.getSidebarTokens?.() ?? tokens;

  function renderModule(key: string, t: StyleTokens): ReactNode {
    if (isCustomModule(key)) {
      return (
        <div key={key} className="resume-module" data-module-key={key}>
          <CustomModule moduleId={key} config={config} tokens={t} />
        </div>
      );
    }

    const Mod = getModuleComponent(def.id, key);
    if (!Mod) return null;
    return (
      <div key={key} className="resume-module" data-module-key={key}>
        <Mod config={config} tokens={t} />
      </div>
    );
  }

  return {
    sidebarContent: <>{layout.sidebar.map((k) => renderModule(k, sidebarTokens))}</>,
    mainContent: <>{layout.main.map((k) => renderModule(k, tokens))}</>,
  };
}

/**
 * 根据分页切片渲染单页内的模块列表。
 */
export function renderPageSlices(
  slices: PageSlice[],
  config: JsonResume,
  tokens: StyleTokens,
  templateId?: string,
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

        const Mod = getModuleComponent(templateId ?? '', slice.moduleKey);
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
